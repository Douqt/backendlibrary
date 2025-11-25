-- Migration: Add hold_available notification type and related_hold_request_id column
-- This enables notifications when held items become available for pickup

USE library_db;

-- Step 1: Add related_hold_request_id column
ALTER TABLE notifications
ADD COLUMN related_hold_request_id INT NULL AFTER related_fine_id,
ADD FOREIGN KEY fk_notifications_hold_request (related_hold_request_id)
  REFERENCES hold_requests(request_id) ON DELETE SET NULL;

-- Step 2: Modify notification_type ENUM to include hold_available and other missing types
ALTER TABLE notifications
MODIFY COLUMN notification_type ENUM(
  'loan_confirmation',
  'loan_almost_due',
  'loan_due',
  'loan_overdue',
  'fine_paid',
  'hold_available',
  'account_approved',
  'member_type_change_requested',
  'member_type_change_under_review',
  'member_type_change_conditions_set',
  'member_type_change_approved',
  'member_type_change_rejected'
) NOT NULL;

-- Step 3: Add index for hold-related queries
CREATE INDEX idx_hold_notifications ON notifications(related_hold_request_id);

-- Verify the changes
SELECT
  'Migration completed successfully' AS status,
  COUNT(*) AS total_notifications
FROM notifications;
