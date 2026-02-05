'use client';

import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  category: 'content' | 'social' | 'analytics' | 'infrastructure';
  priority: 'high' | 'medium' | 'low';
  description?: string;
  targetDate?: string;
}

const initialTasks: Task[] = [
  // Content
  {
    id: '1',
    title: 'Content Calendar System',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Build calendar to plan blog posts ahead of time - ✅ Complete with ATP sync, content planning, and UI',
  },
  {
    id: '2',
    title: 'Generate 5 Blog Posts This Week',
    status: 'in_progress',
    category: 'content',
    priority: 'high',
    description: 'Target: 5 quality posts with real API data - Content Intelligence running daily at 6 AM CT automatically',
  },
  {
    id: '3',
    title: 'Blog Post: Real Data Grounding',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Every post must have real weather, hotels, distances - ✅ Data aggregator built',
  },
  {
    id: '14',
    title: 'Post Queue & Review System',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Admin page to review, edit, and publish generated posts - ✅ Complete',
  },
  {
    id: '15',
    title: 'Content Intelligence Job',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Background job to evaluate opportunities and generate posts - ✅ Automated daily at 6 AM CT via Vercel Cron',
  },
  {
    id: '38',
    title: 'Post Generator V2',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Type-specific handlers with comprehensive data gathering (analysis, nostalgia, gear, travel, lifestyle) - ✅ Complete',
  },
  {
    id: '39',
    title: 'Content Intelligence Logging',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Detailed logging of post generation process (opportunities, data sources, prompts, results) - ✅ Complete',
  },
  {
    id: '40',
    title: 'Pre-Build Check System',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'TypeScript type checking and linting before deployment - ✅ Prevents build errors',
  },
  {
    id: '41',
    title: 'Marshall Age Consistency',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Fact-checker validates Marshall\'s age (born 1993, 33 years old) in nostalgia posts - ✅ Complete',
  },
  
  // Social
  {
    id: '4',
    title: 'Create Instagram Account',
    status: 'todo',
    category: 'social',
    priority: 'high',
    description: 'Set up @marshallontour Instagram',
  },
  {
    id: '5',
    title: 'Create Twitter/X Account',
    status: 'todo',
    category: 'social',
    priority: 'high',
    description: 'Set up @marshallontour Twitter',
  },
  {
    id: '6',
    title: 'Post 10 Instagram Posts This Week',
    status: 'todo',
    category: 'social',
    priority: 'high',
    description: 'Target: 10 posts (images + captions)',
  },
  {
    id: '7',
    title: 'Post 15 Twitter/X Posts This Week',
    status: 'todo',
    category: 'social',
    priority: 'high',
    description: 'Target: 15 posts (cross-post blog links, engage)',
  },
  {
    id: '8',
    title: 'Build Social Following',
    status: 'todo',
    category: 'social',
    priority: 'medium',
    description: 'Engage with tennis community, share on Reddit',
  },
  {
    id: '16',
    title: 'Social Post Generation',
    status: 'in_progress',
    category: 'social',
    priority: 'high',
    description: 'Generate standalone social posts (not linked to blogs) - Infrastructure ready',
  },
  
  // Analytics
  {
    id: '9',
    title: 'Set Up Mixpanel',
    status: 'done',
    category: 'analytics',
    priority: 'high',
    description: 'Track site visits, clicks, conversions - ✅ Integrated',
  },
  {
    id: '10',
    title: 'Track Blog Post Performance',
    status: 'todo',
    category: 'analytics',
    priority: 'medium',
    description: 'Which posts get most traffic?',
  },
  {
    id: '11',
    title: 'Track Social Engagement',
    status: 'todo',
    category: 'analytics',
    priority: 'medium',
    description: 'Which posts get most likes/shares?',
  },
  
  // Infrastructure
  {
    id: '12',
    title: 'Weather API Integration',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Get real weather for tournament locations - ✅ Open-Meteo API integrated',
  },
  {
    id: '13',
    title: 'Google Maps API Integration',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Get real hotel distances/prices - ✅ Integrated',
  },
  {
    id: '17',
    title: 'YouTube API Integration',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Find highlight videos for "Blast from the Past" content - ✅ Integrated',
  },
  {
    id: '18',
    title: 'RSS Feed Integration',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Aggregate tennis news from ESPN, BBC, Tennis.com - ✅ Integrated',
  },
  {
    id: '19',
    title: 'Data Integration Architecture',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Clean, modular architecture for all data sources - ✅ Complete',
  },
  {
    id: '20',
    title: 'ATP Calendar Sync',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Sync 2026 ATP calendar from static data - ✅ 60 events loaded',
  },
  {
    id: '21',
    title: 'Admin Authentication',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'LocalStorage-based auth for admin pages - ✅ Complete',
  },
  {
    id: '22',
    title: 'Jobs Control Panel',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'On-demand job execution for testing - ✅ Complete',
  },
  {
    id: '23',
    title: 'Infrastructure Overview Page',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Document all APIs, jobs, integrations - ✅ Complete',
  },
  {
    id: '24',
    title: 'How It Works Page',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Explain Marshall\'s system at high and technical level - ✅ Complete',
  },
  {
    id: '25',
    title: 'Free Tennis Data Strategy',
    status: 'in_progress',
    category: 'infrastructure',
    priority: 'high',
    description: 'Web scraping for match data (ATP Tour, FlashScore) - Strategy documented',
  },
  {
    id: '26',
    title: 'Gear Database & Content System',
    status: 'in_progress',
    category: 'content',
    priority: 'high',
    description: 'Create gear_items table, source product data from existing guides, populate database. Build gear guides and quizzes infrastructure.',
  },
  {
    id: '27',
    title: 'Image Generation Strategy',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Strategy-based image generation with stock images (Unsplash) for recaps/previews, AI for Marshall posts. Face consistency with flux-pulid model - ✅ Complete',
  },
  {
    id: '31',
    title: 'Stock Image Integration',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Unsplash API integration for free stock images. Used for recaps, previews, gear guides. Reduces AI costs by 80-90% - ✅ Complete',
  },
  {
    id: '32',
    title: 'Manual Post Type Selection',
    status: 'done',
    category: 'content',
    priority: 'medium',
    description: 'Admin UI to select post type when manually generating posts (tournament, player, gear, lifestyle, etc.) - ✅ Complete',
  },
  {
    id: '33',
    title: 'Multi-Agent Content Pipeline',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: '2-agent pipeline: Fact-Checker → Editor. Prevents misinformation and improves quality - ✅ Complete',
  },
  {
    id: '34',
    title: 'Deploy to marshallontour.com',
    status: 'todo',
    category: 'infrastructure',
    priority: 'high',
    description: 'Deploy Marshall site to production domain marshallontour.com. Configure DNS, SSL, environment variables, and production database.',
  },
  {
    id: '35',
    title: 'Set Up Amazon Associates',
    status: 'todo',
    category: 'content',
    priority: 'high',
    description: 'Sign up for Amazon Associates affiliate program. Get approval, configure tracking, add affiliate links to gear posts. Target: 4.5% commission on rackets.',
  },
  {
    id: '36',
    title: 'Set Up Booking.com Affiliate',
    status: 'todo',
    category: 'content',
    priority: 'high',
    description: 'Sign up for Booking.com affiliate program for travel content. Higher commissions (25-40%) on hotel bookings. Target: Travel guides and tournament location content.',
  },
  {
    id: '37',
    title: 'Revenue Goal: $1,000-2,000/month by Month 6',
    status: 'todo',
    category: 'content',
    priority: 'high',
    description: '6-month revenue roadmap: Month 1 ($0-50), Month 2 ($50-200), Month 3 ($200-500), Month 4 ($500-800), Month 5 ($800-1,200), Month 6 ($1,000-2,000). See revenue-roadmap.md',
  },
  {
    id: '28',
    title: 'Content Duplicate Prevention',
    status: 'done',
    category: 'content',
    priority: 'high',
    description: 'Variety tracker prevents duplicate content. 45-day minimum for gear posts, tournament recaps check recent posts - ✅ Complete',
  },
  {
    id: '29',
    title: 'API Cost Tracking',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Track spending across all APIs with $20/week budget. Dashboard shows weekly/daily costs - ✅ Complete',
  },
  {
    id: '30',
    title: 'Job Execution Logging',
    status: 'done',
    category: 'infrastructure',
    priority: 'medium',
    description: 'Log all background job runs with status, duration, and results. View in admin jobs page - ✅ Complete',
  },
  {
    id: '42',
    title: 'Fix All Build Errors',
    status: 'done',
    category: 'infrastructure',
    priority: 'high',
    description: 'Fixed 20+ TypeScript errors that would cause Vercel build failures - ✅ All type errors resolved',
  },
];

