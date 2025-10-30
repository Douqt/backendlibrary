-- Add soft delete support to loan table
-- Run this migration to add the deleted_at column for soft deletion

USE library_db;

ALTER TABLE loan
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_loan_deleted_at (deleted_at);

-- Optional: Add column to track who deleted the loan
-- ALTER TABLE loan
-- ADD COLUMN deleted_by INT NULL,
-- ADD CONSTRAINT fk_loan_deleted_by FOREIGN KEY (deleted_by)
--     REFERENCES staff(staff_id) ON DELETE SET NULL;
