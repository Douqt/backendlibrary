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

// GET /api/reservations - Get all reservations
router.get('/', asyncHandler(async (req, res) => {
  const { member_id, branch_id, room_type, upcoming } = req.query;
  const { user_type, user_id } = getUserFromRequest(req);

  let query = `
    SELECT
      r.reservation_id,
      r.member_id,
      r.branch_id,
      r.room_number,
      r.res_date,
      r.res_time,
      r.room_type,
      r.capacity,
      r.is_available,
      m.member_name,
      m.member_email,
      b.name as branch_name,
      b.address as branch_address
    FROM reservations r
    LEFT JOIN member m ON r.member_id = m.member_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
  `;

  const params = [];
  let whereClause = '';

  // Members can only see their own reservations
  if (user_type === 'member' && user_id) {
    whereClause = ' WHERE r.member_id = ?';
    params.push(user_id);
  }

  if (member_id && user_type !== 'member') {
    if (whereClause) {
      whereClause += ' AND r.member_id = ?';
    } else {
      whereClause = ' WHERE r.member_id = ?';
    }
    params.push(member_id);
  }

  if (branch_id) {
    if (whereClause) {
      whereClause += ' AND r.branch_id = ?';
    } else {
      whereClause = ' WHERE r.branch_id = ?';
    }
    params.push(branch_id);
  }

  if (room_type) {
    if (whereClause) {
      whereClause += ' AND r.room_type = ?';
    } else {
      whereClause = ' WHERE r.room_type = ?';
    }
    params.push(room_type);
  }

  if (upcoming === 'true') {
    if (whereClause) {
      whereClause += ' AND CONCAT(r.res_date, " ", r.res_time) >= NOW()';
    } else {
      whereClause = ' WHERE CONCAT(r.res_date, " ", r.res_time) >= NOW()';
    }
  }

  query += whereClause + ' ORDER BY r.res_date, r.res_time';

  const [reservations] = await db.query(query, params);

  res.json({
    success: true,
    count: reservations.length,
    data: reservations
  });
}));

// GET /api/reservations/:id - Get single reservation
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_type, user_id } = getUserFromRequest(req);

  let query = `
    SELECT
      r.*,
      m.member_name,
      m.member_email,
      b.name as branch_name,
      b.address as branch_address
    FROM reservations r
    LEFT JOIN member m ON r.member_id = m.member_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE r.reservation_id = ?
  `;

  const [reservations] = await db.query(query, [id]);

  if (reservations.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  const reservation = reservations[0];

  // Check if user can view this reservation
  if (user_type === 'member' && reservation.member_id !== parseInt(user_id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: reservation
  });
}));

