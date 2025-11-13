const cron = require('node-cron');
const db = require('../config/db');
const { createNotification } = require('../services/notificationService');

/**
 * Check for loans that need due date notifications
 * Runs daily to send reminders for:
 * - Loans almost due (3 days before)
 * - Loans due today
 * - Loans overdue
 */
async function checkDueDateNotifications() {
  console.log('[Notification Scheduler] Running due date check...');

  try {
    // Get all active loans (not returned yet)
    const [activeLoans] = await db.query(
      `SELECT
        l.loan_id,
        l.member_id,
        l.item_id,
        l.item_type,
        l.due_date,
        l.loan_date,
        DATEDIFF(l.due_date, CURRENT_DATE()) as days_until_due,
        m.member_name,
        m.member_email
      FROM loan l
      JOIN member m ON l.member_id = m.member_id
      WHERE l.return_ts IS NULL
        AND l.deleted_at IS NULL
      ORDER BY l.due_date ASC`
    );

    console.log(`[Notification Scheduler] Found ${activeLoans.length} active loans`);

    let almostDueCount = 0;
    let dueCount = 0;
    let overdueCount = 0;

    for (const loan of activeLoans) {
      const daysUntilDue = loan.days_until_due;

      // Get item title
      let itemTitle = `${loan.item_type} #${loan.item_id}`;
      try {
        if (loan.item_type === 'book') {
          const [bookDetails] = await db.query('SELECT title FROM books WHERE book_id = ?', [loan.item_id]);
          if (bookDetails.length > 0) {
            itemTitle = bookDetails[0].title;
          }
        } else if (loan.item_type === 'movie') {
          const [movieDetails] = await db.query('SELECT title FROM movies WHERE movie_id = ?', [loan.item_id]);
          if (movieDetails.length > 0) {
            itemTitle = movieDetails[0].title;
          }
        } else if (loan.item_type === 'article') {
          const [articleDetails] = await db.query('SELECT title FROM articles WHERE artic_id = ?', [loan.item_id]);
          if (articleDetails.length > 0) {
            itemTitle = articleDetails[0].title;
          }
        } else if (loan.item_type === 'electronic_rental') {
          const [electronicDetails] = await db.query('SELECT device_name as title FROM electronics WHERE libra_id = ?', [loan.item_id]);
          if (electronicDetails.length > 0) {
            itemTitle = electronicDetails[0].title;
          }
        }
      } catch (error) {
        console.error(`Error getting item title for loan ${loan.loan_id}:`, error);
      }

      // Determine notification type based on days until due
      if (daysUntilDue === 3) {
        // Loan almost due (3 days before)
        // Check if we already sent this notification today
        const [existingNotifications] = await db.query(
          `SELECT notification_id FROM notifications
           WHERE member_id = ?
             AND related_loan_id = ?
             AND notification_type = 'loan_almost_due'
             AND DATE(created_at) = CURRENT_DATE()`,
          [loan.member_id, loan.loan_id]
        );

        if (existingNotifications.length === 0) {
          await createNotification({
            memberId: loan.member_id,
            notificationType: 'loan_almost_due',
            data: {
              memberName: loan.member_name,
              itemTitle,
              dueDate: loan.due_date,
              daysUntilDue: 3
            },
            relatedLoanId: loan.loan_id,
            sendEmail: true
          });
          almostDueCount++;
          console.log(`[Notification] Sent 'almost due' notification for loan ${loan.loan_id}`);
        }

      } else if (daysUntilDue === 0) {
        // Loan due today
        const [existingNotifications] = await db.query(
          `SELECT notification_id FROM notifications
           WHERE member_id = ?
             AND related_loan_id = ?
             AND notification_type = 'loan_due'
             AND DATE(created_at) = CURRENT_DATE()`,
          [loan.member_id, loan.loan_id]
        );

        if (existingNotifications.length === 0) {
          await createNotification({
            memberId: loan.member_id,
            notificationType: 'loan_due',
            data: {
              memberName: loan.member_name,
              itemTitle,
              dueDate: loan.due_date
            },
            relatedLoanId: loan.loan_id,
            sendEmail: true
          });
          dueCount++;
          console.log(`[Notification] Sent 'due today' notification for loan ${loan.loan_id}`);
        }

      } else if (daysUntilDue < 0) {
        // Loan overdue
        const daysOverdue = Math.abs(daysUntilDue);

        // Get current fine amount
        const [fines] = await db.query(
          `SELECT amount FROM fines
           WHERE loan_id = ? AND payment_status = 'unpaid'
           ORDER BY created_at DESC
           LIMIT 1`,
          [loan.loan_id]
        );

        const currentFine = fines.length > 0 ? fines[0].amount : 0;

        // Send overdue notification (only once per day)
        const [existingNotifications] = await db.query(
          `SELECT notification_id FROM notifications
           WHERE member_id = ?
             AND related_loan_id = ?
             AND notification_type = 'loan_overdue'
             AND DATE(created_at) = CURRENT_DATE()`,
          [loan.member_id, loan.loan_id]
        );

        if (existingNotifications.length === 0) {
          await createNotification({
            memberId: loan.member_id,
            notificationType: 'loan_overdue',
            data: {
              memberName: loan.member_name,
              itemTitle,
              dueDate: loan.due_date,
              daysOverdue,
              currentFine: currentFine.toFixed(2)
            },
            relatedLoanId: loan.loan_id,
            sendEmail: true
          });
          overdueCount++;
          console.log(`[Notification] Sent 'overdue' notification for loan ${loan.loan_id} (${daysOverdue} days)`);
        }
      }
    }

    console.log(`[Notification Scheduler] Summary: ${almostDueCount} almost due, ${dueCount} due today, ${overdueCount} overdue`);

  } catch (error) {
    console.error('[Notification Scheduler] Error checking due dates:', error);
  }
}

/**
 * Initialize notification scheduler
 * Runs daily at 8:00 AM
 */
function initializeScheduler() {
  console.log('[Notification Scheduler] Initializing...');

  // Schedule to run every day at 8:00 AM
  // Cron format: second minute hour day month weekday
  // '0 8 * * *' = At 8:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    console.log('[Notification Scheduler] Running scheduled check at', new Date().toISOString());
    await checkDueDateNotifications();
  });

  console.log('[Notification Scheduler] Scheduled to run daily at 8:00 AM');

  // Optionally run immediately on startup for testing
  // Uncomment the line below to test notifications on server start
  // checkDueDateNotifications();
}

/**
 * Run notification check immediately (for testing/manual trigger)
 */
function runNow() {
  console.log('[Notification Scheduler] Running manual check...');
  return checkDueDateNotifications();
}

module.exports = {
  initializeScheduler,
  runNow,
  checkDueDateNotifications
};
