const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

//GET /api/members - get all members
router.get('/', asyncHandler(async(req, res) => {
    const [members] = await db.query(`
        SELECT member_id, member_name, member_email, member_type, join_date, close_date, status, num_loans, date_last_checked_out
        FROM member
        WHERE close_date = '9999-01-01'
        ORDER BY join_date DESC
    `);

    res.json({
        success: true,
        count: members.length,
        data: members
    });
}));

//GET /api/members/:id - get single member
router.get('/:id', asyncHandler(async(req, res) => {
    const {id} = req.params;

    const[members] = await db.query(`
        SELECT member_id, member_name, member_email, member_type, join_date, close_date, status, num_loans, date_last_checked_out
        FROM member
        WHERE member_id = ? AND close_date = '9999-01-01'
    `, [id]);

    if (members.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Member not found'
        });
    }

    res.json({
        success: true,
        data: members[0]
    });
}));

//POST /api/members - create new member 
router.post('/', asyncHandler(async(req, res) => {
    const {member_name, member_email, member_type, join_date} = req.body;

    //validate required fields
    if(!member_name || !member_email || !member_type || !join_date){
        return res.status(400).json({
            success: false,
            message: 'Please provide member_name, member_email, member_type, and join_date'
        });
    }

    //validate member_type enum
    if(!['local', 'student', 'faculty'].includes(member_type)){
        return res.status(400).json({
            success: false,
            message: 'Member type must be one of the following: "local", "student", or "faculty"'
        });
    }

    //check if email already exists for active members
    const [existingMember] = await db.query(`
        SELECT member_email
        FROM member
        WHERE member_email = ? AND close_date = '9999-01-01'
    `, [member_email]);

    if (existingMember.length > 0){
        return res.status(400).json({
            success: false,
            message: 'Email already exists for an active member'
        });
    }

    //insert new member into table 
    const [result] = await db.query(`
        INSERT INTO member
        (member_name, member_email, member_type, join_date, close_date, status, num_loans)
        VALUES (?, ?, ?, ?, '9999-01-01', 'Active', 0)
    `, [member_name, member_email, member_type, join_date]);
    
    res.status(201).json({
        success: true,
        message: 'Member created successfully',
        data: {
            member_id: result.insertId,
            member_name,
            member_email,
            member_type,
            join_date,
            status: 'Active'
        }
    });
}));

//PUT /api/members/:id -update a member 
router.put('/:id', asyncHandler(async(req, res) => {
    const {id} = req.params;
    const {member_name, member_email, member_type, status} = req.body;

    //validate required fields
    if(!member_name || !member_email || !member_type){
        return res.status(400).json({
            success: false,
            message: 'Please provide member_name, member_email, and member_type'
        });
    }

    //validate member_type enum
    if(!['local', 'student', 'faculty'].includes(member_type)){
        return res.status(400).json({
            success: false,
            message: 'Member type must be one of the following: "local", "student", or "faculty"'
        });
    }

    //validate status enum if provided
    if(status && !['Active', 'Inactive', 'Closed', 'Pending'].includes(status)){
        return res.status(400).json({
            success: false,
            message: 'Status must be one of the following: "Active", "Inactive", "Closed", or "Pending"'
        });
    }

    //check if member exists
    const [existingMember] = await db.query(
        'SELECT member_id FROM member WHERE member_id = ? AND close_date = "9999-01-01"',
        [id]
    )

    if(existingMember.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Member not found or account is closed'
        })
    }

    //update member
    await db.query(`
        UPDATE member
        SET member_name = ?, member_email = ?, member_type = ?, status = ?
        WHERE member_id = ? AND close_date = '9999-01-01'
    `, [member_name, member_email, member_type, status || 'Active', id]);

    res.json({
        success: true,
        message: 'Member updated successfully',
        data: {
            member_id: id,
            member_name,
            member_email,
            member_type,
            status: status || 'Active'
        }
    });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    //check if member exists and is not already closed
    const [existingMember] = await db.query(
        'SELECT member_id, close_date FROM member WHERE member_id = ?',
        [id]
    );

    if (existingMember.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Member not found'
        });
    }

    if (existingMember[0].close_date !== '9999-01-01') {
        return res.status(400).json({
            success: false,
            message: 'Member account is already closed'
        });
    }

    //check for active loans
    const [activeLoans] = await db.query(
        'SELECT COUNT(*) as loan_count FROM loan WHERE member_id = ? AND return_ts IS NULL AND deleted_at IS NULL',
        [id]
    );

    if (activeLoans[0].loan_count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot close account with active loans'
        });
    }

    //close account by setting close_date to today
    await db.query(
        'UPDATE member SET close_date = CURDATE(), status = "Closed" WHERE member_id = ?',
        [id]
    );

    res.json({
        success: true,
        message: 'Member account closed successfully'
    });
}));

// POST /api/members/me/update - Update current user's info (name, username, and/or password)
router.post('/me/update', asyncHandler(async (req, res) => {
    const { member_name, username, current_password, new_password } = req.body;

    // Get user info from headers
    const userType = req.headers['x-user-type'];
    const userId = req.headers['x-user-id'];

    // Verify user is a member
    if (userType !== 'member') {
        return res.status(403).json({
            success: false,
            message: 'This endpoint is only for members'
        });
    }

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Validate that at least one field is being updated
    if (!member_name && !username && !new_password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide member_name, username, or new_password to update'
        });
    }

    // Get current member data
    const [members] = await db.query(
        'SELECT m.member_id, m.member_name, m.member_email, m.member_type, ma.password, ma.username FROM member m JOIN member_auth ma ON m.member_id = ma.member_id WHERE m.member_id = ?',
        [userId]
    );

    if (members.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Member not found'
        });
    }

    const member = members[0];

    // If updating username, check if it's already taken
    if (username && username !== member.username) {
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

        // Update username
        await db.query(
            'UPDATE member_auth SET username = ? WHERE member_id = ?',
            [username, userId]
        );
    }

    // If updating password, verify current password
    if (new_password) {
        if (!current_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password is required to change password'
            });
        }

        if (member.password !== current_password) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Update password
        await db.query(
            'UPDATE member_auth SET password = ? WHERE member_id = ?',
            [new_password, userId]
        );
    }

    // Update member name if provided
    if (member_name) {
        await db.query(
            'UPDATE member SET member_name = ? WHERE member_id = ?',
            [member_name, userId]
        );
    }

    // Return updated user data
    res.json({
        success: true,
        message: 'Information updated successfully',
        data: {
            member_id: member.member_id,
            member_name: member_name || member.member_name,
            member_email: member.member_email,
            member_type: member.member_type,
            username: username || member.username
        }
    });
}));

module.exports = router;
