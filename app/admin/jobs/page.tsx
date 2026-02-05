'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST';
  schedule?: string;
}

interface JobLog {
  id: string;
  job_name: string;
  job_type: 'scheduled' | 'manual' | 'api';
  status: 'success' | 'error' | 'skipped';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  result: any;
  error_message: string | null;
  metadata: any;
}

interface ContentLog {
  id: string;
  job_id: string;
  timestamp: string;
  log_data: any;
}

const jobs: Job[] = [
  {
    id: 'content-intelligence',
    name: 'Content Intelligence',
    description: 'Evaluates content opportunities and generates the highest-value post. Finds opportunities from tournaments, calendar, Marshall\'s state, scores them, and generates a post if score > 50.',
    endpoint: '/api/jobs/content-intelligence',
    method: 'POST',
    schedule: 'Daily at 6 AM CT (12 PM UTC)',
  },
  {
    id: 'content-intelligence-eval',
    name: 'Evaluate Opportunities (No Generation)',
    description: 'Evaluate opportunities without generating posts. Useful for debugging and seeing what opportunities are available.',
    endpoint: '/api/jobs/content-intelligence',
    method: 'GET',
  },
  {
    id: 'atp-sync',
    name: 'ATP Calendar Sync',
    description: 'Sync tournament schedule from static calendar or Sportradar API to atp_calendar table.',
    endpoint: '/api/calendar/sync-atp',
    method: 'POST',
    schedule: 'Weekly (Sunday 12 AM UTC) or manual',
  },
  {
    id: 'generate-post',
    name: 'Generate Post (Manual)',
    description: 'Manually generate a post from the best available opportunity. Same as clicking "Generate Post" in queue.',
    endpoint: '/api/posts/generate',
    method: 'POST',
  },
];

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'logs'>('jobs');
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, any>>({});
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [contentLogs, setContentLogs] = useState<Record<string, ContentLog>>({});
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  
  // Post generation options
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<string>('auto');
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, selectedJobFilter]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const jobName = selectedJobFilter === 'all' ? undefined : selectedJobFilter;
      const response = await fetch(`/api/jobs/logs?limit=100${jobName ? `&job_name=${jobName}` : ''}`);
      const data = await response.json();
      setLogs(data.logs || []);
      
      // Fetch detailed content logs for content-intelligence jobs
      if (jobName === 'all' || jobName === 'content-intelligence') {
        const contentLogsResponse = await fetch(`/api/jobs/content-logs?limit=100`);
        const contentLogsData = await contentLogsResponse.json();
        if (contentLogsData.success && contentLogsData.logs) {
          // Map content logs by job_id for easy lookup
          const logsMap: Record<string, ContentLog> = {};
          contentLogsData.logs.forEach((log: ContentLog) => {
            logsMap[log.job_id] = log;
          });
          setContentLogs(logsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const runJob = async (job: Job, options?: { type?: string; topic?: string; category?: string }) => {
    setRunningJobs(prev => new Set(prev).add(job.id));
    
    try {
      // Build request body for POST requests
      let body: any = {};
      
      // Special handling for "Generate Post (Manual)" job
      if (job.id === 'generate-post' && options) {
        // Pass type directly - API will handle mapping to ContentOpportunity
        if (options.type && options.type !== 'auto') {
          body.type = options.type;
        }
        
        if (options.topic) {
          body.topic = options.topic;
        }
        
        if (options.category) {
          body.category = options.category;
        }
      }
      
      const response = await fetch(job.endpoint, {
        method: job.method,
        headers: job.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: job.method === 'POST' ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [job.id]: {
          success: response.ok,
          data,
          timestamp: new Date().toISOString(),
        },
      }));

      // Refresh logs if on logs tab
      if (activeTab === 'logs') {
        setTimeout(() => fetchLogs(), 1000); // Wait a bit for log to be written
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [job.id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setRunningJobs(prev => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'skipped': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const uniqueJobNames = Array.from(new Set(logs.map(log => log.job_name)));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Background Jobs</h1>
          <p className="text-lg text-gray-600">
            Run background jobs on-demand and view execution logs
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Execution Logs
            </button>
          </nav>
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <>
            <div className="grid grid-cols-1 gap-6">
              {jobs.map(job => {
                const isRunning = runningJobs.has(job.id);
                const result = results[job.id];
                
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-lg shadow border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            job.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {job.method}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {job.endpoint}
                          </code>
                          {job.schedule && (
                            <>
                              <span>•</span>
                              <span>Schedule: {job.schedule}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Show modal for "Generate Post (Manual)" job
                          if (job.id === 'generate-post') {
                            setShowPostTypeModal(true);
                          } else {
                            runJob(job);
                          }
                        }}
                        disabled={isRunning}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ml-4 ${
                          isRunning
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isRunning ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Running...
                          </span>
                        ) : (
                          '▶ Run Job'
                        )}
                      </button>
                    </div>

                    {/* Results */}
                    {result && (
                      <div className={`mt-4 p-4 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.success ? '✅ Success' : '❌ Error'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto bg-white p-3 rounded border border-gray-200 mt-2">
                          {JSON.stringify(result.data || result.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    const job = jobs.find(j => j.id === 'content-intelligence');
                    if (job) runJob(job);
                  }}
                  disabled={runningJobs.has('content-intelligence')}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Post Now
                </button>
                <button
                  onClick={() => {
                    const job = jobs.find(j => j.id === 'content-intelligence-eval');
                    if (job) runJob(job);
                  }}
                  disabled={runningJobs.has('content-intelligence-eval')}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Evaluate Opportunities
                </button>
                <button
                  onClick={() => {
                    const job = jobs.find(j => j.id === 'atp-sync');
                    if (job) runJob(job);
                  }}
                  disabled={runningJobs.has('atp-sync')}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sync ATP Calendar
                </button>
              </div>
            </div>
          </>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Execution Logs</h2>
              <div className="flex items-center gap-4">
                <select
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Jobs</option>
                  {uniqueJobNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {logsLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            {logsLoading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-600">No logs found</p>
                <p className="text-sm text-gray-500 mt-2">Run a job to see execution logs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${getStatusColor(log.status)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          {log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⏭️'}
                        </span>
                        <div>
                          <div className="font-bold text-sm">{log.job_name}</div>
                          <div className="text-xs opacity-75">
                            {log.job_type} • {formatDuration(log.duration_ms)} • {new Date(log.started_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(log.status)}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>

                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="font-semibold text-red-900">Error:</div>
                        <div className="text-red-800">{log.error_message}</div>
                      </div>
                    )}

                    {log.result && (
                      <details 
                        className="mt-2"
                        open={expandedLogs.has(log.id)}
                        onToggle={(e) => {
                          const isOpen = (e.target as HTMLDetailsElement).open;
                          setExpandedLogs(prev => {
                            const next = new Set(prev);
                            if (isOpen) {
                              next.add(log.id);
                            } else {
                              next.delete(log.id);
                            }
                            return next;
                          });
                        }}
                      >
                        <summary className="cursor-pointer text-sm font-semibold hover:underline">
                          ▼ View Details
                        </summary>
                        <div className="mt-2 space-y-3">
                          {/* Basic Result */}
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Execution Result:</div>
                            <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(log.result, null, 2)}
                            </pre>
                          </div>
                          
                          {/* Detailed Content Log (if available) */}
                          {log.job_name === 'content-intelligence' && (() => {
                            // Try to find matching content log by job_id or by timestamp (within 5 seconds)
                            const jobId = log.metadata?.job_id;
                            let contentLog: ContentLog | null = null;
                            
                            if (jobId && contentLogs[jobId]) {
                              contentLog = contentLogs[jobId];
                            } else {
                              // Find by timestamp (within 5 seconds of job start)
                              const logTime = new Date(log.started_at).getTime();
                              contentLog = Object.values(contentLogs).find(cl => {
                                const clTime = new Date(cl.timestamp).getTime();
                                return Math.abs(clTime - logTime) < 5000; // Within 5 seconds
                              }) || null;
                            }
                            
                            return contentLog ? (
                              <div>
                                <div className="text-xs font-semibold text-gray-700 mb-1">📊 Detailed Generation Log:</div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Job ID: {contentLog.job_id} • {new Date(contentLog.timestamp).toLocaleString()}
                                </div>
                                <pre className="text-xs bg-blue-50 p-3 rounded border border-blue-200 overflow-x-auto max-h-96 overflow-y-auto">
                                  {JSON.stringify(contentLog.log_data, null, 2)}
                                </pre>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Post Type Selection Modal */}
        {showPostTypeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPostTypeModal(false)}
          >
            <div
              className="bg-gray-900/60 backdrop-blur-sm fixed inset-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full z-50 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Generate Post - Select Type</h2>
                <button
                  onClick={() => setShowPostTypeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Post Type Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={selectedPostType}
                    onChange={(e) => {
                      setSelectedPostType(e.target.value);
                      setSelectedPostCategory('');
                      setCustomTopic('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="auto">Auto (Best Available Opportunity)</option>
                    <option value="tournament">Tournament Post</option>
                    <option value="match">Match Analysis</option>
                    <option value="player">Player Profile / Up-and-Coming Player</option>
                    <option value="gear">Gear Guide</option>
                    <option value="lifestyle">Lifestyle / Travel</option>
                    <option value="news">News Analysis</option>
                    <option value="blast-from-past">Blast from the Past (Nostalgia)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPostType === 'auto' && 'Will automatically select the best available opportunity'}
                    {selectedPostType === 'tournament' && 'Tournament preview, recap, or analysis post'}
                    {selectedPostType === 'match' && 'Match analysis or breakdown'}
                    {selectedPostType === 'player' && 'Profile of an up-and-coming or established player'}
                    {selectedPostType === 'gear' && 'Gear guide or product comparison'}
                    {selectedPostType === 'lifestyle' && 'Travel, lifestyle, or city guide content'}
                    {selectedPostType === 'news' && 'Analysis of recent tennis news'}
                    {selectedPostType === 'blast-from-past' && 'Nostalgic post about past players or moments'}
                  </p>
                </div>
                
                {/* Category Selection (for gear posts) */}
                {selectedPostType === 'gear' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gear Category
                    </label>
                    <select
                      value={selectedPostCategory}
                      onChange={(e) => setSelectedPostCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Auto-select</option>
                      <option value="racket">Rackets</option>
                      <option value="clothing">Clothing / Apparel</option>
                      <option value="accessory">Accessories (Bags, Strings, Grips, etc.)</option>
                    </select>
                  </div>
                )}
                
                {/* Custom Topic */}
                {selectedPostType !== 'auto' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., 'Australian Open 2026 Preview' or 'Best Tennis Rackets for 2026'"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty to let the system generate a topic based on available data
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowPostTypeModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const job = jobs.find(j => j.id === 'generate-post');
                    if (job) {
                      const options: any = {};
                      if (selectedPostType !== 'auto') {
                        options.type = selectedPostType;
                      }
                      if (customTopic) {
                        options.topic = customTopic;
                      }
                      if (selectedPostCategory) {
                        options.category = selectedPostCategory;
                      }
                      
                      setShowPostTypeModal(false);
                      runJob(job, options);
                    }
                  }}
                  disabled={runningJobs.has('generate-post')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
