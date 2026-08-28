import React, { useState } from 'react';
import { CouncilEvent } from '../types';
import { User } from 'firebase/auth';
import { ConfirmationDialog } from './ConfirmationDialog';

interface CalendarViewProps {
  events: CouncilEvent[];
  user: User | null;
  isViewer?: boolean;
  onAddEvent: (eventData: {
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    description: string;
    department: string;
    attendeesCount: number;
  }) => Promise<void>;
  onUpdateEvent: (eventId: string, eventData: {
    title: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location: string;
    description: string;
    department: string;
    attendeesCount: number;
  }) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onSyncGoogleCalendar: () => void;
  isLoading: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  user,
  isViewer,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onSyncGoogleCalendar,
  isLoading,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CouncilEvent | null>(null);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('16:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('17:30');
  const [location, setLocation] = useState('Council Chamber');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Executive Committee');
  const [attendeesCount, setAttendeesCount] = useState<number>(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    if (isViewer) {
      alert('SC Viewers have view-only access and cannot create calendar events.');
      return;
    }
    setTitle('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartTime('16:00');
    setEndDate(new Date().toISOString().split('T')[0]);
    setEndTime('17:30');
    setLocation('Council Chamber');
    setDescription('');
    setDepartment('Executive Committee');
    setAttendeesCount(10);
    setEditingEvent(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (evt: CouncilEvent) => {
    if (isViewer) {
      alert('SC Viewers have view-only access and cannot modify calendar events.');
      return;
    }
    setTitle(evt.title);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartTime('16:00');
    setEndDate(new Date().toISOString().split('T')[0]);
    setEndTime('17:30');
    setLocation(evt.location || 'Council Chamber');
    setDescription(evt.description || '');
    setDepartment(evt.department || 'Executive Committee');
    setAttendeesCount(evt.attendeesCount || 10);
    setEditingEvent(evt);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingEvent) {
        await onUpdateEvent(editingEvent.id, {
          title,
          startDate,
          startTime,
          endDate,
          endTime,
          location,
          description,
          department,
          attendeesCount: Number(attendeesCount) || 5,
        });
      } else {
        await onAddEvent({
          title,
          startDate,
          startTime,
          endDate,
          endTime,
          location,
          description,
          department,
          attendeesCount: Number(attendeesCount) || 5,
        });
      }

      setShowAddModal(false);
      setEditingEvent(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (eventId: string) => {
    if (isViewer) {
      alert('SC Viewers have view-only access and cannot delete calendar events.');
      return;
    }
    setDeleteEventId(eventId);
  };

  const confirmDelete = async () => {
    if (!deleteEventId) return;
    try {
      await onDeleteEvent(deleteEventId);
      setDeleteEventId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-24 md:pb-12">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#bec9c5]/40 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center text-[#745c00]">
            <span className="material-symbols-outlined text-[28px] fill-icon">calendar_month</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Plus_Jakarta_Sans'] text-xl md:text-2xl font-bold text-[#1c1c18]">
                Council Calendar & Schedule
              </h1>
              {user && (
                <span className="px-2 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold tracking-wider uppercase border border-[#006054]/20">
                  Google Synced
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#5D4037] mt-0.5">
              Sync, schedule, edit, and manage committee meetings, proposal reviews, and general assemblies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {user ? (
            <button
              onClick={onSyncGoogleCalendar}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-[#f6f3ec] hover:bg-[#e5e2db] border border-[#bec9c5]/60 rounded-xl text-xs font-bold text-[#006054] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isLoading ? 'Syncing...' : 'Sync with Google Calendar'}</span>
            </button>
          ) : null}

          {!isViewer && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add Council Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Events List Grid */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#bec9c5]/40 shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fed65b]/30 text-[#745c00] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
          </div>
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-1">
            No Scheduled Council Events
          </h3>
          <p className="text-xs text-[#5D4037] max-w-sm mb-4">
            There are currently no meetings or calendar dates scheduled. Add a new event or sync with Google Calendar.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006054] hover:bg-[#1F7A6C] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Add Council Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl p-5 border border-[#bec9c5]/40 shadow-xs hover:border-[#006054]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#006054]/10 text-[#006054] text-[10px] font-bold uppercase tracking-wider">
                    {evt.department}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {evt.isGoogleSynced && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#006054] font-semibold" title="Synced with Google Calendar">
                        <span className="material-symbols-outlined text-[14px] fill-icon">cloud_done</span>
                      </span>
                    )}
                    {!isViewer && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 text-[#6e7976] hover:text-[#006054] hover:bg-[#f6f3ec] rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(evt.id)}
                          className="p-1.5 text-[#6e7976] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1c1c18] mb-2 leading-snug">
                  {evt.title}
                </h3>

                {evt.description && (
                  <p className="text-xs text-[#5D4037] mb-3 leading-relaxed line-clamp-2">
                    {evt.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-[#6e7976] pt-3 border-t border-[#e5e2db]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D4AF37] text-[16px]">calendar_today</span>
                    <span className="font-semibold text-[#1c1c18]">{evt.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6e7976] text-[16px]">schedule</span>
                    <span>{evt.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6e7976] text-[16px]">location_on</span>
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5e2db] flex items-center justify-between">
                <span className="text-xs text-[#5D4037]">
                  👥 {evt.attendeesCount || 5} Attendees
                </span>
                <span className="text-[11px] font-bold text-[#006054]">Council Session</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#bec9c5]/40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2db]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006054]">
                  {editingEvent ? 'edit_calendar' : 'event'}
                </span>
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#1c1c18]">
                  {editingEvent ? 'Edit Council Event' : 'Schedule Council Event'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 bg-[#ffdad6]/60 border border-[#ffdad6] rounded-xl text-[#ba1a1a] text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block font-bold text-[#5D4037] mb-1">
                  Event Title <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Gala 2024 Working Committee Sync"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Department / Committee</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  >
                    <option value="Executive Committee">Executive Committee</option>
                    <option value="Academic Affairs">Academic Affairs</option>
                    <option value="Student Welfare">Student Welfare</option>
                    <option value="Finance & Budget">Finance & Budget</option>
                    <option value="Events & Culture">Events & Culture</option>
                    <option value="Public Relations">Public Relations</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5D4037] mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Boardroom A / Google Meet"
                    className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5D4037] mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline meeting agenda, proposal links, and discussion items..."
                  className="w-full p-2.5 bg-[#f6f3ec] border border-[#bec9c5]/60 rounded-xl text-[#1c1c18] outline-none focus:border-[#006054]"
                />
              </div>

              {user && (
                <div className="p-3 bg-[#9ff2e1]/20 rounded-xl border border-[#9ff2e1] flex items-center gap-2 text-[#006054]">
                  <span className="material-symbols-outlined text-[20px] fill-icon">cloud_sync</span>
                  <span>{editingEvent ? 'Changes will be saved locally and reflected in council schedule.' : 'Will be automatically added to your Google Calendar.'}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6e7976] hover:bg-[#f6f3ec] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#006054] hover:bg-[#1F7A6C] text-white font-bold text-xs uppercase tracking-wider shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={Boolean(deleteEventId)}
        title="Delete Council Event"
        message="Are you sure you want to delete this scheduled council event? This action cannot be undone."
        confirmLabel="Delete Event"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteEventId(null)}
      />
    </div>
  );
};
