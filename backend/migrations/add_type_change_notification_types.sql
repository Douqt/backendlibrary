-- Migration: Add notification types for member type change workflow
-- Purpose: Extend notification_type ENUM to support type change request notifications

ALTER TABLE notifications
MODIFY COLUMN notification_type ENUM(
  'loan_confirmation',
  'loan_almost_due',
  'loan_due',
  'loan_overdue',
  'fine_paid',
  'account_approved',
  'member_type_change_requested',
  'member_type_change_under_review',
  'member_type_change_conditions_set',
  'member_type_change_approved',
  'member_type_change_rejected'
) NOT NULL;

-- Add related_type_change_request_id field to link notifications to type change requests
ALTER TABLE notifications
ADD COLUMN related_type_change_request_id INT NULL AFTER related_fine_id,
ADD CONSTRAINT fk_notification_type_change_request
  FOREIGN KEY (related_type_change_request_id)
  REFERENCES member_type_change_requests(request_id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for type change request notifications
CREATE INDEX idx_type_change_notifications
ON notifications(related_type_change_request_id);
