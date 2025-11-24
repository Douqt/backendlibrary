-- Migration: Create member_type_change_requests table
-- Purpose: Implement approval-based workflow for member type changes

CREATE TABLE IF NOT EXISTS member_type_change_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,

  -- Request information
  member_id INT NOT NULL,
  current_type ENUM('local','student','faculty') NOT NULL,
  requested_type ENUM('local','student','faculty') NOT NULL,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  request_reason TEXT NOT NULL,

  -- Request status
  status ENUM('pending','under_review','approved','rejected','withdrawn') DEFAULT 'pending',

  -- Staff review information
  reviewed_by_staff_id INT NULL,
  review_date TIMESTAMP NULL,
  review_notes TEXT,

  -- Predefined conditions (checkboxes)
  condition_return_overdue_items BOOLEAN DEFAULT FALSE,
  condition_pay_outstanding_fines BOOLEAN DEFAULT FALSE,
  condition_verification_documents BOOLEAN DEFAULT FALSE,

  -- Condition tracking
  conditions_met BOOLEAN DEFAULT FALSE,
  conditions_verified_date TIMESTAMP NULL,

  -- Approval/rejection information
  approved_date TIMESTAMP NULL,
  rejected_date TIMESTAMP NULL,
  rejection_reason TEXT,

  -- Foreign keys
  CONSTRAINT fk_mtcr_member
    FOREIGN KEY (member_id) REFERENCES member(member_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_mtcr_staff
    FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff(staff_id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- Constraints
  CONSTRAINT chk_different_types
    CHECK (current_type != requested_type),

  -- Indexes for performance
  INDEX idx_request_status (status),
  INDEX idx_member_requests (member_id, request_date DESC),
  INDEX idx_staff_reviews (reviewed_by_staff_id, review_date DESC),
  INDEX idx_pending_requests (status, request_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for checking active pending requests per member
CREATE INDEX idx_member_active_requests
ON member_type_change_requests(member_id, status);
