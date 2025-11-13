// routes/admin_view.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/admin-view/report
 * Admin-only: Get full member summary report
 */
router.get(
  '/report',
  asyncHandler(async (req, res) => {

    const query = `
      SELECT
        member_id,
        member_name,
        member_email,
        member_type,
        member_status,
        current_loaned_items,
        total_loans,
        total_fines,
        fines_accrued,
        paid_fines_value,
        outstanding_fines_balance
      FROM vw_staff_member_report
      ORDER BY outstanding_fines_balance DESC, member_name ASC
    `;

    const [rows] = await db.query(query);

    res.status(200).json({
      success: true,
      message: 'Admin member report generated successfully',
      count: rows.length,
      data: rows,
    });
  })
);

/**
Admin-only: Get report for a single member 
from vw_staff_member_report in SQL dump file
 */
router.get(
  '/report/:memberId',
  asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const query = `
      SELECT
        member_id,
        member_name,
        member_email,
        member_type,
        member_status,
        current_loaned_items,
        total_loans,
        total_fines,
        fines_accrued,
        paid_fines_value,
        outstanding_fines_balance
      FROM vw_staff_member_report
      WHERE member_id = ?
      LIMIT 1
    `;

    const [rows] = await db.query(query, [memberId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member report not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Member report retrieved successfully',
      data: rows[0],
    });
  })
);
/*
GET /api/admin/report/summary
Admin-only: Returns bi-weekly loan counts + member summaries
*/
router.get(
  '/summary',
  asyncHandler(async (req, res) => {

    // 1) Bi-weekly loan counts (for bar graph)
    const [biweekly] = await db.query(`
      SELECT
        member_id,
        member_name,
        biweek_label,
        period_start,
        period_end,
        loans_in_period
      FROM vw_admin_biweekly_loans
      ORDER BY period_start, member_name
    `);

    // 2) Members sorted by total loans (desc)
    const [loanLeaders] = await db.query(`
      SELECT *
      FROM vw_member_summary
      ORDER BY total_loans DESC, member_name
    `);

    // 3) Members sorted by fines accrued (desc)
    const [fineLeaders] = await db.query(`
      SELECT *
      FROM vw_member_summary
      ORDER BY total_fines_accrued DESC, member_name
    `);

    // 4) Members restricted from borrowing
    const [restrictedMembers] = await db.query(`
      SELECT *
      FROM vw_member_summary
      WHERE is_restricted = 1
      ORDER BY member_name DESC
    `);

    res.status(200).json({
      success: true,
      message: 'Admin summary report generated',
      data: {
        biweekly,
        loanLeaders,
        fineLeaders,
        restrictedMembers,
      },
    });
  })
);

// Top borrowers: member_name, total_loans
router.get(
  '/top-borrowers',
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
      SELECT member_name, total_loans
      FROM vw_member_summary
      ORDER BY total_loans DESC, member_name ASC
    `);
    res.status(200).json({ success: true, data: { rows } });
  })
);

// Fines accrued vs paid: alias to match frontend keys
router.get(
  '/fines-accrued',
  asyncHandler(async (req, res) => {
    // using vw_staff_member_report so we can alias its columns
    const [rows] = await db.query(`
      SELECT 
        member_name,
        fines_accrued     AS total_fines_amount,
        paid_fines_value  AS total_fines_paid
      FROM vw_staff_member_report
      ORDER BY total_fines_amount DESC, member_name ASC
    `);
    res.status(200).json({ success: true, data: { rows } });
  })
);

// Restricted members: member_name, curr_loans, max_loans
router.get(
  '/restricted-members',
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
      SELECT member_name, curr_loans, max_loans
      FROM vw_member_summary
      WHERE is_restricted = 1
      ORDER BY member_name DESC
    `);
    res.status(200).json({ success: true, data: { rows } });
  })
);

module.exports = router;

