-- Migration: Create notification_logs table for email delivery tracking
-- This table tracks email sending status, errors, and delivery confirmation

CREATE TABLE IF NOT EXISTS notification_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  email_to VARCHAR(255) NOT NULL,
  email_subject VARCHAR(500) NOT NULL,
  email_body TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  error_message TEXT NULL,
  attempt_count INT DEFAULT 0,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(notification_id) ON DELETE CASCADE,
  INDEX idx_notification_log (notification_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
