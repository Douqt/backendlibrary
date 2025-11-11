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

module.exports = router;
