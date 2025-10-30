const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  // Expect frontend to send user info in headers: x-user-type, x-user-id
  return {
    user_type: req.headers['x-user-type'],
    user_id: req.headers['x-user-id']
  };
};

// GET /api/loans - Get all loans (excluding soft-deleted)
router.get('/', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { member_id, status } = req.query;

  let query = `
    SELECT
      l.loan_id,
      l.item_id,
      l.item_type,
      l.member_id,
      m.member_name,
      l.loan_date,
      l.due_date,
      l.return_ts,
      l.branch_id,
      CASE WHEN l.return_ts IS NULL THEN 'active' ELSE 'returned' END as status,
      COALESCE(b.title, mov.title, a.title, e.device_name) AS item_title
    FROM loan l
    LEFT JOIN member m ON l.member_id = m.member_id
    LEFT JOIN books b ON l.item_type = 'book' AND l.item_id = b.book_id
    LEFT JOIN movies mov ON l.item_type = 'movie' AND l.item_id = mov.movie_id
    LEFT JOIN articles a ON l.item_type = 'article' AND l.item_id = a.artic_id
    LEFT JOIN electronics e ON l.item_type = 'electronic_rental' AND l.item_id = e.libra_id
  `;

  const params = [];
  let whereClause = '';

  if (user_type === 'member' && user_id) {
    // Members can only see their own loans
    whereClause = ' WHERE l.member_id = ?';
    params.push(user_id);
  }
  // Staff can see all loans or filter by member_id

  if (member_id) {
    if (whereClause) {
      whereClause += ' AND l.member_id = ?';
    } else {
      whereClause = ' WHERE l.member_id = ?';
    }
    params.push(member_id);
  }

  if (status === 'active') {
    if (whereClause) {
      whereClause += ' AND l.return_ts IS NULL';
    } else {
      whereClause = ' WHERE l.return_ts IS NULL';
    }
  } else if (status === 'returned') {
    if (whereClause) {
      whereClause += ' AND l.return_ts IS NOT NULL';
    } else {
      whereClause = ' WHERE l.return_ts IS NOT NULL';
    }
  }

  query += whereClause + ' ORDER BY l.loan_date DESC';

  const [loans] = await db.query(query, params);

  res.json({
    success: true,
    count: loans.length,
    data: loans
  });
}));

// GET /api/loans/:id - Get single loan
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [loans] = await db.query(`
    SELECT l.*, m.member_name
    FROM loan l
    LEFT JOIN member m ON l.member_id = m.member_id
    WHERE l.loan_id = ?
  `, [id]);

  if (loans.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  res.json({
    success: true,
    data: loans[0]
  });
}));

// POST /api/loans - Create new loan
router.post('/', asyncHandler(async (req, res) => {
  const { member_id, item_id, item_type, branch_id, due_date } = req.body;

  // Validate required fields
  if (!member_id || !item_id || !item_type) {
    return res.status(400).json({
      success: false,
      message: 'member_id, item_id, and item_type are required'
    });
  }

  // Validate item_type enum
  const validItemTypes = ['book', 'movie', 'article', 'electronic_rental'];
  if (!validItemTypes.includes(item_type)) {
    return res.status(400).json({
      success: false,
      message: `item_type must be one of: ${validItemTypes.join(', ')}`
    });
  }

  // Check member exists and get their type
  const [members] = await db.query(
    'SELECT member_id, member_type FROM member WHERE member_id = ?',
    [member_id]
  );

  if (members.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Member not found'
    });
  }

  const member = members[0];

  // Check for unpaid fines (prevents trigger error)
  const [fines] = await db.query(
    "SELECT COUNT(*) as fine_count FROM fines WHERE member_id = ? AND payment_status != 'paid'",
    [member_id]
  );

  if (fines[0].fine_count > 0) {
    return res.status(400).json({
      success: false,
      message: 'Member has unpaid fines and cannot borrow items'
    });
  }

  // Check current active loans count
  const [loanCount] = await db.query(
    'SELECT COUNT(*) as active_loans FROM loan WHERE member_id = ? AND return_ts IS NULL',
    [member_id]
  );

  // Determine max loans based on member type
  const maxLoans = member.member_type === 'student' ? 5 : member.member_type === 'faculty' ? 10 : 3;

  if (loanCount[0].active_loans >= maxLoans) {
    return res.status(400).json({
      success: false,
      message: `Member has reached their loan limit of ${maxLoans} items`
    });
  }

  // Check if book is available (only for books, extend for other types as needed)
  if (item_type === 'book') {
    const [books] = await db.query(
      'SELECT book_id, copies, available FROM books WHERE book_id = ?',
      [item_id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (books[0].copies <= 0 || !books[0].available) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for checkout'
      });
    }
  }

  // Calculate due date if not provided (default 14 days)
  const calculatedDueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Create the loan (triggers handle inventory automatically)
  const [result] = await db.query(
    `INSERT INTO loan (member_id, item_id, item_type, branch_id, due_date)
     VALUES (?, ?, ?, ?, ?)`,
    [member_id, item_id, item_type, branch_id || null, calculatedDueDate]
  );

  res.status(201).json({
    success: true,
    message: 'Loan created successfully',
    data: {
      loan_id: result.insertId,
      member_id,
      item_id,
      item_type,
      branch_id,
      due_date: calculatedDueDate
    }
  });
}));

// PUT /api/loans/:id - Return a loan
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { return_ts } = req.body;

  // Check if loan exists
  const [loans] = await db.query(
    'SELECT loan_id, return_ts FROM loan WHERE loan_id = ?',
    [id]
  );

  if (loans.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  if (loans[0].return_ts !== null) {
    return res.status(400).json({
      success: false,
      message: 'Loan has already been returned'
    });
  }

  // Update return timestamp (trigger handles inventory restoration)
  const returnDate = return_ts || new Date().toISOString().split('T')[0];

  await db.query(
    'UPDATE loan SET return_ts = ? WHERE loan_id = ?',
    [returnDate, id]
  );

  res.json({
    success: true,
    message: 'Loan returned successfully',
    data: {
      loan_id: id,
      return_ts: returnDate
    }
  });
}));

// DELETE /api/loans/:id - delete a loan
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if loan exists
  const [existingLoan] = await db.query(
    'SELECT loan_id, return_ts FROM loan WHERE loan_id = ?',
    [id]
  );

  if (existingLoan.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  // Prevent deletion of active loans - loan must be returned first
  if (existingLoan[0].return_ts === null) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete an active loan. Please return the loan before deleting.'
    });
  }

  // Hard delete
  const [result] = await db.query(
    'DELETE FROM loan WHERE loan_id = ? AND return_ts IS NOT NULL',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  res.json({
    success: true,
    message: 'Loan deleted successfully'
  });
}));

module.exports = router;
