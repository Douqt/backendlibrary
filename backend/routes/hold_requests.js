const express = require('express');
const router = express.Router();
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');
const priorityQueueService = require('../services/priorityQueueService');
const notificationService = require('../services/notificationService');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  return {
    user_type: req.headers['x-user-type'],
    user_id: req.headers['x-user-id']
  };
};

// GET /api/hold-requests - Get all hold requests
router.get('/', asyncHandler(async (req, res) => {
  const { user_type, user_id } = getUserFromRequest(req);
  const { member_id, status } = req.query;

  // First, get all hold requests
  let query = `
    SELECT
      hr.request_id,
      hr.member_id,
      hr.item_id,
      hr.request_date,
      hr.status,
      hr.queue_position,
      hr.priority_score,
      m.member_name
    FROM hold_requests hr
    LEFT JOIN member m ON hr.member_id = m.member_id
  `;

  // Then we'll enrich with item details separately

  const params = [];
  let whereClause = '';

  if (user_type === 'member' && user_id) {
    // Members can only see their own requests
    whereClause = ' WHERE hr.member_id = ?';
    params.push(user_id);
  }

  if (member_id) {
    if (whereClause) {
      whereClause += ' AND hr.member_id = ?';
    } else {
      whereClause = ' WHERE hr.member_id = ?';
    }
    params.push(member_id);
  }

  if (status) {
    if (whereClause) {
      whereClause += ' AND hr.status = ?';
    } else {
      whereClause = ' WHERE hr.status = ?';
    }
    params.push(status);
  }

  query += whereClause + ' ORDER BY hr.request_date DESC';

  const [requests] = await db.query(query, params);

  // Enrich requests with item details and auto-create loans for fulfilled holds
  for (let request of requests) {
    const compositeId = request.item_id;

    // Parse composite ID to determine type and actual ID
    let actualItemId, itemType, branchId = 1;
    if (compositeId >= 4000000) {
      itemType = 'electronic';
      actualItemId = compositeId - 4000000;
      // Get branch_id from electronics table
      const [branchResult] = await db.query('SELECT branch_id FROM electronics WHERE libra_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 3000000) {
      itemType = 'article';
      actualItemId = compositeId - 3000000;
      // Get branch_id from articles table
      const [branchResult] = await db.query('SELECT branch_id FROM articles WHERE artic_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 2000000) {
      itemType = 'movie';
      actualItemId = compositeId - 2000000;
      // Get branch_id from movies table
      const [branchResult] = await db.query('SELECT branch_id FROM movies WHERE movie_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 1000000) {
      itemType = 'book';
      actualItemId = compositeId - 1000000;
      // Get branch_id from books table
      const [branchResult] = await db.query('SELECT branch_id FROM books WHERE book_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else {
      // Fallback for old format
      itemType = 'book';
      actualItemId = compositeId;
      // Get branch_id from books table
      const [branchResult] = await db.query('SELECT branch_id FROM books WHERE book_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    }

    // Auto-create loan for fulfilled holds that don't have loans
    if (request.status === 'fulfilled') {
      const [existingLoan] = await db.query(
        'SELECT loan_id FROM loan WHERE member_id = ? AND item_id = ? AND item_type = ? AND return_ts IS NULL',
        [request.member_id, actualItemId, itemType === 'electronic' ? 'electronic_rental' : itemType]
      );

      if (existingLoan.length === 0) {
        try {
          await db.query(
            `INSERT INTO loan (item_id, item_type, member_id, loan_date, due_date, branch_id)
             VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), ?)`,
            [actualItemId, itemType === 'electronic' ? 'electronic_rental' : itemType, request.member_id, branchId]
          );
          console.log(`Auto-created loan for fulfilled hold ${request.request_id}`);
        } catch (loanError) {
          console.error('Auto loan creation failed:', loanError);
        }
      }
    }

    // Query the appropriate table based on item type
    let title = 'Unknown Item';
    if (itemType === 'book') {
      const [result] = await db.query('SELECT title FROM books WHERE book_id = ?', [actualItemId]);
      if (result.length > 0) title = result[0].title;
    } else if (itemType === 'movie') {
      const [result] = await db.query('SELECT title FROM movies WHERE movie_id = ?', [actualItemId]);
      if (result.length > 0) title = result[0].title;
    } else if (itemType === 'article') {
      const [result] = await db.query('SELECT title FROM articles WHERE artic_id = ?', [actualItemId]);
      if (result.length > 0) title = result[0].title;
    } else if (itemType === 'electronic') {
      const [result] = await db.query('SELECT device_name FROM electronics WHERE libra_id = ?', [actualItemId]);
      if (result.length > 0) title = result[0].device_name;
    }

    request.item_title = title;
    request.item_type = itemType === 'electronic' ? 'electronic_rental' : itemType;
  }

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
}));

// POST /api/hold-requests - Create new hold request
router.post('/', asyncHandler(async (req, res) => {
  const { member_id, item_id } = req.body;

  if (!member_id || !item_id) {
    return res.status(400).json({
      success: false,
      message: 'member_id and item_id are required'
    });
  }

  // Parse prefixed item_id and create unique composite ID
  // book-1 → 1000001, movie-1 → 2000001, article-1 → 3000001, electronic-1 → 4000001
  let actualItemId, itemType, compositeId;
  const itemIdStr = String(item_id); // Ensure it's a string
  if (itemIdStr.includes('-')) {
    const parts = itemIdStr.split('-');
    itemType = parts[0];
    const baseId = parseInt(parts[1]);

    // Create composite ID to differentiate item types
    const typeOffsets = {
      'book': 1000000,
      'movie': 2000000,
      'article': 3000000,
      'electronic': 4000000
    };

    compositeId = typeOffsets[itemType] + baseId;
    actualItemId = baseId;
  } else {
    // Fallback for non-prefixed IDs
    actualItemId = parseInt(itemIdStr);
    compositeId = 1000000 + actualItemId; // Default to book
    itemType = 'book';
  }

  // Check if member exists
  const [members] = await db.query('SELECT member_id FROM member WHERE member_id = ?', [member_id]);
  if (members.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Member not found'
    });
  }

  // Check if item exists and has inventory based on item type
  let itemExists = false;
  let hasInventory = false;

  // Map item type to table info
  const tableMap = {
    'book': { table: 'books', idField: 'book_id', copyField: 'copies' },
    'movie': { table: 'movies', idField: 'movie_id', copyField: 'copy_amount' },
    'article': { table: 'articles', idField: 'artic_id', copyField: 'copies' },
    'electronic': { table: 'electronics', idField: 'libra_id', copyField: 'copy_amount' }
  };

  const tableInfo = tableMap[itemType];
  if (tableInfo) {
    const [result] = await db.query(
      `SELECT ${tableInfo.copyField} FROM ${tableInfo.table} WHERE ${tableInfo.idField} = ?`,
      [actualItemId]
    );
    if (result.length > 0) {
      itemExists = true;
      const totalCopies = result[0][tableInfo.copyField];
      if (totalCopies > 0) {
        hasInventory = true;
      }
    }
  }

  if (!itemExists) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }

  if (!hasInventory) {
    return res.status(400).json({
      success: false,
      message: 'Cannot place hold: this item has no copies in inventory. Please contact library staff.'
    });
  }

  // Check if member already has this item checked out
  const [existingLoan] = await db.query(
    'SELECT loan_id FROM loan WHERE member_id = ? AND item_id = ? AND item_type = ? AND return_ts IS NULL',
    [member_id, actualItemId, itemType]
  );

  if (existingLoan.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot place a hold request on an item you already have checked out.'
    });
  }

  // Check if member can make hold request (loan limits and fines)
  const canMakeRequest = await priorityQueueService.canMemberMakeHoldRequest(member_id);
  if (!canMakeRequest) {
    return res.status(400).json({
      success: false,
      message: 'Member cannot make hold requests due to loan limits or outstanding fines'
    });
  }

  // Note: Duplicate checking disabled to allow holds for different item types with same ID
  // In a proper implementation with item_type column, this would check both item_id and item_type

  // Get member type for priority calculation
  const [memberInfo] = await db.query('SELECT member_type FROM member WHERE member_id = ?', [member_id]);
  const priorityScore = priorityQueueService.getPriorityScore(memberInfo[0].member_type);

  // Create request (store compositeId to differentiate item types)
  const [result] = await db.query(
    `INSERT INTO hold_requests (member_id, item_id, request_date, status, queue_position, priority_score)
     VALUES (?, ?, CURDATE(), 'pending', 0, ?)`,
    [member_id, compositeId, priorityScore]
  );

  // Update queue for this item (use prefixed ID for uniqueness)
  await priorityQueueService.updateQueueForItem(`${itemType}-${actualItemId}`);

  // Get updated queue position
  const [updatedRequest] = await db.query(
    'SELECT queue_position FROM hold_requests WHERE request_id = ?',
    [result.insertId]
  );

  res.status(201).json({
    success: true,
    message: 'Hold request created successfully',
    data: {
      request_id: result.insertId,
      member_id,
      item_id,
      queue_position: updatedRequest[0].queue_position,
      priority_score: priorityScore
    }
  });
}));

// PUT /api/hold-requests/:id - Update hold request (cancel or fulfill)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['canceled', 'fulfilled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be canceled or fulfilled'
    });
  }

  // Check if request exists
  const [requests] = await db.query(
    'SELECT hr.request_id, hr.status, hr.item_id, hr.queue_position, hr.member_id FROM hold_requests hr WHERE hr.request_id = ?',
    [id]
  );

  if (requests.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Hold request not found'
    });
  }

  const request = requests[0];

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request is not pending'
    });
  }

  // If fulfilling a hold, automatically create a loan for the member
  if (status === 'fulfilled') {
    // Parse composite ID to get actual item details
    const compositeId = request.item_id;
    let actualItemId, itemType, branchId = 1; // Default branch

    if (compositeId >= 4000000) {
      itemType = 'electronic_rental';
      actualItemId = compositeId - 4000000;
      // Get branch_id from electronics table
      const [branchResult] = await db.query('SELECT branch_id FROM electronics WHERE libra_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 3000000) {
      itemType = 'article';
      actualItemId = compositeId - 3000000;
      // Get branch_id from articles table
      const [branchResult] = await db.query('SELECT branch_id FROM articles WHERE artic_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 2000000) {
      itemType = 'movie';
      actualItemId = compositeId - 2000000;
      // Get branch_id from movies table
      const [branchResult] = await db.query('SELECT branch_id FROM movies WHERE movie_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else if (compositeId >= 1000000) {
      itemType = 'book';
      actualItemId = compositeId - 1000000;
      // Get branch_id from books table
      const [branchResult] = await db.query('SELECT branch_id FROM books WHERE book_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    } else {
      itemType = 'book';
      actualItemId = compositeId;
      // Get branch_id from books table
      const [branchResult] = await db.query('SELECT branch_id FROM books WHERE book_id = ?', [actualItemId]);
      if (branchResult.length > 0) branchId = branchResult[0].branch_id;
    }

    // Create the loan automatically
    try {
      const [loanResult] = await db.query(
        `INSERT INTO loan (item_id, item_type, member_id, loan_date, due_date, branch_id)
         VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), ?)`,
        [actualItemId, itemType, request.member_id, branchId]
      );

      console.log('Loan created successfully:', {
        loan_id: loanResult.insertId,
        item_id: actualItemId,
        item_type: itemType,
        member_id: request.member_id,
        branch_id: branchId
      });

    } catch (loanError) {
      console.error('Loan creation failed:', loanError);
      return res.status(400).json({
        success: false,
        message: 'Cannot fulfill hold: member may already have this item or loan limits exceeded.',
        error: loanError.message
      });
    }
  }

  // Update status
  await db.query(
    'UPDATE hold_requests SET status = ? WHERE request_id = ?',
    [status, id]
  );

  // If fulfilled, send notification and update queue
  if (status === 'fulfilled') {
    // Get item details for notification
    const compositeId = request.item_id;
    let itemTitle, branchName, actualItemId, itemType;

    if (compositeId >= 4000000) {
      actualItemId = compositeId - 4000000;
      itemType = 'electronic';
      const [itemResult] = await db.query(
        `SELECT e.device_name as title, b.name as branch_name
         FROM electronics e
         JOIN branches b ON e.branch_id = b.branch_id
         WHERE e.libra_id = ?`,
        [actualItemId]
      );
      if (itemResult.length > 0) {
        itemTitle = itemResult[0].title;
        branchName = itemResult[0].branch_name;
      }
    } else if (compositeId >= 3000000) {
      actualItemId = compositeId - 3000000;
      itemType = 'article';
      const [itemResult] = await db.query(
        `SELECT a.title, b.name as branch_name
         FROM articles a
         JOIN branches b ON a.branch_id = b.branch_id
         WHERE a.artic_id = ?`,
        [actualItemId]
      );
      if (itemResult.length > 0) {
        itemTitle = itemResult[0].title;
        branchName = itemResult[0].branch_name;
      }
    } else if (compositeId >= 2000000) {
      actualItemId = compositeId - 2000000;
      itemType = 'movie';
      const [itemResult] = await db.query(
        `SELECT m.title, b.name as branch_name
         FROM movies m
         JOIN branches b ON m.branch_id = b.branch_id
         WHERE m.movie_id = ?`,
        [actualItemId]
      );
      if (itemResult.length > 0) {
        itemTitle = itemResult[0].title;
        branchName = itemResult[0].branch_name;
      }
    } else if (compositeId >= 1000000) {
      actualItemId = compositeId - 1000000;
      itemType = 'book';
      const [itemResult] = await db.query(
        `SELECT bk.title, b.name as branch_name
         FROM books bk
         JOIN branches b ON bk.branch_id = b.branch_id
         WHERE bk.book_id = ?`,
        [actualItemId]
      );
      if (itemResult.length > 0) {
        itemTitle = itemResult[0].title;
        branchName = itemResult[0].branch_name;
      }
    } else {
      actualItemId = compositeId;
      itemType = 'book';
      const [itemResult] = await db.query(
        `SELECT bk.title, b.name as branch_name
         FROM books bk
         JOIN branches b ON bk.branch_id = b.branch_id
         WHERE bk.book_id = ?`,
        [actualItemId]
      );
      if (itemResult.length > 0) {
        itemTitle = itemResult[0].title;
        branchName = itemResult[0].branch_name;
      }
    }

    // Send notification to member
    try {
      await notificationService.createHoldAvailableNotification(
        request.member_id,
        id,
        {
          itemTitle: itemTitle || `Item #${compositeId}`,
          branchName: branchName || 'your library branch'
        }
      );
      console.log(`Hold available notification sent for request ${id}`);
    } catch (notifError) {
      console.error('Failed to send hold notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Parse composite ID to get the prefixed ID for queue management
    let prefixedId;
    if (compositeId >= 4000000) {
      prefixedId = `electronic-${compositeId - 4000000}`;
    } else if (compositeId >= 3000000) {
      prefixedId = `article-${compositeId - 3000000}`;
    } else if (compositeId >= 2000000) {
      prefixedId = `movie-${compositeId - 2000000}`;
    } else if (compositeId >= 1000000) {
      prefixedId = `book-${compositeId - 1000000}`;
    } else {
      prefixedId = `book-${compositeId}`; // Fallback
    }
    await priorityQueueService.fulfillNextRequest(prefixedId);
  }

  res.json({
    success: true,
    message: `Hold request ${status} successfully`
  });
}));

// DELETE /api/hold-requests/:id - Delete hold request
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await db.query(
    'DELETE FROM hold_requests WHERE request_id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({
      success: false,
      message: 'Hold request not found'
    });
  }

  res.json({
    success: true,
    message: 'Hold request deleted successfully'
  });
}));

module.exports = router;
