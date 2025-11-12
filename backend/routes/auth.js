const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// Full member registration
router.post('/register/member', asyncHandler(async (req, res) => {
    const {
        member_name,
        member_email,
        member_type,
        username,
        password
    } = req.body;

    // STEP 1: Validate all required fields
    if (!member_name || !member_email || !member_type || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide member_name, member_email, member_type, username, and password'
        });
    }

    // STEP 2: Validate member_type
    const validMemberTypes = ['local', 'student', 'faculty'];
    if (!validMemberTypes.includes(member_type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid member_type. Must be: local, student, or faculty'
        });
    }

    // STEP 3: Check if email is already registered
    const [existingEmail] = await db.query(
        'SELECT member_id FROM member WHERE member_email = ?',
        [member_email]
    );

    if (existingEmail.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Email is already registered'
        });
    }

    // STEP 4: Check if username is already taken (in both tables)
    const [existingUsername] = await db.query(
        'SELECT username FROM member_auth WHERE username = ? UNION SELECT username FROM staff_auth WHERE username = ?',
        [username, username]
    );

    if (existingUsername.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Username is already taken'
        });
    }

    // STEP 5: Create member record
    const [memberResult] = await db.query(
        'INSERT INTO member (member_name, member_email, member_type, join_date, status) VALUES (?, ?, ?, CURDATE(), ?)',
        [member_name, member_email, member_type, 'Active']
    );

    const newMemberId = memberResult.insertId;

    // STEP 6: Create login credentials
    await db.query(
        'INSERT INTO member_auth (member_id, username, password) VALUES (?, ?, ?)',
        [newMemberId, username, password]
    );

    // STEP 7: Return success
    res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: {
            member_id: newMemberId,
            member_name,
            member_email,
            member_type,
            username,
            type: 'member'
        }
    });
}));

// Full staff registration - creates both staff record and login credentials
router.post('/register/staff', asyncHandler(async (req, res) => {
    const {
        name,
        email,
        ssn,
        branch_id,
        hourly,
        position,
        username,
        password,
        role
    } = req.body;

    // STEP 1: Validate all required fields
    if (!name || !email || !branch_id || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email, branch_id, username, and password'
        });
    }

    // STEP 2: Validate position (for staff table)
    const validPositions = ['associate', 'admin'];
    if (position && !validPositions.includes(position)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid position. Must be: associate or admin'
        });
    }

    // STEP 3: Validate role (for staff_auth table)
    if (role && !['admin', 'staff'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role. Must be: admin or staff'
        });
    }

    // STEP 4: Check if email is already registered
    const [existingEmail] = await db.query(
        'SELECT staff_id FROM staff WHERE email = ?',
        [email]
    );

    if (existingEmail.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Email is already registered'
        });
    }

    // STEP 5: Check if SSN is already registered (if provided)
    if (ssn) {
        const [existingSSN] = await db.query(
            'SELECT staff_id FROM staff WHERE ssn = ?',
            [ssn]
        );

        if (existingSSN.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'SSN is already registered'
            });
        }
    }

    // STEP 6: Verify branch exists
    const [branch] = await db.query(
        'SELECT branch_id FROM branches WHERE branch_id = ?',
        [branch_id]
    );

    if (branch.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Branch not found'
        });
    }

    // STEP 7: Check if username is already taken (in both tables)
    const [existingUsername] = await db.query(
        'SELECT username FROM member_auth WHERE username = ? UNION SELECT username FROM staff_auth WHERE username = ?',
        [username, username]
    );

    if (existingUsername.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Username is already taken'
        });
    }

    // STEP 8: Create staff record
    const [staffResult] = await db.query(
        'INSERT INTO staff (ssn, branch_id, name, email, hourly, position) VALUES (?, ?, ?, ?, ?, ?)',
        [ssn || null, branch_id, name, email, hourly || 15.00, position || 'associate']
    );

    const newStaffId = staffResult.insertId;

    // STEP 9: Create login credentials
    await db.query(
        'INSERT INTO staff_auth (staff_id, username, password, role) VALUES (?, ?, ?, ?)',
        [newStaffId, username, password, role || 'staff']
    );

    // STEP 10: Return success
    res.status(201).json({
        success: true,
        message: 'Staff registered successfully',
        data: {
            staff_id: newStaffId,
            name,
            email,
            branch_id,
            position: position || 'associate',
            username,
            role: role || 'staff',
            type: 'staff'
        }
    });
}));

// Login - checks both member and staff credentials
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide username and password'
        });
    }

    // Try to find user in member_auth table first
    const [memberAuth] = await db.query(
        'SELECT ma.username, ma.password, ma.member_id, m.member_name, m.member_email, m.member_type, m.status FROM member_auth ma JOIN member m ON ma.member_id = m.member_id WHERE ma.username = ?',
        [username]
    );

    if (memberAuth.length > 0) {
        const user = memberAuth[0];

        // Check if member is active
        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        // Check password 
        if (user.password === password) {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user_type: 'member',
                    member_id: user.member_id,
                    username: user.username,
                    name: user.member_name,
                    email: user.member_email,
                    member_type: user.member_type
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    }

    // If not found in member_auth, try staff_auth
    const [staffAuth] = await db.query(
        'SELECT sa.username, sa.password, sa.staff_id, sa.role, s.name, s.email, s.position, s.branch_id FROM staff_auth sa JOIN staff s ON sa.staff_id = s.staff_id WHERE sa.username = ?',
        [username]
    );

    if (staffAuth.length > 0) {
        const user = staffAuth[0];

        // Check password
        if (user.password === password) {
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user_type: 'staff',
                    staff_id: user.staff_id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    position: user.position,
                    branch_id: user.branch_id
                }
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
    }

    // User not found in either table
    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
}));

// Logout - simple endpoint (client handles session clearing)
router.post('/logout', asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
}));

module.exports = router;
