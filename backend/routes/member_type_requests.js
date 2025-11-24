const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const { createNotification } = require('../services/notificationService');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  return {
    user_type: req.headers['x-user-type'],
    user_id: req.headers['x-user-id']
  };
};

// Loan limits by member type
const LOAN_LIMITS = {
  local: 3,
  student: 5,
  faculty: 10
};

// POST /api/member-type-requests - Create a new type change request
router.post('/', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { member_id, requested_type, request_reason } = req.body;

  // Authorization: members can only request for themselves
  if (user_type === 'member' && parseInt(user_id) !== parseInt(member_id)) {
    return res.status(403).json({ error: 'You can only request type changes for yourself' });
  }

  // Validation
  if (!member_id || !requested_type || !request_reason) {
    return res.status(400).json({ error: 'member_id, requested_type, and request_reason are required' });
  }

  if (!['local', 'student', 'faculty'].includes(requested_type)) {
    return res.status(400).json({ error: 'Invalid requested_type' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get current member type and check active loans
    const [memberRows] = await connection.query(
      `SELECT member_type, member_name, member_email
       FROM member
       WHERE member_id = ? AND close_date = '9999-01-01'`,
      [member_id]
    );

    if (memberRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member not found or account is closed' });
    }

    const currentType = memberRows[0].member_type;
    const memberName = memberRows[0].member_name;

    // Check if requesting same type
    if (currentType === requested_type) {
      await connection.rollback();
      return res.status(400).json({ error: 'Requested type is the same as current type' });
    }

    // Check for existing pending/under_review requests
    const [existingRequests] = await connection.query(
      `SELECT request_id
       FROM member_type_change_requests
       WHERE member_id = ? AND status IN ('pending', 'under_review')`,
      [member_id]
    );

    if (existingRequests.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'You already have a pending type change request' });
    }

    // Check active loan count for downgrades
    const [loanCount] = await connection.query(
      `SELECT COUNT(*) as count
       FROM loan
       WHERE member_id = ? AND return_ts IS NULL`,
      [member_id]
    );

    const activeLoanCount = loanCount[0].count;
    const newLimit = LOAN_LIMITS[requested_type];

    if (activeLoanCount > newLimit) {
      await connection.rollback();
      return res.status(400).json({
        error: `You must return ${activeLoanCount - newLimit} item(s) before requesting a downgrade to ${requested_type} type`,
        activeLoanCount,
        newLimit
      });
    }

    // Create the request
    const [result] = await connection.query(
      `INSERT INTO member_type_change_requests
       (member_id, current_type, requested_type, request_reason, status, conditions_met)
       VALUES (?, ?, ?, ?, 'pending', TRUE)`,
      [member_id, currentType, requested_type, request_reason]
    );

    const requestId = result.insertId;

    // Notify the member
    await createNotification({
      memberId: member_id,
      notificationType: 'member_type_change_requested',
      data: {
        memberName: memberName,
        currentType: currentType,
        requestedType: requested_type
      },
      relatedTypeChangeRequestId: requestId,
      sendEmail: true,
      connection: connection
    });

    // Notify all active staff
    const [staffMembers] = await connection.query(
      `SELECT staff_id FROM staff WHERE employment_status = 'Active'`
    );

    // Note: We'd need a staff notification system, for now we'll skip this
    // In a real implementation, create a staff_notifications table similar to member notifications

    await connection.commit();

    res.status(201).json({
      message: 'Type change request submitted successfully',
      request_id: requestId,
      status: 'pending'
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// GET /api/member-type-requests - Get type change requests
router.get('/', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { status, member_id } = req.query;

  let query = `
    SELECT
      mtcr.request_id,
      mtcr.member_id,
      mtcr.current_type,
      mtcr.requested_type,
      mtcr.request_date,
      mtcr.request_reason,
      mtcr.status,
      mtcr.reviewed_by_staff_id,
      mtcr.review_date,
      mtcr.review_notes,
      mtcr.condition_return_overdue_items,
      mtcr.condition_pay_outstanding_fines,
      mtcr.condition_verification_documents,
      mtcr.conditions_met,
      mtcr.conditions_verified_date,
      mtcr.approved_date,
      mtcr.rejected_date,
      mtcr.rejection_reason,
      m.member_name,
      m.member_email,
      s.name as reviewer_name
    FROM member_type_change_requests mtcr
    JOIN member m ON mtcr.member_id = m.member_id
    LEFT JOIN staff s ON mtcr.reviewed_by_staff_id = s.staff_id
  `;

  const params = [];
  const conditions = [];

  // Members can only see their own requests
  if (user_type === 'member' && user_id) {
    conditions.push('mtcr.member_id = ?');
    params.push(user_id);
  }

  // Filter by member_id (for staff)
  if (member_id && user_type === 'staff') {
    conditions.push('mtcr.member_id = ?');
    params.push(member_id);
  }

  // Filter by status
  if (status) {
    conditions.push('mtcr.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY mtcr.request_date DESC';

  const [requests] = await db.query(query, params);

  res.json(requests);
}));

// GET /api/member-type-requests/:id - Get specific request
router.get('/:id', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;

  const [requests] = await db.query(
    `SELECT
      mtcr.*,
      m.member_name,
      m.member_email,
      s.name as reviewer_name
    FROM member_type_change_requests mtcr
    JOIN member m ON mtcr.member_id = m.member_id
    LEFT JOIN staff s ON mtcr.reviewed_by_staff_id = s.staff_id
    WHERE mtcr.request_id = ?`,
    [id]
  );

  if (requests.length === 0) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const request = requests[0];

  // Authorization: members can only view their own requests
  if (user_type === 'member' && parseInt(user_id) !== parseInt(request.member_id)) {
    return res.status(403).json({ error: 'You can only view your own requests' });
  }

  res.json(request);
}));

// PUT /api/member-type-requests/:id/set-conditions - Staff sets conditions
router.put('/:id/set-conditions', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;
  const {
    condition_return_overdue_items,
    condition_pay_outstanding_fines,
    condition_verification_documents,
    review_notes
  } = req.body;

  // Only staff can set conditions
  if (user_type !== 'staff') {
    return res.status(403).json({ error: 'Only staff can set conditions' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details
    const [requests] = await connection.query(
      `SELECT mtcr.*, m.member_name
       FROM member_type_change_requests mtcr
       JOIN member m ON mtcr.member_id = m.member_id
       WHERE mtcr.request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    if (!['pending', 'under_review'].includes(request.status)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Can only set conditions for pending or under_review requests' });
    }

    // Check if any conditions are set
    const anyConditionSet = condition_return_overdue_items ||
                           condition_pay_outstanding_fines ||
                           condition_verification_documents;

    // Update request with conditions
    await connection.query(
      `UPDATE member_type_change_requests
       SET
         condition_return_overdue_items = ?,
         condition_pay_outstanding_fines = ?,
         condition_verification_documents = ?,
         review_notes = ?,
         reviewed_by_staff_id = ?,
         review_date = CURRENT_TIMESTAMP,
         status = 'under_review',
         conditions_met = ?
       WHERE request_id = ?`,
      [
        !!condition_return_overdue_items,
        !!condition_pay_outstanding_fines,
        !!condition_verification_documents,
        review_notes || null,
        user_id,
        !anyConditionSet, // If no conditions set, mark as met
        id
      ]
    );

    // Notify member
    await createNotification({
      memberId: request.member_id,
      notificationType: 'member_type_change_under_review',
      data: {
        memberName: request.member_name,
        requestedType: request.requested_type,
        hasConditions: anyConditionSet
      },
      relatedTypeChangeRequestId: id,
      sendEmail: true,
      connection: connection
    });

    await connection.commit();

    res.json({ message: 'Conditions set successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// PUT /api/member-type-requests/:id/verify-conditions - Staff verifies conditions met
router.put('/:id/verify-conditions', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;

  // Only staff can verify conditions
  if (user_type !== 'staff') {
    return res.status(403).json({ error: 'Only staff can verify conditions' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details
    const [requests] = await connection.query(
      `SELECT mtcr.*, m.member_name
       FROM member_type_change_requests mtcr
       JOIN member m ON mtcr.member_id = m.member_id
       WHERE mtcr.request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    if (request.status !== 'under_review') {
      await connection.rollback();
      return res.status(400).json({ error: 'Request must be under review' });
    }

    // Update conditions as met
    await connection.query(
      `UPDATE member_type_change_requests
       SET
         conditions_met = TRUE,
         conditions_verified_date = CURRENT_TIMESTAMP,
         reviewed_by_staff_id = ?
       WHERE request_id = ?`,
      [user_id, id]
    );

    // Notify member that conditions are verified
    await createNotification({
      memberId: request.member_id,
      notificationType: 'member_type_change_conditions_set',
      data: {
        memberName: request.member_name,
        requestedType: request.requested_type
      },
      relatedTypeChangeRequestId: id,
      sendEmail: true,
      connection: connection
    });

    await connection.commit();

    res.json({ message: 'Conditions verified successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// PUT /api/member-type-requests/:id/approve - Staff approves request
router.put('/:id/approve', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;

  // Only staff can approve
  if (user_type !== 'staff') {
    return res.status(403).json({ error: 'Only staff can approve requests' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details before approval
    const [requests] = await connection.query(
      `SELECT mtcr.*, m.member_name
       FROM member_type_change_requests mtcr
       JOIN member m ON mtcr.member_id = m.member_id
       WHERE mtcr.request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    // Call stored procedure to approve
    await connection.query('CALL approve_member_type_change(?, ?)', [id, user_id]);

    // Notify member of approval
    await createNotification({
      memberId: request.member_id,
      notificationType: 'member_type_change_approved',
      data: {
        memberName: request.member_name,
        newType: request.requested_type,
        oldType: request.current_type
      },
      relatedTypeChangeRequestId: id,
      sendEmail: true,
      connection: connection
    });

    await connection.commit();

    res.json({
      message: 'Type change request approved successfully',
      new_type: request.requested_type
    });
  } catch (error) {
    await connection.rollback();

    // Handle specific errors from stored procedure
    if (error.sqlMessage) {
      return res.status(400).json({ error: error.sqlMessage });
    }
    throw error;
  } finally {
    connection.release();
  }
}));

// PUT /api/member-type-requests/:id/reject - Staff rejects request
router.put('/:id/reject', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;
  const { rejection_reason } = req.body;

  // Only staff can reject
  if (user_type !== 'staff') {
    return res.status(403).json({ error: 'Only staff can reject requests' });
  }

  if (!rejection_reason) {
    return res.status(400).json({ error: 'rejection_reason is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details
    const [requests] = await connection.query(
      `SELECT mtcr.*, m.member_name
       FROM member_type_change_requests mtcr
       JOIN member m ON mtcr.member_id = m.member_id
       WHERE mtcr.request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    if (!['pending', 'under_review'].includes(request.status)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Can only reject pending or under_review requests' });
    }

    // Update request as rejected
    await connection.query(
      `UPDATE member_type_change_requests
       SET
         status = 'rejected',
         rejected_date = CURRENT_TIMESTAMP,
         rejection_reason = ?,
         reviewed_by_staff_id = ?,
         review_date = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [rejection_reason, user_id, id]
    );

    // Notify member of rejection
    await createNotification({
      memberId: request.member_id,
      notificationType: 'member_type_change_rejected',
      data: {
        memberName: request.member_name,
        requestedType: request.requested_type,
        rejectionReason: rejection_reason
      },
      relatedTypeChangeRequestId: id,
      sendEmail: true,
      connection: connection
    });

    await connection.commit();

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// DELETE /api/member-type-requests/:id - Member withdraws request
router.delete('/:id', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { id } = req.params;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details
    const [requests] = await connection.query(
      `SELECT * FROM member_type_change_requests WHERE request_id = ?`,
      [id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[0];

    // Authorization: members can only withdraw their own requests
    if (user_type === 'member' && parseInt(user_id) !== parseInt(request.member_id)) {
      await connection.rollback();
      return res.status(403).json({ error: 'You can only withdraw your own requests' });
    }

    if (!['pending', 'under_review'].includes(request.status)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Can only withdraw pending or under_review requests' });
    }

    // Update status to withdrawn
    await connection.query(
      `UPDATE member_type_change_requests
       SET status = 'withdrawn'
       WHERE request_id = ?`,
      [id]
    );

    await connection.commit();

    res.json({ message: 'Request withdrawn successfully' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

module.exports = router;