// POST /api/reservations - Create new reservation
router.post('/', asyncHandler(async (req, res) => {
  const { branch_id, room_number, res_date, res_time, room_type, capacity } = req.body;
  const { user_type, user_id } = getUserFromRequest(req);

  if (user_type !== 'member') {
    return res.status(403).json({
      success: false,
      message: 'Only members can make reservations'
    });
  }

  if (!branch_id || !room_number || !res_date || !res_time || !room_type) {
    return res.status(400).json({
      success: false,
      message: 'branch_id, room_number, res_date, res_time, and room_type are required'
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

  // Check for conflicting reservations
  const [conflicts] = await db.query(
    `SELECT reservation_id FROM reservations
     WHERE branch_id = ? AND room_number = ? AND res_date = ? AND res_time = ?
     AND is_available = TRUE`,
    [branch_id, room_number, res_date, res_time]
  );

  if (conflicts.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Room is already reserved for this date and time'
    });
  }

  // Check member doesn't have conflicting reservation
  const [memberConflicts] = await db.query(
    `SELECT reservation_id FROM reservations
     WHERE member_id = ? AND res_date = ? AND res_time = ?
     AND is_available = TRUE`,
    [user_id, res_date, res_time]
  );

  if (memberConflicts.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'You already have a reservation at this date and time'
    });
  }

  // Create reservation
  const [result] = await db.query(
    `INSERT INTO reservations (member_id, branch_id, room_number, res_date, res_time, room_type, capacity, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [user_id, branch_id, room_number, res_date, res_time, room_type, capacity || null]
  );

  res.status(201).json({
    success: true,
    message: 'Reservation created successfully',
    data: {
      reservation_id: result.insertId,
      member_id: user_id,
      branch_id,
      room_number,
      res_date,
      res_time,
      room_type,
      capacity
    }
  });
}));

// PUT /api/reservations/:id - Update reservation
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { branch_id, room_number, res_date, res_time, room_type, capacity } = req.body;
  const { user_type, user_id } = getUserFromRequest(req);

  // Check if reservation exists
  const [reservations] = await db.query('SELECT * FROM reservations WHERE reservation_id = ?', [id]);
  if (reservations.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  const reservation = reservations[0];

  // Check permissions
  if (user_type === 'member' && reservation.member_id !== parseInt(user_id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check for conflicts if changing date/time/room
  if (branch_id !== reservation.branch_id || room_number !== reservation.room_number ||
      res_date !== reservation.res_date || res_time !== reservation.res_time) {

    const [conflicts] = await db.query(
      `SELECT reservation_id FROM reservations
       WHERE branch_id = ? AND room_number = ? AND res_date = ? AND res_time = ?
       AND reservation_id != ? AND is_available = TRUE`,
      [branch_id, room_number, res_date, res_time, id]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Room is already reserved for this date and time'
      });
    }
  }

  // Update reservation
  await db.query(
    `UPDATE reservations SET
      branch_id = ?,
      room_number = ?,
      res_date = ?,
      res_time = ?,
      room_type = ?,
      capacity = ?
     WHERE reservation_id = ?`,
    [branch_id, room_number, res_date, res_time, room_type, capacity, id]
  );

  res.json({
    success: true,
    message: 'Reservation updated successfully'
  });
}));

// DELETE /api/reservations/:id - Cancel reservation
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user_type, user_id } = getUserFromRequest(req);

  // Check if reservation exists
  const [reservations] = await db.query('SELECT * FROM reservations WHERE reservation_id = ?', [id]);
  if (reservations.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  const reservation = reservations[0];

  // Check permissions
  if (user_type === 'member' && reservation.member_id !== parseInt(user_id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Mark as unavailable (cancelled)
  await db.query(
    'UPDATE reservations SET is_available = FALSE WHERE reservation_id = ?',
    [id]
  );

  res.json({
    success: true,
    message: 'Reservation cancelled successfully'
  });
}));

// GET /api/reservations/availability - Get available rooms for a date/time
router.get('/availability/:branchId', asyncHandler(async (req, res) => {
  const { branchId } = req.params;
  const { date, time, room_type } = req.query;

  let query = `
    SELECT DISTINCT
      room_number,
      room_type,
      capacity
    FROM reservations
    WHERE branch_id = ? AND res_date = ? AND res_time = ?
  `;

  const params = [branchId, date, time];

  if (room_type) {
    query += ' AND room_type = ?';
    params.push(room_type);
  }

  const [reserved] = await db.query(query, params);

  // For simplicity, assume rooms are 101-110 for each type
  const allRooms = [
    { room_number: 'S101', room_type: 'study', capacity: 1 },
    { room_number: 'S102', room_type: 'study', capacity: 1 },
    { room_number: 'S103', room_type: 'study', capacity: 1 },
    { room_number: 'M201', room_type: 'meeting', capacity: 6 },
    { room_number: 'M202', room_type: 'meeting', capacity: 8 },
    { room_number: 'M203', room_type: 'meeting', capacity: 10 },
    { room_number: 'C301', room_type: 'conference', capacity: 15 },
    { room_number: 'C302', room_type: 'conference', capacity: 20 },
    { room_number: 'C303', room_type: 'conference', capacity: 25 }
  ];

  // Filter out reserved rooms
  const reservedRooms = new Set(reserved.map(r => r.room_number));
  const availableRooms = allRooms.filter(room => !reservedRooms.has(room.room_number));

  res.json({
    success: true,
    data: availableRooms
  });
}));

module.exports = router;
