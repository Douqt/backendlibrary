const express = require('express');
const router = express.Router();
const db = require('../config/db');
const {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead
} = require('../services/notificationService');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  return {
    user_type: req.headers['x-user-type'],
    user_id: parseInt(req.headers['x-user-id'])
  };
};

// GET /api/notifications - Get notifications for logged-in member
router.get('/', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    // Only members can view notifications
    if (user.user_type !== 'member') {
      return res.json({ notifications: [], count: 0 });
    }

    const memberId = user.user_id;

    // Get unread notifications from database
    const notifications = await getUnreadNotifications(memberId, 50);

    // Transform to match frontend format
    const formattedNotifications = notifications.map(notif => ({
      notification_id: notif.notification_id,
      type: notif.notification_type,
      message: notif.message,
      created_at: notif.created_at,
      is_read: notif.is_read,
      related_loan_id: notif.related_loan_id,
      related_fine_id: notif.related_fine_id,
      // Map notification type to navigation link
      link: notif.notification_type.includes('loan') ? 'loans' :
            notif.notification_type.includes('fine') ? 'fines' : 'loans'
    }));

    res.json({
      notifications: formattedNotifications,
      count: formattedNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/history - Get all notifications with pagination
router.get('/history', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    if (user.user_type !== 'member') {
      return res.status(403).json({ error: 'Only members can view notification history' });
    }

    const memberId = user.user_id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    const result = await getAllNotifications(memberId, page, pageSize);

    res.json(result);

  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    if (user.user_type !== 'member') {
      return res.status(403).json({ error: 'Only members can mark notifications as read' });
    }

    const notificationId = parseInt(req.params.id);
    const memberId = user.user_id;

    const success = await markAsRead(notificationId, memberId);

    if (success) {
      res.json({ success: true, message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found or already read' });
    }

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    if (user.user_type !== 'member') {
      return res.status(403).json({ error: 'Only members can mark notifications as read' });
    }

    const memberId = user.user_id;
    const count = await markAllAsRead(memberId);

    res.json({
      success: true,
      message: `${count} notification(s) marked as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Legacy computed notifications route (keeping for backward compatibility)
router.get('/computed', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    // Only members can view notifications
    if (user.user_type !== 'member') {
      return res.json({ notifications: [], count: 0 });
    }

    const memberId = user.user_id;
    const notifications = [];

    // 1. Get member info for loan limit calculation
    const [memberRows] = await db.query(
      'SELECT member_type, num_loans FROM member WHERE member_id = ?',
      [memberId]
    );

    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberRows[0];

    // Determine max loans based on member type
    const maxLoans = {
      'local': 3,
      'student': 5,
      'faculty': 10
    }[member.member_type] || 5;

    // 2. Get active loans (not returned yet)
    const [activeLoans] = await db.query(
      `SELECT
        l.loan_id,
        l.item_id,
        l.item_type,
        l.due_date,
        l.loan_date,
        COALESCE(b.book_title, m.movie_title, a.article_title, e.rental_name) as item_title,
        DATEDIFF(l.due_date, CURRENT_DATE()) as days_until_due
      FROM loan l
      LEFT JOIN book b ON l.item_type = 'book' AND l.item_id = b.book_id
      LEFT JOIN movie m ON l.item_type = 'movie' AND l.item_id = m.movie_id
      LEFT JOIN article a ON l.item_type = 'article' AND l.item_id = a.article_id
      LEFT JOIN electronic_rental e ON l.item_type = 'electronic_rental' AND l.item_id = e.rental_id
      WHERE l.member_id = ? AND l.return_ts IS NULL
      ORDER BY l.due_date ASC`,
      [memberId]
    );

    // 3. Process loan notifications
    activeLoans.forEach(loan => {
      const daysUntilDue = loan.days_until_due;

      if (daysUntilDue === 0) {
        // Due today
        notifications.push({
          type: 'due_today',
          message: `"${loan.item_title}" is due today`,
          link: 'loans',
          data: { loan_id: loan.loan_id, due_date: loan.due_date }
        });
      } else if (daysUntilDue > 0 && daysUntilDue <= 3) {
        // Due soon (within 3 days)
        const dayText = daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`;
        notifications.push({
          type: 'due_soon',
          message: `"${loan.item_title}" due ${dayText}`,
          link: 'loans',
          data: { loan_id: loan.loan_id, due_date: loan.due_date }
        });
      }
    });

    // 4. Get unpaid fines
    const [unpaidFines] = await db.query(
      `SELECT
        fine_id,
        amount,
        reason,
        created_at
      FROM fines
      WHERE member_id = ? AND payment_status = 'unpaid'
      ORDER BY created_at DESC`,
      [memberId]
    );

    // 5. Process fine notifications
    if (unpaidFines.length > 0) {
      const totalFines = unpaidFines.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);

      if (unpaidFines.length === 1) {
        notifications.push({
          type: 'unpaid_fine',
          message: `You have 1 unpaid fine ($${totalFines.toFixed(2)})`,
          link: 'fines',
          data: { count: 1, total: totalFines }
        });
      } else {
        notifications.push({
          type: 'unpaid_fine',
          message: `You have ${unpaidFines.length} unpaid fines ($${totalFines.toFixed(2)})`,
          link: 'fines',
          data: { count: unpaidFines.length, total: totalFines }
        });
      }
    }

    // 6. Check loan limit warning (approaching max)
    if (member.num_loans >= maxLoans - 1) {
      notifications.push({
        type: 'loan_limit',
        message: `You have ${member.num_loans} of ${maxLoans} loans checked out`,
        link: 'loans',
        data: { current: member.num_loans, max: maxLoans }
      });
    }

    res.json({
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
