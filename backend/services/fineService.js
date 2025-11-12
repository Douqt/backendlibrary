const db = require('../config/db');

class FineService {
  // Calculate fine for overdue loans
  async calculateOverdueFines() {
    const today = new Date().toISOString().split('T')[0];

    // Find all overdue loans
    const [overdueLoans] = await db.query(
      `SELECT l.loan_id, l.member_id, l.item_id, l.item_type, l.due_date,
              DATEDIFF(?, l.due_date) as days_overdue
       FROM loan l
       WHERE l.return_ts IS NULL AND l.due_date < ?`,
      [today, today]
    );

    const finesCreated = [];

    for (const loan of overdueLoans) {
      const daysOverdue = loan.days_overdue;
      const fineAmount = daysOverdue * 0.50; // $0.50 per day

      // Check if fine already exists for this loan
      const [existingFine] = await db.query(
        'SELECT fine_id FROM fines WHERE loan_id = ? AND reason = "late"',
        [loan.loan_id]
      );

      if (existingFine.length === 0) {
        // Create fine
        const [result] = await db.query(
          `INSERT INTO fines (loan_id, member_id, item_id, amount, reason, payment_status)
           VALUES (?, ?, ?, ?, 'late', 'unpaid')`,
          [loan.loan_id, loan.member_id, loan.item_id, fineAmount]
        );

        finesCreated.push({
          fine_id: result.insertId,
          loan_id: loan.loan_id,
          amount: fineAmount,
          days_overdue: daysOverdue
        });
      }
    }

    return finesCreated;
  }

  // Check for unpaid fines preventing new loans
  async hasUnpaidFines(memberId) {
    const [fines] = await db.query(
      "SELECT COUNT(*) as count FROM fines WHERE member_id = ? AND payment_status != 'paid'",
      [memberId]
    );

    return fines[0].count > 0;
  }

  // Get total unpaid fines for a member
  async getTotalUnpaidFines(memberId) {
    const [result] = await db.query(
      "SELECT SUM(amount) as total FROM fines WHERE member_id = ? AND payment_status != 'paid'",
      [memberId]
    );

    return result[0].total || 0;
  }
}

module.exports = new FineService();
