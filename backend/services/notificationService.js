const db = require('../config/db');
const { sendEmail } = require('./emailService');

/**
 * Notification message templates for in-app display
 */
const notificationMessages = {
  loan_confirmation: (data) => `Your loan for "${data.itemTitle}" has been confirmed. Due date: ${data.dueDate}`,
  loan_almost_due: (data) => `Reminder: "${data.itemTitle}" is due in ${data.daysUntilDue} days (${data.dueDate})`,
  loan_due: (data) => `Your loan "${data.itemTitle}" is due today. Please return it to avoid late fees.`,
  loan_overdue: (data) => `OVERDUE: "${data.itemTitle}" is ${data.daysOverdue} days overdue. Current fine: $${data.currentFine}`,
  fine_paid: (data) => `Payment of $${data.amount} received. Thank you for your payment!`,
  hold_available: (data) => `Great news! "${data.itemTitle}" is now available for pickup at ${data.branchName || 'the library'}. Please collect it within 7 days or your hold will expire.`,
  account_approved: (data) => `Welcome to the library! Your account has been approved. You can now start borrowing items.`,
  member_type_change_requested: (data) => `Your request to change membership type from ${data.currentType} to ${data.requestedType} has been submitted and is pending staff review.`,
  member_type_change_under_review: (data) => data.hasConditions
    ? `Your membership type change request is under review. Staff have set conditions that must be met before approval.`
    : `Your membership type change request is under review by staff.`,
  member_type_change_conditions_set: (data) => `The conditions for your membership type change to ${data.requestedType} have been verified. Your request is ready for final approval.`,
  member_type_change_approved: (data) => `Great news! Your membership type has been changed from ${data.oldType} to ${data.newType}. Your new benefits are now active.`,
  member_type_change_rejected: (data) => `Your request to change membership type to ${data.requestedType} has been rejected. Reason: ${data.rejectionReason}`
};

/**
 * Create and send a notification (both in-app and email)
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to notify
 * @param {string} options.notificationType - Type of notification
 * @param {Object} options.data - Data for template population
 * @param {number} options.relatedLoanId - Optional loan ID
 * @param {number} options.relatedFineId - Optional fine ID
 * @param {number} options.relatedTypeChangeRequestId - Optional type change request ID
 * @param {number} options.relatedHoldRequestId - Optional hold request ID
 * @param {boolean} options.sendEmail - Whether to send email (default: true)
 * @returns {Promise<Object>} - Created notification with email status
 */
async function createNotification({
  memberId,
  notificationType,
  data,
  relatedLoanId = null,
  relatedFineId = null,
  relatedTypeChangeRequestId = null,
  relatedHoldRequestId = null,
  sendEmail: shouldSendEmail = true,
  connection = null // Allow passing existing connection to reuse transaction
}) {
  const shouldManageConnection = !connection;
  const conn = connection || await db.getConnection();

  try {
    if (shouldManageConnection) {
      await conn.beginTransaction();
    }

    // Generate notification message
    const messageTemplate = notificationMessages[notificationType];
    if (!messageTemplate) {
      throw new Error(`Unknown notification type: ${notificationType}`);
    }
    const message = messageTemplate(data);

    // Insert notification into database
    const [notificationResult] = await conn.query(
      `INSERT INTO notifications
       (member_id, notification_type, message, related_loan_id, related_fine_id, related_type_change_request_id, related_hold_request_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [memberId, notificationType, message, relatedLoanId, relatedFineId, relatedTypeChangeRequestId, relatedHoldRequestId]
    );

    const notificationId = notificationResult.insertId;

    // Get member email if we need to send email
    let emailResult = { success: false, skipped: true };
    if (shouldSendEmail) {
      const [members] = await conn.query(
        'SELECT member_email, member_name FROM member WHERE member_id = ?',
        [memberId]
      );

      if (members.length > 0 && members[0].member_email) {
        const memberEmail = members[0].member_email;
        const memberName = members[0].member_name;

        // Add member name to data if not present
        if (!data.memberName) {
          data.memberName = memberName;
        }

        // Send email asynchronously
        emailResult = await sendEmail(memberEmail, notificationType, data);

        // Log email attempt
        await conn.query(
          `INSERT INTO notification_logs
           (notification_id, email_to, email_subject, email_body, status, error_message, attempt_count, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            notificationId,
            memberEmail,
            `${notificationType.replace(/_/g, ' ').toUpperCase()}`,
            JSON.stringify(data),
            emailResult.success ? 'sent' : 'failed',
            emailResult.error || null,
            1,
            emailResult.success ? new Date() : null
          ]
        );

        // Update notification with email sent status
        if (emailResult.success) {
          await conn.query(
            'UPDATE notifications SET sent_via_email = TRUE, email_sent_at = NOW() WHERE notification_id = ?',
            [notificationId]
          );
        }
      } else {
        console.warn(`No email found for member ${memberId}`);
        emailResult = { success: false, error: 'No email address on file' };
      }
    }

    if (shouldManageConnection) {
      await conn.commit();
    }

    console.log(`Notification created: ${notificationType} for member ${memberId}`);

    return {
      success: true,
      notificationId,
      message,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    };

  } catch (error) {
    if (shouldManageConnection) {
      await conn.rollback();
    }
    console.error('Error creating notification:', error);
    throw error;
  } finally {
    if (shouldManageConnection) {
      conn.release();
    }
  }
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} memberId - Member ID (for security check)
 * @returns {Promise<boolean>} - Success status
 */
