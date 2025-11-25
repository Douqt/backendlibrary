const db = require('../config/db');
const fineService = require('./fineService');
const notificationService = require('./notificationService');

// Priority mapping: faculty > student > local
const PRIORITY_MAP = {
  faculty: 3,
  student: 2,
  local: 1
};

// In-memory queue for hold requests (since no DB changes allowed)
let holdQueues = {}; // item_id -> array of request_ids sorted by priority

class PriorityQueueService {
  // Initialize or update queue for an item
  async updateQueueForItem(itemId) {
    // Parse prefixed item_id (e.g., "book-1" → composite ID: 1000001)
    let compositeItemId;
    const itemIdStr = String(itemId); // Ensure it's a string

    if (itemIdStr.includes('-')) {
      const [itemType, rawId] = itemIdStr.split('-');
      const rawIdInt = parseInt(rawId);

      // Convert to composite ID based on item type
      if (itemType === 'book') {
        compositeItemId = 1000000 + rawIdInt;
      } else if (itemType === 'movie') {
        compositeItemId = 2000000 + rawIdInt;
      } else if (itemType === 'article') {
        compositeItemId = 3000000 + rawIdInt;
      } else if (itemType === 'electronic') {
        compositeItemId = 4000000 + rawIdInt;
      } else {
        compositeItemId = rawIdInt; // Fallback
      }
    } else {
      compositeItemId = parseInt(itemIdStr);
    }

    const [requests] = await db.query(
      `SELECT hr.request_id, hr.member_id, m.member_type, hr.priority_score
       FROM hold_requests hr
       JOIN member m ON hr.member_id = m.member_id
       WHERE hr.item_id = ? AND hr.status = 'pending'
       ORDER BY hr.priority_score DESC, hr.request_date ASC`,
      [compositeItemId]
    );

    // Update queue positions in DB
    for (let i = 0; i < requests.length; i++) {
      await db.query(
        'UPDATE hold_requests SET queue_position = ? WHERE request_id = ?',
        [i + 1, requests[i].request_id]
      );
    }

    holdQueues[itemId] = requests.map(r => r.request_id);
  }

  // Get next eligible request for an item
  async getNextEligibleRequest(itemId) {
    if (!holdQueues[itemId] || holdQueues[itemId].length === 0) {
      await this.updateQueueForItem(itemId);
    }

    if (holdQueues[itemId] && holdQueues[itemId].length > 0) {
      return holdQueues[itemId][0];
    }

    return null;
  }

  // Fulfill next request for an item
  async fulfillNextRequest(itemId) {
    const nextRequestId = await this.getNextEligibleRequest(itemId);
    if (nextRequestId) {
      // Get hold request details for notification
      const [holdRequest] = await db.query(
        'SELECT member_id, item_id FROM hold_requests WHERE request_id = ?',
        [nextRequestId]
      );

      await db.query(
        'UPDATE hold_requests SET status = "fulfilled" WHERE request_id = ?',
        [nextRequestId]
      );

      // Send notification to member
      if (holdRequest.length > 0) {
        const compositeId = holdRequest[0].item_id;
        const memberId = holdRequest[0].member_id;
        let itemTitle, branchName, actualItemId;

        // Parse composite ID and get item details
        if (compositeId >= 4000000) {
          actualItemId = compositeId - 4000000;
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

        // Send notification
        try {
          await notificationService.createHoldAvailableNotification(
            memberId,
            nextRequestId,
            {
              itemTitle: itemTitle || `Item #${compositeId}`,
              branchName: branchName || 'your library branch'
            }
          );
          console.log(`Hold available notification sent for request ${nextRequestId}`);
        } catch (notifError) {
          console.error('Failed to send hold notification:', notifError);
          // Don't fail the fulfillment if notification fails
        }
      }

      // Remove from queue and update positions
      holdQueues[itemId].shift();
      await this.updateQueueForItem(itemId);

      return nextRequestId;
    }
    return null;
  }

  // Calculate correct priority score for member type
  getPriorityScore(memberType) {
    return PRIORITY_MAP[memberType] || 1;
  }

  // Check if member can make hold request (loan limits and fines)
  async canMemberMakeHoldRequest(memberId) {
    const [member] = await db.query(
      'SELECT member_type, close_date FROM member WHERE member_id = ?',
      [memberId]
    );

    if (member.length === 0) return false;

    const memberType = member[0].member_type;
    const closeDate = member[0].close_date;

    // Check if account is closed (handle both Date objects and strings)
    const isAccountClosed = closeDate && (
      (closeDate instanceof Date && closeDate.getFullYear() !== 9999) ||
      (typeof closeDate === 'string' && closeDate !== '9999-01-01')
    );

    if (isAccountClosed) {
      return false;
    }

    // Check for unpaid fines (prevents hold requests for ALL member types)
    const hasUnpaidFines = await fineService.hasUnpaidFines(memberId);
    if (hasUnpaidFines) {
      return false;
    }

    // Check active loans
    const [loans] = await db.query(
      'SELECT COUNT(*) as count FROM loan WHERE member_id = ? AND return_ts IS NULL',
      [memberId]
    );

    const activeLoans = loans[0].count;
    const maxLoans = memberType === 'faculty' ? 10 : memberType === 'student' ? 5 : 3;

    // Students and locals cannot have holds if at loan limit
    if ((memberType === 'student' || memberType === 'local') && activeLoans >= maxLoans) {
      return false;
    }

    return true;
  }
}

module.exports = new PriorityQueueService();
