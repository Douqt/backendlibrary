-- ======================================
-- Update Availability Triggers for Existing Database
-- Run this against your current library_db to fix availability issues
-- ======================================

USE library_db;

-- Drop existing availability triggers if they exist
DROP TRIGGER IF EXISTS books_availability_update;
DROP TRIGGER IF EXISTS books_availability_insert;
DROP TRIGGER IF EXISTS movies_availability_update;
DROP TRIGGER IF EXISTS movies_availability_insert;
DROP TRIGGER IF EXISTS articles_availability_update;
DROP TRIGGER IF EXISTS articles_availability_insert;
DROP TRIGGER IF EXISTS electronics_availability_update;
DROP TRIGGER IF EXISTS electronics_availability_insert;

-- Drop the overly restrictive hold block trigger that's preventing availability updates
DROP TRIGGER IF EXISTS item_hold_block;

-- Drop the old loan triggers that only handle books
DROP TRIGGER IF EXISTS loan_on_create;
DROP TRIGGER IF EXISTS loan_on_return;

DELIMITER $$

-- Create improved availability triggers for INSERT operations
CREATE TRIGGER books_availability_insert BEFORE INSERT ON books
FOR EACH ROW
BEGIN
  SET NEW.available = (NEW.copies > 0);
END$$

CREATE TRIGGER movies_availability_insert BEFORE INSERT ON movies
FOR EACH ROW
BEGIN
  SET NEW.available = (NEW.copy_amount > 0);
END$$

CREATE TRIGGER articles_availability_insert BEFORE INSERT ON articles
FOR EACH ROW
BEGIN
  SET NEW.available = (NEW.copies > 0);
END$$

CREATE TRIGGER electronics_availability_insert BEFORE INSERT ON electronics
FOR EACH ROW
BEGIN
  SET NEW.available = (NEW.copy_amount > 0);
END$$

-- Create conservative availability triggers - only set unavailable when copies = 0
CREATE TRIGGER books_availability_update BEFORE UPDATE ON books
FOR EACH ROW
BEGIN
  -- Only automatically set to unavailable when copies reach 0
  IF NEW.copies = 0 AND OLD.copies > 0 THEN
    SET NEW.available = FALSE;
  END IF;
END$$

CREATE TRIGGER movies_availability_update BEFORE UPDATE ON movies
FOR EACH ROW
BEGIN
  -- Only automatically set to unavailable when copy_amount reaches 0
  IF NEW.copy_amount = 0 AND OLD.copy_amount > 0 THEN
    SET NEW.available = FALSE;
  END IF;
END$$

CREATE TRIGGER articles_availability_update BEFORE UPDATE ON articles
FOR EACH ROW
BEGIN
  -- Only automatically set to unavailable when copies reach 0
  IF NEW.copies = 0 AND OLD.copies > 0 THEN
    SET NEW.available = FALSE;
  END IF;
END$$

CREATE TRIGGER electronics_availability_update BEFORE UPDATE ON electronics
FOR EACH ROW
BEGIN
  -- Only automatically set to unavailable when copy_amount reaches 0
  IF NEW.copy_amount = 0 AND OLD.copy_amount > 0 THEN
    SET NEW.available = FALSE;
  END IF;
END$$

-- Create comprehensive loan creation trigger for all item types
CREATE TRIGGER loan_on_create AFTER INSERT ON loan
FOR EACH ROW
BEGIN
  IF NEW.item_type = 'book' THEN
    UPDATE books SET copies = copies - 1 WHERE book_id = NEW.item_id;
  ELSEIF NEW.item_type = 'movie' THEN
    UPDATE movies SET copy_amount = copy_amount - 1 WHERE movie_id = NEW.item_id;
  ELSEIF NEW.item_type = 'article' THEN
    UPDATE articles SET copies = copies - 1 WHERE artic_id = NEW.item_id;
  ELSEIF NEW.item_type = 'electronic_rental' THEN
    UPDATE electronics SET copy_amount = copy_amount - 1 WHERE libra_id = NEW.item_id;
  END IF;
END$$

-- Create comprehensive loan return trigger for all item types
CREATE TRIGGER loan_on_return AFTER UPDATE ON loan
FOR EACH ROW
BEGIN
  IF NEW.return_ts IS NOT NULL AND (OLD.return_ts IS NULL OR OLD.return_ts <> NEW.return_ts) THEN
    IF NEW.item_type = 'book' THEN
      -- Check if there are pending holds for this item
      IF EXISTS (SELECT 1 FROM hold_requests WHERE item_id = NEW.item_id AND status = 'pending') THEN
        -- Item has pending holds, increment copies but keep available = FALSE
        UPDATE books SET copies = copies + 1 WHERE book_id = NEW.item_id;
      ELSE
        -- No pending holds, mark as available
        UPDATE books SET copies = copies + 1, available = TRUE WHERE book_id = NEW.item_id;
      END IF;
    ELSEIF NEW.item_type = 'movie' THEN
      IF EXISTS (SELECT 1 FROM hold_requests WHERE item_id = NEW.item_id AND status = 'pending') THEN
        UPDATE movies SET copy_amount = copy_amount + 1 WHERE movie_id = NEW.item_id;
      ELSE
        UPDATE movies SET copy_amount = copy_amount + 1, available = TRUE WHERE movie_id = NEW.item_id;
      END IF;
    ELSEIF NEW.item_type = 'article' THEN
      IF EXISTS (SELECT 1 FROM hold_requests WHERE item_id = NEW.item_id AND status = 'pending') THEN
        UPDATE articles SET copies = copies + 1 WHERE artic_id = NEW.item_id;
      ELSE
        UPDATE articles SET copies = copies + 1, available = TRUE WHERE artic_id = NEW.item_id;
      END IF;
    ELSEIF NEW.item_type = 'electronic_rental' THEN
      IF EXISTS (SELECT 1 FROM hold_requests WHERE item_id = NEW.item_id AND status = 'pending') THEN
        UPDATE electronics SET copy_amount = copy_amount + 1 WHERE libra_id = NEW.item_id;
      ELSE
        UPDATE electronics SET copy_amount = copy_amount + 1, available = TRUE WHERE libra_id = NEW.item_id;
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Fix existing data to match copy counts
UPDATE books SET available = (copies > 0);
UPDATE movies SET available = (copy_amount > 0);
UPDATE articles SET available = (copies > 0);
UPDATE electronics SET available = (copy_amount > 0);

-- Verify the fix worked
SELECT 'Books fixed:' as status, COUNT(*) as count FROM books WHERE available = (copies > 0) UNION ALL
SELECT 'Movies fixed:', COUNT(*) FROM movies WHERE available = (copy_amount > 0) UNION ALL
SELECT 'Articles fixed:', COUNT(*) FROM articles WHERE available = (copies > 0) UNION ALL
SELECT 'Electronics fixed:', COUNT(*) FROM electronics WHERE available = (copy_amount > 0);