async function markAsRead(notificationId, memberId) {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND member_id = ?',
      [notificationId, memberId]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Get unread notifications for a member
 * @param {number} memberId - Member ID
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<Array>} - Array of notifications
 */
async function getUnreadNotifications(memberId, limit = 50) {
  try {
    const [notifications] = await db.query(
      `SELECT
        notification_id,
        notification_type,
        message,
        related_loan_id,
        related_fine_id,
        is_read,
        created_at,
        sent_via_email
      FROM notifications
      WHERE member_id = ? AND is_read = FALSE
      ORDER BY created_at DESC
      LIMIT ?`,
      [memberId, limit]
    );

    return notifications;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
}

/**
 * Get all notifications for a member (with pagination)
 * @param {number} memberId - Member ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of notifications per page
 * @returns {Promise<Object>} - Paginated notifications
 */
async function getAllNotifications(memberId, page = 1, pageSize = 20) {
  try {
    const offset = (page - 1) * pageSize;

    const [notifications] = await db.query(
      `SELECT
        notification_id,
        notification_type,
        message,
        related_loan_id,
        related_fine_id,
        is_read,
        created_at,
        sent_via_email
      FROM notifications
      WHERE member_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [memberId, pageSize, offset]
    );

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE member_id = ?',
      [memberId]
    );

    return {
      notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a member
 * @param {number} memberId - Member ID
 * @returns {Promise<number>} - Number of notifications marked as read
 */
async function markAllAsRead(memberId) {
  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE member_id = ? AND is_read = FALSE',
      [memberId]
    );

    return result.affectedRows;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete old read notifications (cleanup function)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>} - Number of notifications deleted
 */
async function deleteOldNotifications(daysOld = 90) {
  try {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE is_read = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );

    console.log(`Deleted ${result.affectedRows} old notifications`);
    return result.affectedRows;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
}

/**
 * Create a hold available notification with deduplication check
 * @param {number} memberId - Member ID to notify
 * @param {number} holdRequestId - Hold request ID
 * @param {Object} itemInfo - Item information
 * @param {string} itemInfo.itemTitle - Title of the item
 * @param {string} itemInfo.branchName - Branch name where item is available
 * @param {Object} connection - Optional database connection for transactions
 * @returns {Promise<Object>} - Notification result
 */
async function createHoldAvailableNotification(memberId, holdRequestId, itemInfo, connection = null) {
  const conn = connection || await db.getConnection();
  const shouldReleaseConnection = !connection;

  try {
    // Check if notification already exists for this hold request
    const [existing] = await conn.query(
      `SELECT notification_id FROM notifications
       WHERE related_hold_request_id = ? AND notification_type = 'hold_available'
       LIMIT 1`,
      [holdRequestId]
    );

    if (existing.length > 0) {
      console.log(`Notification already exists for hold request ${holdRequestId}`);

      // Check if email was sent
      const [notif] = await conn.query(
        'SELECT sent_via_email FROM notifications WHERE notification_id = ?',
        [existing[0].notification_id]
      );

      // If email wasn't sent, try to send it now
      if (!notif[0].sent_via_email) {
        const [members] = await conn.query(
          'SELECT member_email, member_name FROM member WHERE member_id = ?',
          [memberId]
        );

        if (members.length > 0 && members[0].member_email) {
          const emailResult = await sendEmail(members[0].member_email, 'hold_available', {
            ...itemInfo,
            memberName: members[0].member_name
          });

          if (emailResult.success) {
            await conn.query(
              'UPDATE notifications SET sent_via_email = TRUE, email_sent_at = NOW() WHERE notification_id = ?',
              [existing[0].notification_id]
            );
            console.log(`Email sent for existing hold notification ${existing[0].notification_id}`);
          }
        }
      }

      return {
        success: true,
        notificationId: existing[0].notification_id,
        duplicate: true
      };
    }

    // Create new notification
    const result = await createNotification({
      memberId,
      notificationType: 'hold_available',
      data: itemInfo,
      relatedHoldRequestId: holdRequestId,
      sendEmail: true,
      connection: conn
    });

    return result;
  } catch (error) {
    console.error('Error creating hold available notification:', error);
    throw error;
  } finally {
    if (shouldReleaseConnection) {
      conn.release();
    }
  }
}

module.exports = {
  createNotification,
  markAsRead,
  getUnreadNotifications,
  getAllNotifications,
  markAllAsRead,
  deleteOldNotifications,
  createHoldAvailableNotification
};
