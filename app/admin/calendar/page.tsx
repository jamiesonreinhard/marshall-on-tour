'use client';

import { useState, useEffect } from 'react';

interface ATPTournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  location?: {
    city: string;
    country: string;
  } | string;
  last_synced_at?: string;
}

interface ContentCalendarEntry {
  id: string;
  scheduled_date: string;
  scheduled_time?: string;
  events: string[];
  content_brief: string;
  post_type: 'blog' | 'instagram' | 'x' | 'all';
  category?: 'Gear' | 'Travel' | 'Analysis' | 'Lifestyle';
  status: 'planned' | 'approved' | 'in_progress' | 'published' | 'cancelled';
  attitude?: string;
  tone_notes?: string;
  focus_keyword?: string;
  blog_schedule?: any;
  instagram_schedule?: any;
  x_schedule?: any;
  notes?: string;
  generated_post_id?: string;
  atp_tournament_id?: string;
  atp_calendar?: ATPTournament;
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<ContentCalendarEntry[]>([]);
  const [tournaments, setTournaments] = useState<ATPTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ContentCalendarEntry | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<ATPTournament | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadCalendar();
    loadTournaments();
  }, []);

  const loadCalendar = async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      
      const response = await fetch(
        `/api/calendar/entries?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );
      const data = await response.json();
      console.log('Loaded calendar entries:', data.entries?.length || 0);
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/calendar/sync-atp');
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const syncATP = async () => {
    try {
      const response = await fetch('/api/calendar/sync-atp', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert(`Synced ${data.synced} tournaments!`);
        loadTournaments();
      }
    } catch (error) {
      console.error('Failed to sync ATP:', error);
      alert('Failed to sync ATP calendar');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-200 text-gray-800';
      case 'approved': return 'bg-blue-200 text-blue-800';
      case 'in_progress': return 'bg-yellow-200 text-yellow-800';
      case 'published': return 'bg-green-200 text-green-800';
      case 'cancelled': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // Helper function for EntryDetailsModal
  const getStatusColorForModal = (status: string) => {
    return getStatusColor(status);
  };

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, ContentCalendarEntry[]>);
  
  console.log('Entries by date:', Object.keys(entriesByDate).length, 'dates with entries');

  // Group tournaments by date (show tournaments on each day they're active)
  const tournamentsByDate = tournaments.reduce((acc, tournament) => {
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    
    // Add tournament to each day in its date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(tournament);
    }
    return acc;
  }, {} as Record<string, ATPTournament[]>);

  // Get current month dates (proper calendar grid)
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // First day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Create calendar grid (6 weeks x 7 days)
  const calendarDays: (string | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push(date.toISOString().split('T')[0]);
  }
  
  // Fill remaining cells to make 6 weeks
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Content Calendar</h1>
              <p className="text-lg text-gray-600 mb-2">Plan Marshall's content ahead of time</p>
              <div className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-2xl">
                <p className="font-semibold text-blue-900 mb-1">📅 What this calendar shows:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li><strong>ATP Tournaments</strong> (purple badges) - Events Marshall could write about</li>
                  <li><strong>Content Calendar Entries</strong> (colored badges) - Planned posts Marshall will write</li>
                  <li>Click on an entry to view details. Click empty space to create a new entry.</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={syncATP}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <span>🔄</span>
                Sync ATP Calendar
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Add Entry
              </button>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(month - 1);
                setCurrentMonth(newMonth);
              }}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 font-semibold"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => {
                const newMonth = new Date(currentMonth);
                newMonth.setMonth(month + 1);
                setCurrentMonth(newMonth);
              }}
              className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 font-semibold"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-32 p-3 bg-gray-50 border border-gray-100"
                  />
                );
              }
              
              const dateEntries = entriesByDate[date] || [];
              const dateTournaments = tournamentsByDate[date] || [];
              const dateObj = new Date(date);
              const dayOfMonth = dateObj.getDate();
              const isToday = date === new Date().toISOString().split('T')[0];
              const isPast = date < new Date().toISOString().split('T')[0];
              
              // Check if this is the start date of any tournament
              const startingTournaments = dateTournaments.filter(t => t.start_date === date);
              const activeTournaments = dateTournaments.filter(t => t.start_date !== date);
              
              return (
                <div
                  key={date}
                  className={`min-h-32 p-3 border border-gray-200 hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-blue-50 border-blue-400 border-2' : ''
                  } ${isPast ? 'opacity-60' : ''}`}
                  onClick={(e) => {
                    // Only open add modal if clicking on empty space (not on an entry or tournament)
                    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('calendar-day-empty')) {
                      setSelectedDate(date);
                      setShowAddModal(true);
                    }
                  }}
                >
                  <div 
                    className={`text-lg font-bold mb-2 calendar-day-empty ${
                      isToday 
                        ? 'text-blue-600' 
                        : isPast 
                          ? 'text-gray-400' 
                          : 'text-gray-900'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(date);
                      setShowAddModal(true);
                    }}
                  >
                    {dayOfMonth}
                  </div>
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Show tournaments starting today */}
                    {startingTournaments.slice(0, 1).map(tournament => (
                      <div
                        key={tournament.id}
                        className="text-xs p-1.5 rounded-md bg-purple-100 text-purple-800 font-semibold cursor-pointer hover:opacity-80 line-clamp-1 relative z-10"
                        title={`${tournament.name} (${tournament.start_date} - ${tournament.end_date})`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Tournament clicked:', tournament);
                          setSelectedTournament(tournament);
                          setShowTournamentModal(true);
                        }}
                      >
                        🎾 {tournament.name.substring(0, 20)}
                        {tournament.name.length > 20 ? '...' : ''}
                      </div>
                    ))}
                    {/* Show content calendar entries */}
                    {dateEntries.slice(0, startingTournaments.length > 0 ? 1 : 2).map(entry => {
                      console.log('Rendering entry:', entry.id, entry.content_brief);
                      return (
                        <div
                          key={entry.id}
                          className={`text-xs p-1.5 rounded-md ${getStatusColor(entry.status)} cursor-pointer hover:opacity-80 line-clamp-1 relative z-10`}
                          title={entry.content_brief}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            console.log('Entry mousedown:', entry.id);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Entry clicked:', entry.id, entry);
                            setSelectedEntry(entry);
                            setShowDetailsModal(true);
                            console.log('State updated, modal should show');
                          }}
                        >
                          {entry.content_brief.substring(0, 25)}
                          {entry.content_brief.length > 25 ? '...' : ''}
                        </div>
                      );
                    })}
                    {/* Show count if there are more items */}
                    {(dateEntries.length + startingTournaments.length) > (startingTournaments.length > 0 ? 2 : 2) && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{(dateEntries.length + startingTournaments.length) - (startingTournaments.length > 0 ? 2 : 2)} more
                      </div>
                    )}
                    {/* Show indicator if tournament is active but not starting today */}
                    {activeTournaments.length > 0 && startingTournaments.length === 0 && (
                      <div 
                        className="text-xs text-purple-600 font-medium cursor-pointer hover:opacity-80 relative z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Active tournament clicked:', activeTournaments[0]);
                          setSelectedTournament(activeTournaments[0]);
                          setShowTournamentModal(true);
                        }}
                      >
                        🎾 {activeTournaments[0].name.substring(0, 15)}...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tournaments List */}
        {tournaments.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Synced Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournaments.map(tournament => (
                <div
                  key={tournament.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{tournament.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Start:</span>{' '}
                          {new Date(tournament.start_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div>
                          <span className="font-medium">End:</span>{' '}
                          {new Date(tournament.end_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        {tournament.location && (
                          <div>
                            <span className="font-medium">Location:</span>{' '}
                            {typeof tournament.location === 'object'
                              ? `${tournament.location.city || ''}, ${tournament.location.country || ''}`.trim()
                              : tournament.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {tournament.last_synced_at && (
                      <div className="text-xs text-gray-500">
                        Synced: {new Date(tournament.last_synced_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Entries</h2>
          {entries.filter(e => e.scheduled_date >= new Date().toISOString().split('T')[0]).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No upcoming entries</p>
              <p className="text-sm">Click "+ Add Entry" to create your first calendar entry</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries
                .filter(e => e.scheduled_date >= new Date().toISOString().split('T')[0])
                .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
                .slice(0, 10)
                .map(entry => (
                  <div
                    key={entry.id}
                    className="border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all bg-white"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-900 mb-2">{entry.content_brief}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="font-semibold">
                            📅 {new Date(entry.scheduled_date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          {entry.scheduled_time && (
                            <span>🕐 {entry.scheduled_time}</span>
                          )}
                          {entry.category && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                              {entry.category}
                            </span>
                          )}
                        </div>
                        {entry.atp_calendar && (
                          <div className="text-sm text-blue-600 font-medium mb-2">
                            🎾 {entry.atp_calendar.name}
                          </div>
                        )}
                        {entry.events.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Events:</span> {entry.events.join(', ')}
                          </div>
                        )}
                        {entry.attitude && (
                          <div className="text-sm text-gray-500 mt-2 italic">
                            Attitude: {entry.attitude}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Tournament Details Modal - Highest priority */}
      {showTournamentModal && selectedTournament && (
        <TournamentDetailsModal
          tournament={selectedTournament}
          onClose={() => {
            setShowTournamentModal(false);
            setSelectedTournament(null);
          }}
          onCreateEntry={(date) => {
            setShowTournamentModal(false);
            setSelectedTournament(null);
            setSelectedDate(date);
            setShowAddModal(true);
          }}
        />
      )}

      {/* Entry Details Modal */}
      {showDetailsModal && selectedEntry && !showTournamentModal && (
        <EntryDetailsModal
          entry={selectedEntry}
          tournaments={tournaments}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEntry(null);
          }}
          onUpdate={() => {
            loadCalendar();
          }}
        />
      )}

      {/* Add Entry Modal */}
      {showAddModal && !showDetailsModal && !showTournamentModal && (
        <AddEntryModal
          date={selectedDate}
          tournaments={tournaments}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            loadCalendar();
          }}
        />
      )}
    </div>
  );
}

function AddEntryModal({
  date,
  tournaments,
  onClose,
  onSave,
}: {
  date: string;
  tournaments: ATPTournament[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    scheduled_date: date,
    scheduled_time: '',
    atp_tournament_id: '',
    events: '',
    content_brief: '',
    post_type: 'all' as const,
    category: 'Analysis' as const,
    attitude: '',
    status: 'planned' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/calendar/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          events: formData.events.split(',').map(e => e.trim()).filter(Boolean),
          atp_tournament_id: formData.atp_tournament_id || null,
        }),
      });
      
      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert(`Failed to create entry: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create entry:', error);
      alert('Failed to create entry');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-2xl font-bold mb-4">Add Calendar Entry</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Time (optional)</label>
            <input
              type="time"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tournament (optional)</label>
            <select
              value={formData.atp_tournament_id}
              onChange={(e) => setFormData({ ...formData, atp_tournament_id: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">None</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({new Date(t.start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Events (comma-separated)</label>
            <input
              type="text"
              value={formData.events}
              onChange={(e) => setFormData({ ...formData, events: e.target.value })}
              placeholder="Australian Open Men's Final, Semifinals"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content Brief *</label>
            <textarea
              value={formData.content_brief}
              onChange={(e) => setFormData({ ...formData, content_brief: e.target.value })}
              placeholder="Write a preview of the men's final that comes out 3 hours before the match"
              className="w-full border rounded px-3 py-2"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Post Type</label>
              <select
                value={formData.post_type}
                onChange={(e) => setFormData({ ...formData, post_type: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="blog">Blog Only</option>
                <option value="instagram">Instagram Only</option>
                <option value="x">X/Twitter Only</option>
                <option value="all">All Channels</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Gear">Gear</option>
                <option value="Travel">Travel</option>
                <option value="Analysis">Analysis</option>
                <option value="Lifestyle">Lifestyle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Attitude (optional)</label>
            <input
              type="text"
              value={formData.attitude}
              onChange={(e) => setFormData({ ...formData, attitude: e.target.value })}
              placeholder="stoked, analytical, snarky"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EntryDetailsModal({
  entry,
  tournaments,
  onClose,
  onUpdate,
}: {
  entry: ContentCalendarEntry;
  tournaments: ATPTournament[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-200 text-gray-800';
      case 'approved': return 'bg-blue-200 text-blue-800';
      case 'in_progress': return 'bg-yellow-200 text-yellow-800';
      case 'published': return 'bg-green-200 text-green-800';
      case 'cancelled': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const linkedTournament = tournaments.find(t => t.id === entry.atp_tournament_id);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">Content Calendar Entry</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold uppercase ${getStatusColor(entry.status)}`}>
              {entry.status}
            </span>
            {entry.generated_post_id && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Post Generated
              </span>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <div className="text-gray-900 font-medium">
                {new Date(entry.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            {entry.scheduled_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                <div className="text-gray-900 font-medium">{entry.scheduled_time}</div>
              </div>
            )}
          </div>

          {/* Content Brief */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Brief</label>
            <div className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
              {entry.content_brief}
            </div>
          </div>

          {/* Tournament Link */}
          {linkedTournament && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Linked Tournament</label>
              <div className="text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                <div className="font-semibold">🎾 {linkedTournament.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(linkedTournament.start_date).toLocaleDateString()} -{' '}
                  {new Date(linkedTournament.end_date).toLocaleDateString()}
                </div>
                {typeof linkedTournament.location === 'object' && (
                  <div className="text-sm text-gray-600">
                    {linkedTournament.location.city}, {linkedTournament.location.country}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events */}
          {entry.events && entry.events.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
              <div className="flex flex-wrap gap-2">
                {entry.events.map((event, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Post Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Type</label>
              <div className="text-gray-900 capitalize">{entry.post_type}</div>
            </div>
            {entry.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="text-gray-900">{entry.category}</div>
              </div>
            )}
          </div>

          {/* SEO & Attitude */}
          <div className="grid grid-cols-2 gap-4">
            {entry.focus_keyword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                <div className="text-gray-900">{entry.focus_keyword}</div>
              </div>
            )}
            {entry.attitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attitude</label>
                <div className="text-gray-900 capitalize">{entry.attitude}</div>
              </div>
            )}
          </div>

          {/* Schedule Details */}
          {(entry.blog_schedule || entry.instagram_schedule || entry.x_schedule) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Publishing Schedule</label>
              <div className="space-y-2">
                {entry.blog_schedule && (
                  <div className="text-sm">
                    <span className="font-medium">Blog:</span>{' '}
                    <span className="text-gray-600">
                      {entry.blog_schedule.enabled ? entry.blog_schedule.publish_time || 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
                {entry.instagram_schedule && (
                  <div className="text-sm">
                    <span className="font-medium">Instagram:</span>{' '}
                    <span className="text-gray-600">
                      {entry.instagram_schedule.enabled ? entry.instagram_schedule.publish_time || 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
                {entry.x_schedule && (
                  <div className="text-sm">
                    <span className="font-medium">X/Twitter:</span>{' '}
                    <span className="text-gray-600">
                      {entry.x_schedule.enabled ? entry.x_schedule.publish_time || 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tone Notes */}
          {entry.tone_notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone Notes</label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                {entry.tone_notes}
              </div>
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <div className="text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200 text-sm">
                {entry.notes}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
            <div>Entry ID: {entry.id}</div>
            {entry.generated_post_id && (
              <div>Generated Post ID: {entry.generated_post_id}</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                // TODO: Add edit functionality
                alert('Edit functionality coming soon!');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentDetailsModal({
  tournament,
  onClose,
  onCreateEntry,
}: {
  tournament: ATPTournament;
  onClose: () => void;
  onCreateEntry: (date: string) => void;
}) {
  const location = typeof tournament.location === 'object' 
    ? tournament.location 
    : { city: '', country: '' };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">ATP Tournament</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Tournament Name */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">🎾 {tournament.name}</h3>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <div className="text-gray-900 font-medium">
                {new Date(tournament.start_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <div className="text-gray-900 font-medium">
                {new Date(tournament.end_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="text-gray-900 font-medium">
                {location.city && location.country 
                  ? `${location.city}, ${location.country}`
                  : location.city || location.country || 'TBD'}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <div className="text-gray-900">
              {Math.ceil((new Date(tournament.end_date).getTime() - new Date(tournament.start_date).getTime()) / (1000 * 60 * 60 * 24) + 1)} days
            </div>
          </div>

          {/* Last Synced */}
          {tournament.last_synced_at && (
            <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
              Last synced: {new Date(tournament.last_synced_at).toLocaleString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                onCreateEntry(tournament.start_date);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Content Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}