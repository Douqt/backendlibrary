const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  // Expect frontend to send user info in headers: x-user-type, x-user-id
  return {
    user_type: req.headers['x-user-type'],
    user_id: req.headers['x-user-id']
  };
};

// --- GET all fines ---
router.get("/", async (req, res) => {
  try {
    const { user_type, user_id } = getUserFromRequest(req);
    const member_id = req.query.member_id; // optional filter

    let whereClause = '';
    const params = [];

    if (user_type === 'member' && user_id) {
      // Members can only see their own fines
      whereClause = 'WHERE f.member_id = ?';
      params.push(parseInt(user_id, 10)); // Convert to number for database query
    }
    // Staff can see all fines or filter by member_id

    if (member_id) {
      if (whereClause) {
        whereClause += ' AND f.member_id = ?';
      } else {
        whereClause = 'WHERE f.member_id = ?';
      }
      params.push(member_id);
    }

    const [rows] = await pool.query(`
      SELECT f.fine_id, f.amount, f.reason, f.payment_status, f.created_at,
             m.member_name, l.loan_id,
             COALESCE(b.title, mov.title, a.title, e.device_name) AS item_title
      FROM fines f
      JOIN member m ON f.member_id = m.member_id
      JOIN loan l ON f.loan_id = l.loan_id
      LEFT JOIN books b ON l.item_type = 'book' AND l.item_id = b.book_id
      LEFT JOIN movies mov ON l.item_type = 'movie' AND l.item_id = mov.movie_id
      LEFT JOIN articles a ON l.item_type = 'article' AND l.item_id = a.artic_id
      LEFT JOIN electronics e ON l.item_type = 'electronic_rental' AND l.item_id = e.libra_id
      ${whereClause}
      ORDER BY f.created_at DESC
    `, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching fines:", err);
    res.status(500).json({ error: "Failed to fetch fines" });
  }
});

// --- POST create fine ---
router.post("/", async (req, res) => {
  const { loan_id, member_id, item_id, amount, reason } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO fines (loan_id, member_id, item_id, amount, reason)
      VALUES (?, ?, ?, ?, ?)
    `, [loan_id, member_id, item_id, amount, reason || "late"]);
    res.status(201).json({ message: "Fine created successfully" });
  } catch (err) {
    console.error("Error creating fine:", err);
    res.status(500).json({ error: "Failed to create fine" });
  }
});

// --- PATCH update payment status ---
router.patch("/:fine_id", async (req, res) => {
  const { fine_id } = req.params;
  const { payment_status } = req.body;
  const { user_type, user_id } = getUserFromRequest(req);

  try {
    // First check if the fine exists and belongs to the user (members only)
    let fineQuery = 'SELECT member_id FROM fines WHERE fine_id = ?';
    const [fines] = await pool.query(fineQuery, [fine_id]);

    if (fines.length === 0) {
      return res.status(404).json({ error: "Fine not found" });
    }

    // Convert user_id to number for comparison (headers come as strings)
    const numericUserId = parseInt(user_id, 10);

    // Members can only pay their own fines
    if (user_type === 'member' && fines[0].member_id !== numericUserId) {
      console.log(`Access denied: user ${numericUserId} tried to pay fine for member ${fines[0].member_id}`);
      return res.status(403).json({ error: "You can only pay your own fines" });
    }

    // Update the fine status
    await pool.query(`
      UPDATE fines
      SET payment_status = ?
      WHERE fine_id = ?
    `, [payment_status, fine_id]);

    console.log(`Fine ${fine_id} payment status updated to ${payment_status} by ${user_type} ${numericUserId}`);
    res.json({ message: "Fine status updated successfully" });
  } catch (err) {
    console.error("Error updating fine:", err);
    res.status(500).json({ error: "Failed to update fine" });
  }
});

// --- DELETE fine ---
router.delete("/:fine_id", async (req, res) => {
  const { fine_id } = req.params;
  try {
    await pool.query(`DELETE FROM fines WHERE fine_id = ?`, [fine_id]);
    res.json({ message: "Fine deleted successfully" });
  } catch (err) {
    console.error("Error deleting fine:", err);
    res.status(500).json({ error: "Failed to delete fine" });
  }
});

module.exports = router;
