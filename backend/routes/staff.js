const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/staff - Get all staff members (Admin only)
router.get('/', asyncHandler(async (req, res) => {
    const query = `
        SELECT
            s.staff_id,
            s.name,
            s.email,
            s.hourly,
            s.position,
            s.branch_id,
            s.ssn,
            s.hire_date,
            b.name as branch_name
        FROM staff s
        LEFT JOIN branches b ON s.branch_id = b.branch_id
        WHERE s.employment_status = 'Active'
        ORDER BY s.name
    `;

    const [staff] = await db.query(query);

    res.status(200).json({
        success: true,
        message: 'Staff retrieved successfully',
        data: staff
    });
}));

// GET /api/staff/:id - Get specific staff member
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT
            s.staff_id,
            s.name,
            s.email,
            s.hourly,
            s.position,
            s.branch_id,
            s.ssn,
            s.hire_date,
            b.name as branch_name
        FROM staff s
        LEFT JOIN branches b ON s.branch_id = b.branch_id
        WHERE s.staff_id = ? AND s.employment_status = 'Active'
    `;

    const [staff] = await db.query(query, [id]);

    if (staff.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Staff member not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Staff member retrieved successfully',
        data: staff[0]
    });
}));

// POST /api/staff - Create new staff member (Admin only)
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, ssn, branch_id, hourly, position } = req.body;

    // Validate required fields
    if (!name || !email || !branch_id) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and branch_id are required'
        });
    }

    // Check if email already exists
    const [existingEmail] = await db.query(
        'SELECT staff_id FROM staff WHERE email = ? AND employment_status = "Active"',
        [email]
    );

    if (existingEmail.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Email already exists'
        });
    }

    // Check if SSN already exists (if provided)
    if (ssn) {
        const [existingSSN] = await db.query(
            'SELECT staff_id FROM staff WHERE ssn = ? AND employment_status = "Active"',
            [ssn]
        );

        if (existingSSN.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'SSN already exists'
            });
        }
    }

    // Verify branch exists
    const [branch] = await db.query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
    if (branch.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid branch_id'
        });
    }

    // Insert new staff member
    const [result] = await db.query(
        'INSERT INTO staff (name, email, ssn, branch_id, hourly, position, hire_date, employment_status) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), "Active")',
        [name, email, ssn || null, branch_id, hourly || 15.00, position || 'associate']
    );

    const newStaffId = result.insertId;

    // Create auth record if needed
    await db.query(
        'INSERT INTO staff_auth (staff_id, username, password, role) VALUES (?, ?, ?, ?)',
        [newStaffId, email, 'password123', 'staff'] // Default password, should be changed
    );

    res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: {
            staff_id: newStaffId,
            name,
            email,
            branch_id,
            position: position || 'associate'
        }
    });
}));

// PUT /api/staff/:id - Update staff member (Admin only)
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, branch_id, hourly, position } = req.body;

    // Check if staff member exists
    const [existingStaff] = await db.query(
        'SELECT staff_id FROM staff WHERE staff_id = ? AND employment_status = "Active"',
        [id]
    );

    if (existingStaff.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Staff member not found'
        });
    }

    // Check if email conflicts with another staff member
    if (email) {
        const [emailConflict] = await db.query(
            'SELECT staff_id FROM staff WHERE email = ? AND staff_id != ? AND employment_status = "Active"',
            [email, id]
        );

        if (emailConflict.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
    }

    // Verify branch exists if provided
    if (branch_id) {
        const [branch] = await db.query('SELECT branch_id FROM branches WHERE branch_id = ?', [branch_id]);
        if (branch.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch_id'
            });
        }
    }

    // Update staff member
    const updateData = {};
    const updateFields = [];
    const updateValues = [];

    if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
    }
    if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
    }
    if (branch_id) {
        updateFields.push('branch_id = ?');
        updateValues.push(branch_id);
    }
    if (hourly !== undefined) {
        updateFields.push('hourly = ?');
        updateValues.push(hourly);
    }
    if (position) {
        updateFields.push('position = ?');
        updateValues.push(position);
    }

    if (updateFields.length > 0) {
        updateValues.push(id);
        const updateQuery = `UPDATE staff SET ${updateFields.join(', ')} WHERE staff_id = ?`;

        await db.query(updateQuery, updateValues);
    }

    res.status(200).json({
        success: true,
        message: 'Staff member updated successfully'
    });
}));

// DELETE /api/staff/:id - Delete staff member (Admin only)
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if staff member exists
    const [existingStaff] = await db.query(
        'SELECT staff_id FROM staff WHERE staff_id = ? AND employment_status = "Active"',
        [id]
    );

    if (existingStaff.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Staff member not found'
        });
    }

    // Soft delete by updating status
    await db.query(
        'UPDATE staff SET employment_status = "Terminated", close_date = CURDATE() WHERE staff_id = ?',
        [id]
    );

    // Update auth record to prevent login
    await db.query(
        'UPDATE staff_auth SET role = "inactive" WHERE staff_id = ?',
        [id]
    );

    res.status(200).json({
        success: true,
        message: 'Staff member terminated successfully'
    });
}));

module.exports = router;
