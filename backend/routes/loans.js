const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const fineService = require('../services/fineService');
const priorityQueueService = require('../services/priorityQueueService');

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
  const { member_id, item_id, item_type: requestItemType, branch_id, due_date } = req.body;

  // Validate required fields
  if (!member_id || !item_id || !requestItemType) {
    return res.status(400).json({
      success: false,
      message: 'member_id, item_id, and item_type are required'
    });
  }

  // Parse prefixed item_id to determine type and actual ID
  // book-1, movie-1, article-1, electronic-1
  let actualItemId, finalItemType;
  const itemIdStr = String(item_id); // Ensure it's a string
  if (itemIdStr.includes('-')) {
    const parts = itemIdStr.split('-');
    const parsedItemType = parts[0];
    actualItemId = parseInt(parts[1]);

    // Use parsed type, converting 'electronic' to 'electronic_rental'
    finalItemType = parsedItemType === 'electronic' ? 'electronic_rental' : parsedItemType;
  } else {
    // Fallback for non-prefixed IDs
    actualItemId = parseInt(itemIdStr);
    finalItemType = requestItemType || 'book'; // Use the provided item_type or default to book
  }

  // Validate item_type enum
  const validItemTypes = ['book', 'movie', 'article', 'electronic_rental'];
  if (!validItemTypes.includes(finalItemType)) {
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

  // Check for unpaid fines using service
  const hasUnpaidFines = await fineService.hasUnpaidFines(member_id);
  if (hasUnpaidFines) {
    return res.status(400).json({
      success: false,
      message: 'Member has unpaid fines and cannot borrow items'
    });
  }

  // Check if member already has this item loaned (prevent duplicate loans)
  // For duplicate checking, we need to compare against the actual item_id and type
  // But since we store composite IDs, we need to check if a composite ID for the same item already exists
  const [existingLoan] = await db.query(
    'SELECT loan_id FROM loan WHERE member_id = ? AND item_type = ? AND return_ts IS NULL AND item_id = ?',
    [member_id, finalItemType, actualItemId]
  );

  if (existingLoan.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Member already has this item loaned. Cannot loan the same item twice.'
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

  // Check if item is available (extend for other types as needed)
  if (finalItemType === 'book') {
    const [books] = await db.query(
      'SELECT book_id, copies, available FROM books WHERE book_id = ?',
      [actualItemId]
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
  } else if (finalItemType === 'movie') {
    const [movies] = await db.query(
      'SELECT movie_id, copy_amount, available FROM movies WHERE movie_id = ?',
      [actualItemId]
    );

    if (movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    if (movies[0].copy_amount <= 0 || !movies[0].available) {
      return res.status(400).json({
        success: false,
        message: 'Movie is not available for checkout'
      });
    }
  } else if (finalItemType === 'article') {
    const [articles] = await db.query(
      'SELECT artic_id, copies, available FROM articles WHERE artic_id = ?',
      [actualItemId]
    );

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (articles[0].copies <= 0 || !articles[0].available) {
      return res.status(400).json({
        success: false,
        message: 'Article is not available for checkout'
      });
    }
  } else if (finalItemType === 'electronic_rental') {
    const [electronics] = await db.query(
      'SELECT libra_id, copy_amount, available FROM electronics WHERE libra_id = ?',
      [actualItemId]
    );

    if (electronics.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Electronic item not found'
      });
    }

    if (electronics[0].copy_amount <= 0 || !electronics[0].available) {
      return res.status(400).json({
        success: false,
        message: 'Electronic item is not available for checkout'
      });
    }
  }

  // Calculate due date if not provided (default 14 days)
  const calculatedDueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Create the loan
  const [result] = await db.query(
    `INSERT INTO loan (member_id, item_id, item_type, branch_id, due_date)
     VALUES (?, ?, ?, ?, ?)`,
    [member_id, actualItemId, finalItemType, branch_id || null, calculatedDueDate]
  );

  // Update member's last checkout date
  await db.query(
    'UPDATE member SET date_last_checked_out = CURDATE() WHERE member_id = ?',
    [member_id]
  );

  res.status(201).json({
    success: true,
    message: 'Loan created successfully',
    data: {
      loan_id: result.insertId,
      member_id,
      item_id: actualItemId,
      item_type: finalItemType,
      branch_id,
      due_date: calculatedDueDate
    }
  });
}));

// PUT /api/loans/:id - Return a loan
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { return_ts } = req.body;

  // Check if loan exists and get item details
  const [loans] = await db.query(
    'SELECT loan_id, item_id, item_type, return_ts FROM loan WHERE loan_id = ?',
    [id]
  );

  if (loans.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Loan not found'
    });
  }

  const loan = loans[0];

  if (loan.return_ts !== null) {
    return res.status(400).json({
      success: false,
      message: 'Loan has already been returned'
    });
  }

  // Update return timestamp
  const returnDate = return_ts || new Date().toISOString().split('T')[0];

  await db.query(
    'UPDATE loan SET return_ts = ? WHERE loan_id = ?',
    [returnDate, id]
  );

  // Handle inventory restoration and hold request fulfillment
  if (loan.item_type === 'book') {
    // Always increment copies and make available if copies > 0
    // Hold requests don't prevent checkout - they just queue up
    await db.query(
      'UPDATE books SET copies = copies + 1, available = CASE WHEN copies + 1 > 0 THEN TRUE ELSE FALSE END WHERE book_id = ?',
      [loan.item_id]
    );

    // Check if there are pending hold requests and fulfill the next one
    const [pendingHolds] = await db.query(
      'SELECT COUNT(*) as count FROM hold_requests WHERE item_id = ? AND status = "pending"',
      [loan.item_id]
    );

    if (pendingHolds[0].count > 0) {
      // Fulfill the next hold request in the priority queue
      await priorityQueueService.fulfillNextRequest(loan.item_id);
    }
  }
  // TODO: Add similar logic for movies, articles, and electronics when needed

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
