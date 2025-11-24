-- Migration: Create stored procedure for approving member type changes
-- Purpose: Handle the approval logic with validation and updates

DELIMITER //

DROP PROCEDURE IF EXISTS approve_member_type_change//

CREATE PROCEDURE approve_member_type_change(
  IN p_request_id INT,
  IN p_staff_id INT
)
BEGIN
  DECLARE v_member_id INT;
  DECLARE v_requested_type VARCHAR(20);
  DECLARE v_current_type VARCHAR(20);
  DECLARE v_status VARCHAR(20);
  DECLARE v_conditions_met BOOLEAN;
  DECLARE v_active_loan_count INT;
  DECLARE v_new_type_limit INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  -- Get request details
  SELECT
    member_id,
    requested_type,
    current_type,
    status,
    conditions_met
  INTO
    v_member_id,
    v_requested_type,
    v_current_type,
    v_status,
    v_conditions_met
  FROM member_type_change_requests
  WHERE request_id = p_request_id
  FOR UPDATE;

  -- Validate request exists
  IF v_member_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Type change request not found';
  END IF;

  -- Validate request is in correct status
  IF v_status NOT IN ('pending', 'under_review') THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Request must be in pending or under_review status';
  END IF;

  -- Validate all conditions are met if any were set
  IF NOT v_conditions_met THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'All conditions must be verified before approval';
  END IF;

  -- Check active loan count
  SELECT COUNT(*)
  INTO v_active_loan_count
  FROM loan
  WHERE member_id = v_member_id
    AND return_ts IS NULL;

  -- Determine loan limit for requested type
  SET v_new_type_limit = CASE v_requested_type
    WHEN 'local' THEN 3
    WHEN 'student' THEN 5
    WHEN 'faculty' THEN 10
    ELSE 0
  END;

  -- Block if downgrade would exceed new loan limit
  IF v_active_loan_count > v_new_type_limit THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Member has too many active loans for requested type. Must return items first.';
  END IF;

  -- Update member type
  UPDATE member
  SET member_type = v_requested_type
  WHERE member_id = v_member_id;

  -- Update request status
  UPDATE member_type_change_requests
  SET
    status = 'approved',
    approved_date = CURRENT_TIMESTAMP,
    reviewed_by_staff_id = p_staff_id,
    review_date = CURRENT_TIMESTAMP
  WHERE request_id = p_request_id;

  COMMIT;
END//

DELIMITER ;
