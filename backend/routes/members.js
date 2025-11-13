const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { createNotification } = require('../services/notificationService');

//GET /api/members - get all members
router.get('/', asyncHandler(async(req, res) => {
    const [members] = await db.query(`
        SELECT member_id, member_name, member_email, member_type, join_date, close_date, status, num_loans, date_last_checked_out
        FROM member
        WHERE close_date = '9999-01-01' AND deleted_at IS NULL
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
        WHERE member_id = ? AND close_date = '9999-01-01' AND deleted_at IS NULL
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
    if(status && !['Active', 'Inactive', 'Closed'].includes(status)){
        return res.status(400).json({
            success: false,
            message: 'Status must be one of the following: "Active", "Inactive", or "Closed"'
        });
    }

    //check if member exists and get current status
    const [existingMember] = await db.query(
        'SELECT member_id, status FROM member WHERE member_id = ? AND close_date = "9999-01-01"',
        [id]
    )

    if(existingMember.length === 0){
        return res.status(404).json({
            success: false,
            message: 'Member not found or account is closed'
        })
    }

    const oldStatus = existingMember[0].status;
    const newStatus = status || 'Active';

    //update member
    await db.query(`
        UPDATE member
        SET member_name = ?, member_email = ?, member_type = ?, status = ?
        WHERE member_id = ? AND close_date = '9999-01-01'
    `, [member_name, member_email, member_type, newStatus, id]);

    // Send account approval notification if status changed from Pending to Active
    if (oldStatus === 'Pending' && newStatus === 'Active') {
        try {
            await createNotification({
                memberId: id,
                notificationType: 'account_approved',
                data: {
                    memberName: member_name,
                    memberType: member_type,
                    approvalDate: new Date().toISOString().split('T')[0]
                },
                sendEmail: true
            });
        } catch (notificationError) {
            // Log error but don't fail the member update
            console.error('Failed to send account approval notification:', notificationError);
        }
    }

    res.json({
        success: true,
        message: 'Member updated successfully',
        data: {
            member_id: id,
            member_name,
            member_email,
            member_type,
            status: newStatus
        }
    });
}));

//PATCH /api/members/:id/soft-delete - soft delete a member
router.patch('/:id/soft-delete', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if member exists and is not already soft deleted
    const [existingMember] = await db.query(
        'SELECT member_id, deleted_at FROM member WHERE member_id = ? AND deleted_at IS NULL',
        [id]
    );

    if (existingMember.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Member not found or already deleted'
        });
    }

    // Check for active loans
    const [activeLoans] = await db.query(
        'SELECT COUNT(*) as loan_count FROM loan WHERE member_id = ? AND return_ts IS NULL AND deleted_at IS NULL',
        [id]
    );

    if (activeLoans[0].loan_count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot soft delete member with active loans'
        });
    }

    // Soft delete by setting deleted_at to current timestamp
    await db.query(
        'UPDATE member SET deleted_at = CURRENT_TIMESTAMP WHERE member_id = ?',
        [id]
    );

    res.json({
        success: true,
        message: 'Member soft deleted successfully'
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

module.exports = router;
