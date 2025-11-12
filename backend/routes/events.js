const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  return {
    user_type: req.headers['x-user-type'],
    user_id: req.headers['x-user-id']
  };
};

// GET /api/events - Get all events
router.get('/', asyncHandler(async (req, res) => {
  const { branch_id, upcoming } = req.query;

  let query = `
    SELECT
      e.event_id,
      e.event_name,
      e.branch_id,
      e.event_date,
      e.event_time,
      e.event_subject,
      e.event_description,
      b.name as branch_name,
      b.address as branch_address,
      COUNT(ea.attendee_id) as attendee_count
    FROM events e
    LEFT JOIN branches b ON e.branch_id = b.branch_id
    LEFT JOIN event_attendees ea ON e.event_id = ea.event_id
  `;

  const params = [];
  let whereClause = '';

  if (branch_id) {
    whereClause = ' WHERE e.branch_id = ?';
    params.push(branch_id);
  }

  if (upcoming === 'true') {
    if (whereClause) {
      whereClause += ' AND CONCAT(e.event_date, " ", e.event_time) >= NOW()';
    } else {
      whereClause = ' WHERE CONCAT(e.event_date, " ", e.event_time) >= NOW()';
    }
  }

  query += whereClause + ' GROUP BY e.event_id ORDER BY e.event_date, e.event_time';

  const [events] = await db.query(query, params);

  res.json({
    success: true,
    count: events.length,
    data: events
  });
}));

// GET /api/events/:id - Get single event with attendees and staff
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get event details
  const [events] = await db.query(`
    SELECT
      e.*,
      b.name as branch_name,
      b.address as branch_address
    FROM events e
    LEFT JOIN branches b ON e.branch_id = b.branch_id
    WHERE e.event_id = ?
  `, [id]);

  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  const event = events[0];

  // Get attendees
  const [attendees] = await db.query(`
    SELECT
      ea.attendee_id,
      m.member_name,
      m.member_email,
      m.member_type
    FROM event_attendees ea
    JOIN member m ON ea.member_id = m.member_id
    WHERE ea.event_id = ?
    ORDER BY m.member_name
  `, [id]);

  // Get staff organizers
  const [staff] = await db.query(`
    SELECT
      s.staff_id,
      s.name,
      s.email,
      s.position
    FROM event_staff es
    JOIN staff s ON es.staff_id = s.staff_id
    WHERE es.event_id = ?
    ORDER BY s.name
  `, [id]);

  event.attendees = attendees;
  event.staff = staff;

  res.json({
    success: true,
    data: event
  });
}));

// POST /api/events - Create new event
router.post('/', asyncHandler(async (req, res) => {
  const { event_name, branch_id, event_date, event_time, event_subject, event_description } = req.body;

  if (!event_name || !branch_id || !event_date || !event_time) {
    return res.status(400).json({
      success: false,
      message: 'event_name, branch_id, event_date, and event_time are required'
    });
  }

  // Check if branch exists
  const [branches] = await db.query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
  if (branches.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    });
  }

  // Create event
  const [result] = await db.query(
    `INSERT INTO events (event_name, branch_id, event_date, event_time, event_subject, event_description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [event_name, branch_id, event_date, event_time, event_subject || null, event_description || null]
  );

  res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: {
      event_id: result.insertId,
      event_name,
      branch_id,
      event_date,
      event_time,
      event_subject,
      event_description
    }
  });
}));

// PUT /api/events/:id - Update event
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { event_name, branch_id, event_date, event_time, event_subject, event_description } = req.body;

  // Check if event exists
  const [events] = await db.query('SELECT event_id FROM events WHERE event_id = ?', [id]);
  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Update event
  await db.query(
    `UPDATE events SET
      event_name = ?,
      branch_id = ?,
      event_date = ?,
      event_time = ?,
      event_subject = ?,
      event_description = ?
     WHERE event_id = ?`,
    [event_name, branch_id, event_date, event_time, event_subject, event_description, id]
  );

  res.json({
    success: true,
    message: 'Event updated successfully'
  });
}));

// DELETE /api/events/:id - Delete event
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await db.query('DELETE FROM events WHERE event_id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    });
  }

  res.json({
    success: true,
    message: 'Event deleted successfully'
  });
}));

// POST /api/events/:id/attend - Register for event
router.post('/:id/attend', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_type, user_id } = getUserFromRequest(req);

  if (user_type !== 'member') {
    return res.status(403).json({
      success: false,
      message: 'Only members can register for events'
    });
  }

  // Check if event exists and is upcoming
  const [events] = await db.query(
    'SELECT event_id FROM events WHERE event_id = ? AND CONCAT(event_date, " ", event_time) >= NOW()',
    [id]
  );

  if (events.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Event not found or has already occurred'
    });
  }

  // Check if already registered
  const [existing] = await db.query(
    'SELECT attendee_id FROM event_attendees WHERE event_id = ? AND member_id = ?',
    [id, user_id]
  );

  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Already registered for this event'
    });
  }

  // Register for event
  await db.query(
    'INSERT INTO event_attendees (event_id, member_id) VALUES (?, ?)',
    [id, user_id]
  );

  res.json({
    success: true,
    message: 'Successfully registered for event'
  });
}));

// DELETE /api/events/:id/attend - Unregister from event
router.delete('/:id/attend', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_type, user_id } = getUserFromRequest(req);

  if (user_type !== 'member') {
    return res.status(403).json({
      success: false,
      message: 'Only members can unregister from events'
    });
  }

  const [result] = await db.query(
    'DELETE FROM event_attendees WHERE event_id = ? AND member_id = ?',
    [id, user_id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Registration not found'
    });
  }

  res.json({
    success: true,
    message: 'Successfully unregistered from event'
  });
}));

module.exports = router;
