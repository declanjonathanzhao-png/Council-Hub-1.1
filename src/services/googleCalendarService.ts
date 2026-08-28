import { getAccessToken } from './firebaseAuth';
import { CouncilEvent } from '../types';

export const listCalendarEvents = async (timeMin?: string): Promise<CouncilEvent[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Calendar access requires signing in with Google.');
  }

  const now = timeMin || new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    now
  )}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Calendar events (${response.status})`);
  }

  const data = await response.json();
  const items = data.items || [];

  return items.map((item: any) => {
    const start = item.start?.dateTime || item.start?.date || '';
    const dateObj = new Date(start);
    const dateStr = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : start;
    const timeStr = item.start?.dateTime
      ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : 'All Day';

    return {
      id: item.id,
      title: item.summary || 'Untitled Event',
      date: dateStr,
      time: timeStr,
      location: item.location || 'Council Chamber / Virtual',
      department: 'Executive Committee',
      attendeesCount: item.attendees?.length || 1,
      googleCalendarEventId: item.id,
      isGoogleSynced: true,
      description: item.description || '',
    };
  });
};

export const createCalendarEvent = async (event: {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  location?: string;
  description?: string;
  attendees?: string[];
}): Promise<any> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Calendar access requires signing in with Google.');
  }

  const startDateTime = new Date(`${event.startDate}T${event.startTime}:00`).toISOString();
  const endDateTime = new Date(`${event.endDate}T${event.endTime}:00`).toISOString();

  const body: any = {
    summary: event.title,
    description: event.description || 'Created via CouncilHub Student Council Management System',
    location: event.location || 'Student Council Boardroom',
    start: {
      dateTime: startDateTime,
    },
    end: {
      dateTime: endDateTime,
    },
  };

  if (event.attendees && event.attendees.length > 0) {
    body.attendees = event.attendees.map(email => ({ email }));
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create event in Google Calendar');
  }

  return response.json();
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Calendar access requires signing in with Google.');
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete event from Google Calendar');
  }
};