export default function ProjectBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const updateTaskStatus = (id: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: newStatus } : task
    ));
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'bg-gray-200 text-gray-800';
      case 'in_progress': return 'bg-blue-200 text-blue-800';
      case 'done': return 'bg-green-200 text-green-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'content': return '📝';
      case 'social': return '📱';
      case 'analytics': return '📊';
      case 'infrastructure': return '🔧';
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.status === 'todo') },
    { id: 'in_progress', title: 'In Progress', tasks: tasks.filter(t => t.status === 'in_progress') },
    { id: 'done', title: 'Done', tasks: tasks.filter(t => t.status === 'done') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marshall Project Board</h1>
          <p className="text-gray-600">Track progress on the essentials. Keep it simple.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => (
            <div key={column.id} className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {column.title} ({column.tasks.length})
              </h2>
              
              <div className="space-y-3">
                {column.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-3 cursor-move hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id);
                      e.dataTransfer.setData('currentStatus', task.status);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData('taskId');
                      if (taskId === task.id) {
                        updateTaskStatus(taskId, column.id as Task['status']);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(task.category)}</span>
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as Task['status'])}
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)} border-0`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">{task.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Progress Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded p-4">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.category === 'content' && t.status === 'done').length} / {tasks.filter(t => t.category === 'content').length}
              </div>
              <div className="text-sm text-gray-600">Content Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {tasks.filter(t => t.category === 'content' && t.status === 'in_progress').length} in progress
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-2xl font-bold text-purple-600">
                {tasks.filter(t => t.category === 'social' && t.status === 'done').length} / {tasks.filter(t => t.category === 'social').length}
              </div>
              <div className="text-sm text-gray-600">Social Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {tasks.filter(t => t.category === 'social' && t.status === 'in_progress').length} in progress
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.category === 'analytics' && t.status === 'done').length} / {tasks.filter(t => t.category === 'analytics').length}
              </div>
              <div className="text-sm text-gray-600">Analytics Tasks</div>
              <div className="text-xs text-gray-500 mt-1">
                {tasks.filter(t => t.category === 'analytics' && t.status === 'in_progress').length} in progress
              </div>
            </div>
            <div className="border rounded p-4">
              <div className="text-2xl font-bold text-orange-600">
                {tasks.filter(t => t.status === 'done').length} / {tasks.length}
              </div>
              <div className="text-sm text-gray-600">Total Progress</div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}% complete
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}