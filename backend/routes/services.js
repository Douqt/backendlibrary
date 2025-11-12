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

// GET /api/services - Get all services
router.get('/', asyncHandler(async (req, res) => {
  const { branch_id, service_type } = req.query;

  let query = `
    SELECT
      s.service_id,
      s.service_type,
      s.fee,
      s.branch_id,
      s.service_date,
      s.service_time,
      s.service_subject,
      s.service_description,
      b.name as branch_name,
      b.address as branch_address,
      GROUP_CONCAT(st.name SEPARATOR ', ') as staff_names
    FROM services s
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    LEFT JOIN service_staff ss ON s.service_id = ss.service_id
    LEFT JOIN staff st ON ss.staff_id = st.staff_id
  `;

  const params = [];
  let whereClause = '';

  if (branch_id) {
    whereClause = ' WHERE s.branch_id = ?';
    params.push(branch_id);
  }

  if (service_type) {
    if (whereClause) {
      whereClause += ' AND s.service_type = ?';
    } else {
      whereClause = ' WHERE s.service_type = ?';
    }
    params.push(service_type);
  }

  query += whereClause + ' GROUP BY s.service_id ORDER BY s.service_date, s.service_time';

  const [services] = await db.query(query, params);

  res.json({
    success: true,
    count: services.length,
    data: services
  });
}));

// GET /api/services/:id - Get single service with staff
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get service details
  const [services] = await db.query(`
    SELECT
      s.*,
      b.name as branch_name,
      b.address as branch_address
    FROM services s
    LEFT JOIN branches b ON s.branch_id = b.branch_id
    WHERE s.service_id = ?
  `, [id]);

  if (services.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  const service = services[0];

  // Get staff providing the service
  const [staff] = await db.query(`
    SELECT
      s.staff_id,
      s.name,
      s.email,
      s.position
    FROM service_staff ss
    JOIN staff s ON ss.staff_id = s.staff_id
    WHERE ss.service_id = ?
    ORDER BY s.name
  `, [id]);

  service.staff = staff;

  res.json({
    success: true,
    data: service
  });
}));

// POST /api/services - Create new service
router.post('/', asyncHandler(async (req, res) => {
  const { service_type, fee, branch_id, service_date, service_time, service_subject, service_description } = req.body;

  if (!service_type || fee === undefined || !branch_id) {
    return res.status(400).json({
      success: false,
      message: 'service_type, fee, and branch_id are required'
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

  // Create service
  const [result] = await db.query(
    `INSERT INTO services (service_type, fee, branch_id, service_date, service_time, service_subject, service_description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [service_type, fee, branch_id, service_date || null, service_time || null, service_subject || null, service_description || null]
  );

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: {
      service_id: result.insertId,
      service_type,
      fee,
      branch_id,
      service_date,
      service_time,
      service_subject,
      service_description
    }
  });
}));

// PUT /api/services/:id - Update service
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { service_type, fee, branch_id, service_date, service_time, service_subject, service_description } = req.body;

  // Check if service exists
  const [services] = await db.query('SELECT service_id FROM services WHERE service_id = ?', [id]);
  if (services.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Update service
  await db.query(
    `UPDATE services SET
      service_type = ?,
      fee = ?,
      branch_id = ?,
      service_date = ?,
      service_time = ?,
      service_subject = ?,
      service_description = ?
     WHERE service_id = ?`,
    [service_type, fee, branch_id, service_date, service_time, service_subject, service_description, id]
  );

  res.json({
    success: true,
    message: 'Service updated successfully'
  });
}));

// DELETE /api/services/:id - Delete service
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await db.query('DELETE FROM services WHERE service_id = ?', [id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
}));

// POST /api/services/:id/staff - Assign staff to service
router.post('/:id/staff', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { staff_id } = req.body;

  if (!staff_id) {
    return res.status(400).json({
      success: false,
      message: 'staff_id is required'
    });
  }

  // Check if service exists
  const [services] = await db.query('SELECT service_id FROM services WHERE service_id = ?', [id]);
  if (services.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Check if staff exists
  const [staff] = await db.query('SELECT staff_id FROM staff WHERE staff_id = ?', [staff_id]);
  if (staff.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Staff member not found'
    });
  }

  // Check if already assigned
  const [existing] = await db.query(
    'SELECT * FROM service_staff WHERE service_id = ? AND staff_id = ?',
    [id, staff_id]
  );

  if (existing.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Staff member is already assigned to this service'
    });
  }

  // Assign staff to service
  await db.query(
    'INSERT INTO service_staff (service_id, staff_id) VALUES (?, ?)',
    [id, staff_id]
  );

  res.json({
    success: true,
    message: 'Staff member assigned to service successfully'
  });
}));

// DELETE /api/services/:id/staff/:staffId - Remove staff from service
router.delete('/:id/staff/:staffId', asyncHandler(async (req, res) => {
  const { id, staffId } = req.params;

  const [result] = await db.query(
    'DELETE FROM service_staff WHERE service_id = ? AND staff_id = ?',
    [id, staffId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Staff assignment not found'
    });
  }

  res.json({
    success: true,
    message: 'Staff member removed from service successfully'
  });
}));

module.exports = router;
