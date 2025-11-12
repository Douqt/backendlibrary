const db = require('../config/db');

// In-memory notification storage (since no DB changes allowed)
let notifications = []; // Array of notification objects

class NotificationService {
  constructor() {
    this.notifications = [];
  }

  // Generate overdue notifications
  async generateOverdueNotifications() {
    const today = new Date().toISOString().split('T')[0];

    const [overdueLoans] = await db.query(
      `SELECT l.loan_id, l.member_id, l.item_id, l.item_type, l.due_date,
              m.member_name, m.member_email,
              DATEDIFF(?, l.due_date) as days_overdue,
              COALESCE(b.title, mov.title, a.title, e.device_name) AS item_title
       FROM loan l
       JOIN member m ON l.member_id = m.member_id
       LEFT JOIN books b ON l.item_type = 'book' AND l.item_id = b.book_id
       LEFT JOIN movies mov ON l.item_type = 'movie' AND l.item_id = mov.movie_id
       LEFT JOIN articles a ON l.item_type = 'article' AND l.item_id = a.artic_id
       LEFT JOIN electronics e ON l.item_type = 'electronic_rental' AND l.item_id = e.libra_id
       WHERE l.return_ts IS NULL AND l.due_date < ?`,
      [today, today]
    );

    const newNotifications = [];

    for (const loan of overdueLoans) {
      const notificationId = `overdue_${loan.loan_id}_${Date.now()}`;
      const notification = {
        id: notificationId,
        type: 'overdue',
        member_id: loan.member_id,
        member_name: loan.member_name,
        member_email: loan.member_email,
        item_title: loan.item_title,
        loan_id: loan.loan_id,
        days_overdue: loan.days_overdue,
        message: `Your loan for "${loan.item_title}" is ${loan.days_overdue} days overdue. Please return it or contact the library.`,
        created_at: new Date().toISOString(),
        sent: false
      };

      // Check if notification already exists
      const exists = this.notifications.some(n =>
        n.type === 'overdue' && n.loan_id === loan.loan_id && !n.sent
      );

      if (!exists) {
        this.notifications.push(notification);
        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }

  // Generate hold available notifications
  async generateHoldAvailableNotifications() {
    const [fulfilledRequests] = await db.query(
      `SELECT hr.request_id, hr.member_id, hr.item_id,
              m.member_name, m.member_email,
              COALESCE(b.title, mov.title, a.title, e.device_name) AS item_title
       FROM hold_requests hr
       JOIN member m ON hr.member_id = m.member_id
       LEFT JOIN books b ON hr.item_id = b.book_id
       LEFT JOIN movies mov ON hr.item_id = mov.movie_id
       LEFT JOIN articles a ON hr.item_id = a.artic_id
       LEFT JOIN electronics e ON hr.item_id = e.libra_id
       WHERE hr.status = 'fulfilled'`,
      []
    );

    const newNotifications = [];

    for (const request of fulfilledRequests) {
      // Check if notification already exists (in-memory tracking)
      const exists = this.notifications.some(n =>
        n.type === 'hold_available' && n.request_id === request.request_id && !n.sent
      );

      if (!exists) {
        const notificationId = `hold_available_${request.request_id}_${Date.now()}`;
        const notification = {
          id: notificationId,
          type: 'hold_available',
          member_id: request.member_id,
          member_name: request.member_name,
          member_email: request.member_email,
          item_title: request.item_title,
          request_id: request.request_id,
          message: `Your hold request for "${request.item_title}" is now available for pickup.`,
          created_at: new Date().toISOString(),
          sent: false
        };

        this.notifications.push(notification);
        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }

  // Generate inactive account notifications
  async generateInactiveAccountNotifications() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

    const [inactiveMembers] = await db.query(
      `SELECT member_id, member_name, member_email, date_last_checked_out
       FROM member
       WHERE close_date = '9999-01-01' AND
             (date_last_checked_out IS NULL OR date_last_checked_out < ?)`,
      [cutoffDate]
    );

    const newNotifications = [];

    for (const member of inactiveMembers) {
      const notificationId = `inactive_${member.member_id}_${Date.now()}`;
      const notification = {
        id: notificationId,
        type: 'inactive_account',
        member_id: member.member_id,
        member_name: member.member_name,
        member_email: member.member_email,
        message: `Your account has been inactive for an extended period. Please check for any outstanding loans or fines.`,
        created_at: new Date().toISOString(),
        sent: false
      };

      // Check if notification already sent recently
      const exists = this.notifications.some(n =>
        n.type === 'inactive_account' && n.member_id === member.member_id &&
        new Date(n.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Within last 30 days
      );

      if (!exists) {
        this.notifications.push(notification);
        newNotifications.push(notification);
      }
    }

    return newNotifications;
  }

  // Get notifications for a member
  getNotificationsForMember(memberId, type = null) {
    return this.notifications.filter(n => {
      if (n.member_id !== memberId) return false;
      if (type && n.type !== type) return false;
      return true;
    });
  }

  // Mark notification as sent
  markAsSent(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.sent = true;
    }
  }

  // Get all unsent notifications
  getUnsentNotifications() {
    return this.notifications.filter(n => !n.sent);
  }

  // Simulate sending notifications (in real app, this would send emails)
  async sendNotifications() {
    const unsent = this.getUnsentNotifications();
    for (const notification of unsent) {
      console.log(`Sending ${notification.type} notification to ${notification.member_email}: ${notification.message}`);
      this.markAsSent(notification.id);
    }
    return unsent.length;
  }
}

module.exports = new NotificationService();
