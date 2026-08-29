// ============================================================
// Controller: Calendar — handles calendar events (Features 9-10)
// ============================================================
const CalendarEvent = require('../models/CalendarEvent');

function parseEventBody(body) {
  return {
    title: (body.title || '').trim(),
    description: (body.description || '').trim(),
    location: (body.location || '').trim(),
    start_time: body.start_time,
    end_time: body.end_time
  };
}

function validateEvent(event) {
  if (!event.title) return 'Event title is required.';
  if (!event.start_time || !event.end_time) return 'Start and end time are required.';
  if (new Date(event.end_time) <= new Date(event.start_time)) return 'End time must be after start time.';
  return null;
}

exports.getEvents = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const events = await CalendarEvent.findAllByUser(req.session.user.id);
    res.render('calendar-list', { user: req.session.user, events });
  } catch (err) {
    console.error('Calendar list error:', err);
    req.session.error = 'Failed to load events.';
    res.redirect('/dashboard');
  }
};

exports.getCreateEvent = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('calendar-form', { user: req.session.user, event: null, formAction: '/calendar/create', pageTitle: 'Create Event' });
};

exports.postCreateEvent = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const event = parseEventBody(req.body);
  const validationError = validateEvent(event);
  if (validationError) {
    req.session.error = validationError;
    return res.redirect('/calendar/new');
  }

  try {
    const conflict = await CalendarEvent.findConflict(req.session.user.id, event.start_time, event.end_time);
    if (conflict) {
      req.session.error = `Schedule conflict with "${conflict.title}" (${new Date(conflict.start_time).toLocaleString()} - ${new Date(conflict.end_time).toLocaleString()}).`;
      return res.redirect('/calendar/new');
    }

    await CalendarEvent.create(req.session.user.id, event);
    req.session.success = 'Event created successfully!';
    res.redirect('/calendar');
  } catch (err) {
    console.error('Create event error:', err);
    req.session.error = 'Failed to create event.';
    res.redirect('/calendar/new');
  }
};

exports.getEditEvent = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const event = await CalendarEvent.findById(req.params.id, req.session.user.id);
    if (!event) {
      req.session.error = 'Event not found.';
      return res.redirect('/calendar');
    }
    res.render('calendar-form', {
      user: req.session.user,
      event,
      formAction: `/calendar/edit/${req.params.id}`,
      pageTitle: 'Edit Event'
    });
  } catch (err) {
    console.error('Edit event form error:', err);
    req.session.error = 'Failed to load event.';
    res.redirect('/calendar');
  }
};

exports.postEditEvent = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const event = parseEventBody(req.body);
  const validationError = validateEvent(event);
  if (validationError) {
    req.session.error = validationError;
    return res.redirect(`/calendar/edit/${req.params.id}`);
  }

  try {
    const conflict = await CalendarEvent.findConflict(req.session.user.id, event.start_time, event.end_time, req.params.id);
    if (conflict) {
      req.session.error = `Schedule conflict with "${conflict.title}" (${new Date(conflict.start_time).toLocaleString()} - ${new Date(conflict.end_time).toLocaleString()}).`;
      return res.redirect(`/calendar/edit/${req.params.id}`);
    }

    await CalendarEvent.update(req.params.id, req.session.user.id, event);
    req.session.success = 'Event updated successfully!';
    res.redirect('/calendar');
  } catch (err) {
    console.error('Update event error:', err);
    req.session.error = 'Failed to update event.';
    res.redirect(`/calendar/edit/${req.params.id}`);
  }
};

exports.deleteEvent = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await CalendarEvent.delete(req.params.id, req.session.user.id);
    req.session.success = 'Event deleted.';
  } catch (err) {
    console.error('Delete event error:', err);
    req.session.error = 'Failed to delete event.';
  }
  res.redirect('/calendar');
};
