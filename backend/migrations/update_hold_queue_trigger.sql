-- Update hold_queue_reorder trigger to send proper notifications
USE library_db;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS hold_queue_reorder;

DELIMITER $$

-- Recreate with updated notification logic
CREATE DEFINER=`appuser`@`%` TRIGGER hold_queue_reorder AFTER UPDATE ON hold_requests
FOR EACH ROW
BEGIN
  -- Existing queue reorder behavior
  IF NEW.status IN ('canceled','fulfilled') AND OLD.queue_position IS NOT NULL THEN
    UPDATE hold_requests
      SET queue_position = queue_position - 1
    WHERE item_id = NEW.item_id AND queue_position > OLD.queue_position;
  END IF;

  -- Send in-app notification when a hold becomes fulfilled
  IF NEW.status = 'fulfilled' AND OLD.status <> 'fulfilled' THEN
    INSERT INTO notifications (
      member_id,
      notification_type,
      message,
      related_hold_request_id,
      created_at,
      is_read,
      sent_via_email
    )
    VALUES (
      NEW.member_id,
      'hold_available',
      CONCAT(
        'Your requested item #',
        NEW.item_id,
        ' is now available for pickup. Please collect it within 7 days.'
      ),
      NEW.request_id,
      CURRENT_TIMESTAMP,
      FALSE,
      FALSE
    );
  END IF;
END$$

DELIMITER ;

SELECT 'Trigger updated successfully' AS status;
