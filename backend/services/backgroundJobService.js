const fineService = require('./fineService');
const notificationService = require('./notificationService');
const priorityQueueService = require('./priorityQueueService');
const db = require('../config/db');

class BackgroundJobService {
  constructor() {
    this.jobs = [];
    this.running = false;
  }

  // Start background job processing
  start() {
    if (this.running) return;

    this.running = true;
    console.log('Background job service started');

    // Run jobs every hour
    this.interval = setInterval(() => {
      this.runJobs();
    }, 60 * 60 * 1000); // 1 hour

    // Also run immediately for testing
    this.runJobs();
  }

  // Stop background job processing
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
    console.log('Background job service stopped');
  }

  // Run all scheduled jobs
  async runJobs() {
    try {
      console.log('Running background jobs...');

      // Job 1: Calculate overdue fines
      const finesCreated = await fineService.calculateOverdueFines();
      if (finesCreated.length > 0) {
        console.log(`Created ${finesCreated.length} overdue fines`);
      }

      // Job 2: Generate overdue notifications
      const overdueNotifications = await notificationService.generateOverdueNotifications();
      if (overdueNotifications.length > 0) {
        console.log(`Generated ${overdueNotifications.length} overdue notifications`);
      }

      // Job 3: Generate hold available notifications
      const holdNotifications = await notificationService.generateHoldAvailableNotifications();
      if (holdNotifications.length > 0) {
        console.log(`Generated ${holdNotifications.length} hold available notifications`);
      }

      // Job 4: Generate inactive account notifications
      const inactiveNotifications = await notificationService.generateInactiveAccountNotifications();
      if (inactiveNotifications.length > 0) {
        console.log(`Generated ${inactiveNotifications.length} inactive account notifications`);
      }

      // Job 5: Send all notifications
      const sentCount = await notificationService.sendNotifications();
      if (sentCount > 0) {
        console.log(`Sent ${sentCount} notifications`);
      }

      // Job 6: Check for inactive accounts (send notifications only)
      await this.checkInactiveAccounts();

      console.log('Background jobs completed');
    } catch (error) {
      console.error('Error running background jobs:', error);
    }
  }

  // Check for inactive accounts and send notifications (per conceptual schema)
  async checkInactiveAccounts() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];

    // Find members inactive for 6+ months (per conceptual schema)
    const [inactiveMembers] = await db.query(
      `SELECT m.member_id, m.member_name, m.email, m.join_date, m.date_last_checked_out
       FROM member m
       WHERE m.close_date = '9999-01-01' AND
             (m.date_last_checked_out IS NULL OR m.date_last_checked_out < ?)`,
      [cutoffDate]
    );

    console.log(`Found ${inactiveMembers.length} potentially inactive members`);

    for (const member of inactiveMembers) {
      // Check for outstanding loans and fines (per conceptual schema)
      const [activeLoans] = await db.query(
        'SELECT COUNT(*) as count FROM loan WHERE member_id = ? AND return_ts IS NULL',
        [member.member_id]
      );

      const hasUnpaidFines = await fineService.hasUnpaidFines(member.member_id);

      // Send notification about inactivity (conceptual schema requirement)
      const notificationMessage = `Your account has been inactive for 6+ months. ` +
        `Active loans: ${activeLoans[0].count}, Outstanding fines: ${hasUnpaidFines ? 'Yes' : 'No'}. ` +
        `Please update your account or contact the library.`;

      await notificationService.createNotification(
        member.member_id,
        'Account Inactivity Notice',
        notificationMessage,
        'inactive_account'
      );

      console.log(`Sent inactivity notification to member: ${member.member_name} (${member.member_id})`);
    }
  }

  // Manual trigger for testing
  async runNow() {
    await this.runJobs();
  }
}

module.exports = new BackgroundJobService();
