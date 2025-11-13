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
  account_approved: (data) => `Welcome to the library! Your account has been approved. You can now start borrowing items.`
};

/**
 * Create and send a notification (both in-app and email)
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to notify
 * @param {string} options.notificationType - Type of notification
 * @param {Object} options.data - Data for template population
 * @param {number} options.relatedLoanId - Optional loan ID
 * @param {number} options.relatedFineId - Optional fine ID
 * @param {boolean} options.sendEmail - Whether to send email (default: true)
 * @returns {Promise<Object>} - Created notification with email status
 */
async function createNotification({
  memberId,
  notificationType,
  data,
  relatedLoanId = null,
  relatedFineId = null,
  sendEmail: shouldSendEmail = true
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Generate notification message
    const messageTemplate = notificationMessages[notificationType];
    if (!messageTemplate) {
      throw new Error(`Unknown notification type: ${notificationType}`);
    }
    const message = messageTemplate(data);

    // Insert notification into database
    const [notificationResult] = await connection.query(
      `INSERT INTO notifications
       (member_id, notification_type, message, related_loan_id, related_fine_id)
       VALUES (?, ?, ?, ?, ?)`,
      [memberId, notificationType, message, relatedLoanId, relatedFineId]
    );

    const notificationId = notificationResult.insertId;

    // Get member email if we need to send email
    let emailResult = { success: false, skipped: true };
    if (shouldSendEmail) {
      const [members] = await connection.query(
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
        await connection.query(
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
          await connection.query(
            'UPDATE notifications SET sent_via_email = TRUE, email_sent_at = NOW() WHERE notification_id = ?',
            [notificationId]
          );
        }
      } else {
        console.warn(`No email found for member ${memberId}`);
        emailResult = { success: false, error: 'No email address on file' };
      }
    }

    await connection.commit();

    console.log(`Notification created: ${notificationType} for member ${memberId}`);

    return {
      success: true,
      notificationId,
      message,
      emailSent: emailResult.success,
      emailError: emailResult.error || null
    };

  } catch (error) {
    await connection.rollback();
    console.error('Error creating notification:', error);
    throw error;
  } finally {
    connection.release();
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

module.exports = {
  createNotification,
  markAsRead,
  getUnreadNotifications,
  getAllNotifications,
  markAllAsRead,
  deleteOldNotifications
};
