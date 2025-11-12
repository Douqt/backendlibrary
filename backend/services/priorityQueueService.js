const db = require('../config/db');
const fineService = require('./fineService');

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
    // Parse prefixed item_id (e.g., "book-1" → id: 1)
    let actualItemId;
    const itemIdStr = String(itemId); // Ensure it's a string
    if (itemIdStr.includes('-')) {
      actualItemId = parseInt(itemIdStr.split('-')[1]);
    } else {
      actualItemId = parseInt(itemIdStr);
    }

    const [requests] = await db.query(
      `SELECT hr.request_id, hr.member_id, m.member_type, hr.priority_score
       FROM hold_requests hr
       JOIN member m ON hr.member_id = m.member_id
       WHERE hr.item_id = ? AND hr.status = 'pending'
       ORDER BY hr.priority_score DESC, hr.request_date ASC`,
      [actualItemId]
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
      await db.query(
        'UPDATE hold_requests SET status = "fulfilled" WHERE request_id = ?',
        [nextRequestId]
      );

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
