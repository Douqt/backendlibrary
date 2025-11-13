ALTER TABLE member
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL,
ADD INDEX idx_member_deleted_at (deleted_at);
