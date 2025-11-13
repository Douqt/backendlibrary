-- Migration: Create notifications table for persistent in-app and email notifications
-- This table stores all notifications sent to members

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  notification_type ENUM(
    'loan_confirmation',
    'loan_almost_due',
    'loan_due',
    'loan_overdue',
    'fine_paid'
  ) NOT NULL,
  message TEXT NOT NULL,
  related_loan_id INT NULL,
  related_fine_id INT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP NULL,
  FOREIGN KEY (member_id) REFERENCES member(member_id) ON DELETE CASCADE,
  FOREIGN KEY (related_loan_id) REFERENCES loan(loan_id) ON DELETE SET NULL,
  FOREIGN KEY (related_fine_id) REFERENCES fines(fine_id) ON DELETE SET NULL,
  INDEX idx_member_notifications (member_id, created_at DESC),
  INDEX idx_notification_type (notification_type),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
