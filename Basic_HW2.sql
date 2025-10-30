-- ======================================
-- Library Database with Transition Constraints
-- MySQL 8.x - Fixed ordering version
-- ======================================

CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- ===============================
-- ENTITIES - Base tables first (no FKs)
-- ===============================

CREATE TABLE IF NOT EXISTS branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(50),
    floor_count INT DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS member (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    member_name VARCHAR(255) NOT NULL,
    member_email VARCHAR(255) UNIQUE,
    member_type ENUM('local','student','faculty') NOT NULL,
    join_date DATE NOT NULL,
    close_date DATE DEFAULT '9999-01-01',
    closure_clause VARCHAR(500),
    date_last_checked_out DATE,
    num_loans INT DEFAULT 0 CHECK (num_loans >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS publishers (
    publisher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    imprint_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    established_year INT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    publisher_type VARCHAR(50) DEFAULT 'Mixed',
    active BOOLEAN DEFAULT TRUE,
    UNIQUE KEY ux_publishers_name_imprint (name, imprint_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS authors (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    birth_year INT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS directors (
    director_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS genres (
    genre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    applies_to VARCHAR(20) DEFAULT 'All'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS item_title (
    title_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS item_copy (
    copy_id INT AUTO_INCREMENT PRIMARY KEY,
    title_id INT,
    status ENUM('Available','OnLoan','OnHold','Lost','Repair','Withdrawn') DEFAULT 'Available',
    CONSTRAINT fk_copy_title FOREIGN KEY (title_id) REFERENCES item_title(title_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- STAFF TABLE (before services/events)
-- ===============================

CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    ssn INT UNIQUE,
    branch_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    hourly DECIMAL(7,2) NOT NULL DEFAULT 15.00,
    num_hours DECIMAL(5,2),
    position ENUM('associate','admin') NOT NULL DEFAULT 'associate',
    hire_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
    join_date DATE DEFAULT '9999-01-01',
    close_date DATE,
    termination_cause VARCHAR(255),
    employment_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    terminated_at TIMESTAMP NULL,
    retired_at TIMESTAMP NULL,
    UNIQUE KEY uni_staff_brnch (staff_id, branch_id),
    CONSTRAINT fk_staff_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- ITEM TABLES (books, articles, movies, electronics)
-- ===============================

CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    publication_year INT,
    publisher_id INT,
    version_type ENUM('digital','physical') DEFAULT 'physical',
    copies INT NOT NULL CHECK (copies >= 0),
    available BOOLEAN DEFAULT TRUE,
    section_descriptor VARCHAR(100) NOT NULL,
    section_floor INT NOT NULL,
    CONSTRAINT fk_books_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_books_publisher FOREIGN KEY (publisher_id)
        REFERENCES publishers(publisher_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
    artic_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    issn VARCHAR(20),
    publisher_id INT,
    version_type ENUM('digital','physical') DEFAULT 'digital',
    copies INT NOT NULL CHECK (copies >= 0),
    available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_articles_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_articles_publisher FOREIGN KEY (publisher_id)
        REFERENCES publishers(publisher_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movies (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    isan VARCHAR(30),
    release_date DATE,
    publisher_id INT,
    director_id INT,
    media_type ENUM('CD','VHS','BluRay','Other') NOT NULL,
    location_section VARCHAR(100),
    available BOOLEAN DEFAULT TRUE,
    copy_amount SMALLINT DEFAULT 1,
    CONSTRAINT fk_movies_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_movies_publisher FOREIGN KEY (publisher_id)
        REFERENCES publishers(publisher_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_movies_director FOREIGN KEY (director_id)
        REFERENCES directors(director_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS electronics (
    libra_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    serial_num VARCHAR(255) NOT NULL,
    manufact_date DATE,
    maker VARCHAR(255) DEFAULT 'Walmart',
    available BOOLEAN DEFAULT TRUE,
    copy_amount SMALLINT DEFAULT 1,
    CONSTRAINT fk_elec_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- LOAN TABLE (must come before fines and hold_requests)
-- ===============================

CREATE TABLE IF NOT EXISTS loan (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT,
    item_type ENUM('book','movie','article','electronic_rental') NOT NULL,
    member_id INT,
    loan_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
    due_date DATE,
    return_ts DATE,
    branch_id INT,
    CONSTRAINT loans_member_fk FOREIGN KEY (member_id)
      REFERENCES member(member_id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE,
    CONSTRAINT loans_item_fk FOREIGN KEY (item_id)
      REFERENCES books(book_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
    CONSTRAINT loans_branch_fk FOREIGN KEY (branch_id)
      REFERENCES branches(branch_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- TABLES THAT DEPEND ON LOAN
-- ===============================

CREATE TABLE IF NOT EXISTS fines (
  fine_id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT,
  member_id INT,
  item_id INT,
  amount DECIMAL(10,2) CHECK (amount >= 0),
  reason ENUM('late','lost') DEFAULT 'late',
  payment_status ENUM('unpaid','paid','partially_paid') DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fines_loan_fk FOREIGN KEY (loan_id)
    REFERENCES loan(loan_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fines_member_fk FOREIGN KEY (member_id)
    REFERENCES member(member_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  fine_id INT NOT NULL,
  paid_amount DECIMAL(10,2) CHECK (paid_amount > 0),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50),
  CONSTRAINT fk_pay_fine FOREIGN KEY (fine_id)
    REFERENCES fines(fine_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hold_requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT,
  item_id INT,
  request_date DATE,
  status ENUM('pending','fulfilled','canceled','expired') DEFAULT 'pending',
  queue_position INT,
  priority_score INT CHECK (priority_score >= 0),
  notes TEXT,
  CONSTRAINT hold_requests_member_fk FOREIGN KEY (member_id)
    REFERENCES member(member_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- SERVICES AND EVENTS
-- ===============================

CREATE TABLE IF NOT EXISTS services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_type VARCHAR(100) NOT NULL,
    fee DECIMAL(10,2) CHECK (fee > 0),
    branch_id INT,
    service_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
    service_time TIME,
    service_subject VARCHAR(255),
    service_description TEXT,
    CONSTRAINT fk_services_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_subject VARCHAR(255),
    event_description TEXT,
    CONSTRAINT fk_events_branch FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_events_date (event_date),
    INDEX idx_events_branch (branch_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT,
  branch_id INT,
  room_number VARCHAR(50),
  res_date DATE,
  res_time TIME,
  room_type ENUM('study','meeting','conference'),
  capacity INT CHECK (capacity > 0),
  is_available BOOLEAN,
  CONSTRAINT reservations_member_fk FOREIGN KEY (member_id)
    REFERENCES member(member_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT reservations_branch_fk FOREIGN KEY (branch_id)
    REFERENCES branches(branch_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- JUNCTION/RELATION TABLES
-- ===============================

CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT,
    author_id INT,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_ba_book FOREIGN KEY (book_id)
        REFERENCES books(book_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ba_author FOREIGN KEY (author_id)
        REFERENCES authors(author_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_authors (
    artic_id INT,
    author_id INT,
    PRIMARY KEY (artic_id, author_id),
    CONSTRAINT fk_aa_article FOREIGN KEY (artic_id)
        REFERENCES articles(artic_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_aa_author FOREIGN KEY (author_id)
        REFERENCES authors(author_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS item_genres (
    item_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (item_id, genre_id),
    CONSTRAINT fk_item_genres_genre FOREIGN KEY (genre_id)
        REFERENCES genres(genre_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_staff (
    service_id INT NOT NULL,
    staff_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (service_id, staff_id),
    CONSTRAINT fk_service_staff_service FOREIGN KEY (service_id)
      REFERENCES services(service_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_service_staff_staff FOREIGN KEY (staff_id)
      REFERENCES staff(staff_id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS works_at (
    works_at_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    branch_id INT NOT NULL,
    num_hours FLOAT,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY unique_staff_branch (staff_id, branch_id),
    CHECK (num_hours >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_staff (
    event_id INT NOT NULL,
    staff_id INT NOT NULL,
    PRIMARY KEY (event_id, staff_id),
    CONSTRAINT fk_event_staff_event FOREIGN KEY (event_id)
      REFERENCES events(event_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_event_staff_staff FOREIGN KEY (staff_id)
      REFERENCES staff(staff_id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS event_attendees (
    attendee_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    member_id INT NOT NULL,
    CONSTRAINT fk_ea_event FOREIGN KEY (event_id)
      REFERENCES events(event_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ea_member FOREIGN KEY (member_id)
      REFERENCES member(member_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===============================
-- AUTHENTICATION TABLES
-- ===============================

CREATE TABLE IF NOT EXISTS member_auth (
    auth_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_member_auth_member FOREIGN KEY (member_id)
        REFERENCES member(member_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff_auth (
    auth_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_auth_staff FOREIGN KEY (staff_id)
        REFERENCES staff(staff_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_member_auth_username ON member_auth(username);
CREATE INDEX idx_staff_auth_username ON staff_auth(username);

-- ===============================
-- TRIGGERS
-- ===============================
DELIMITER $$

CREATE TRIGGER member_close_check BEFORE UPDATE ON member
FOR EACH ROW
BEGIN
  DECLARE active_loans INT DEFAULT 0;
  DECLARE unpaid_fines INT DEFAULT 0;

  IF NEW.close_date <> OLD.close_date THEN
    SELECT COUNT(*) INTO active_loans FROM loan WHERE member_id = NEW.member_id AND return_ts IS NULL;
    SELECT COUNT(*) INTO unpaid_fines FROM fines WHERE member_id = NEW.member_id AND payment_status <> 'paid';

    IF active_loans > 0 OR unpaid_fines > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot close account: outstanding loans or unpaid fines exist.';
    END IF;
  END IF;
END$$

CREATE TRIGGER prevent_new_loans BEFORE INSERT ON loan
FOR EACH ROW
BEGIN
  DECLARE fine_count INT DEFAULT 0;
  DECLARE curr_loans INT DEFAULT 0;
  DECLARE max_loans INT DEFAULT 0;
  DECLARE mtype VARCHAR(16);

  IF NEW.member_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Loan must have a member.';
  END IF;

  SELECT COUNT(*) INTO fine_count FROM fines WHERE member_id = NEW.member_id AND payment_status <> 'paid';
  SELECT COUNT(*) INTO curr_loans FROM loan WHERE member_id = NEW.member_id AND return_ts IS NULL;
  SELECT member_type INTO mtype FROM member WHERE member_id = NEW.member_id;

  IF mtype = 'student' THEN
    SET max_loans = 5;
  ELSEIF mtype = 'faculty' THEN
    SET max_loans = 10;
  ELSE
    SET max_loans = 3;
  END IF;

  IF fine_count > 0 OR curr_loans >= max_loans THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot create new loan: fines unpaid or limit reached.';
  END IF;
END$$

CREATE TRIGGER staff_end_cleanup AFTER UPDATE ON staff
FOR EACH ROW
BEGIN
  IF NEW.close_date IS NOT NULL AND NEW.close_date <> OLD.close_date THEN
    DELETE FROM service_staff WHERE staff_id = NEW.staff_id;
    DELETE FROM event_staff WHERE staff_id = NEW.staff_id AND event_id IN (
      SELECT event_id FROM events WHERE event_date > CURRENT_DATE()
    );
  END IF;
END$$

CREATE TRIGGER prevent_future_staff_assign BEFORE INSERT ON service_staff
FOR EACH ROW
BEGIN
  DECLARE s_close DATE;
  SELECT close_date INTO s_close FROM staff WHERE staff_id = NEW.staff_id LIMIT 1;
  IF s_close IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot assign terminated staff to future work.';
  END IF;
END$$

CREATE TRIGGER fine_paid_timestamp AFTER UPDATE ON fines
FOR EACH ROW
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
    UPDATE payments SET paid_at = CURRENT_TIMESTAMP WHERE fine_id = NEW.fine_id;
  END IF;
END$$

CREATE TRIGGER loan_overdue_fine AFTER INSERT ON loan
FOR EACH ROW
BEGIN
  IF NEW.due_date IS NOT NULL AND NEW.return_ts IS NULL AND NEW.due_date < CURRENT_DATE() THEN
    INSERT INTO fines (loan_id, member_id, item_id, amount, reason, payment_status)
      VALUES (NEW.loan_id, NEW.member_id, NEW.item_id, 5.00, 'late', 'unpaid');
    UPDATE hold_requests SET status = 'canceled' WHERE member_id = NEW.member_id AND status = 'pending';
  END IF;
END$$

CREATE TRIGGER loan_overdue_fine_update AFTER UPDATE ON loan
FOR EACH ROW
BEGIN
  IF NEW.return_ts IS NULL AND NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE() THEN
    IF NOT EXISTS (SELECT 1 FROM fines WHERE loan_id = NEW.loan_id) THEN
      INSERT INTO fines (loan_id, member_id, item_id, amount, reason, payment_status)
        VALUES (NEW.loan_id, NEW.member_id, NEW.item_id, 5.00, 'late', 'unpaid');
      UPDATE hold_requests SET status = 'canceled' WHERE member_id = NEW.member_id AND status = 'pending';
    END IF;
  END IF;
END$$

CREATE TRIGGER hold_auto_expire BEFORE UPDATE ON hold_requests
FOR EACH ROW
BEGIN
  IF NEW.status = 'pending' AND NEW.request_date < DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) THEN
    SET NEW.status = 'expired';
  END IF;
END$$

CREATE TRIGGER hold_fulfill_on_book_available AFTER UPDATE ON books
FOR EACH ROW
BEGIN
  DECLARE oldest_request INT;
  IF NEW.available = TRUE AND OLD.available <> NEW.available THEN
    SELECT request_id INTO oldest_request
    FROM hold_requests
    WHERE item_id = NEW.book_id AND status = 'pending'
    ORDER BY request_date ASC
    LIMIT 1;
    IF oldest_request IS NOT NULL THEN
      UPDATE hold_requests SET status = 'fulfilled' WHERE request_id = oldest_request;
    END IF;
  END IF;
END$$

CREATE TRIGGER hold_queue_reorder AFTER UPDATE ON hold_requests
FOR EACH ROW
BEGIN
  IF NEW.status IN ('canceled','fulfilled') AND OLD.queue_position IS NOT NULL THEN
    UPDATE hold_requests
      SET queue_position = queue_position - 1
    WHERE item_id = NEW.item_id AND queue_position > OLD.queue_position;
  END IF;
END$$

CREATE TRIGGER reservation_time_status BEFORE UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.res_date < CURRENT_DATE() OR (NEW.res_date = CURRENT_DATE() AND NEW.res_time < CURRENT_TIME()) THEN
    SET NEW.is_available = FALSE;
  END IF;
END$$

CREATE TRIGGER reservation_overlap BEFORE INSERT ON reservations
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.branch_id = NEW.branch_id
      AND r.room_number = NEW.room_number
      AND r.res_date = NEW.res_date
      AND r.res_time = NEW.res_time
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Overlapping reservation detected for same room/date/time.';
  END IF;
END$$

CREATE TRIGGER reservation_overlap_update BEFORE UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.branch_id = NEW.branch_id
      AND r.room_number = NEW.room_number
      AND r.res_date = NEW.res_date
      AND r.res_time = NEW.res_time
      AND r.reservation_id <> NEW.reservation_id
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Overlapping reservation detected for same room/date/time.';
  END IF;
END$$

CREATE TRIGGER reservation_cancel_restore AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
  IF NEW.is_available = FALSE AND OLD.is_available = TRUE THEN
    UPDATE reservations SET is_available = TRUE WHERE reservation_id = NEW.reservation_id;
  END IF;
END$$

CREATE TRIGGER event_staff_branch_match BEFORE INSERT ON event_staff
FOR EACH ROW
BEGIN
  DECLARE staff_branch INT;
  DECLARE event_branch INT;

  SELECT branch_id INTO staff_branch FROM staff WHERE staff_id = NEW.staff_id LIMIT 1;
  SELECT branch_id INTO event_branch FROM events WHERE event_id = NEW.event_id LIMIT 1;

  IF staff_branch IS NULL OR event_branch IS NULL OR staff_branch <> event_branch THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Staff must work at the branch of the event.';
  END IF;
END$$

CREATE TRIGGER event_attendee_lock BEFORE INSERT ON event_attendees
FOR EACH ROW
BEGIN
  DECLARE edate DATE;
  SELECT event_date INTO edate FROM events WHERE event_id = NEW.event_id LIMIT 1;
  IF edate < CURRENT_DATE() THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot add attendees to past events.';
  END IF;
END$$

CREATE TRIGGER item_hold_block BEFORE UPDATE ON books
FOR EACH ROW
BEGIN
  IF NEW.available = TRUE AND EXISTS (SELECT 1 FROM hold_requests WHERE item_id = NEW.book_id AND status = 'pending') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item has pending holds; cannot mark as available unless fulfilling hold.';
  END IF;
END$$

CREATE TRIGGER item_delete_cancel_holds BEFORE DELETE ON books
FOR EACH ROW
BEGIN
  UPDATE hold_requests SET status = 'canceled' WHERE item_id = OLD.book_id AND status = 'pending';
END$$

CREATE TRIGGER loan_on_create AFTER INSERT ON loan
FOR EACH ROW
BEGIN
  IF NEW.item_type = 'book' THEN
    UPDATE books SET copies = copies - 1, available = (copies - 1 > 0) WHERE book_id = NEW.item_id;
  END IF;
END$$

CREATE TRIGGER loan_on_return AFTER UPDATE ON loan
FOR EACH ROW
BEGIN
  IF NEW.return_ts IS NOT NULL AND (OLD.return_ts IS NULL OR OLD.return_ts <> NEW.return_ts) THEN
    IF NEW.item_type = 'book' THEN
      UPDATE books SET copies = copies + 1, available = TRUE WHERE book_id = NEW.item_id;
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_guard_copy_delete BEFORE DELETE ON item_copy
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM loan WHERE FALSE) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete copy: it has an active loan.';
  END IF;
END$$

-- ===============================
-- STORED PROCEDURES
-- ===============================

DROP PROCEDURE IF EXISTS admin_delete_item_copy$$
CREATE PROCEDURE admin_delete_item_copy(IN p_copy_id INT)
BEGIN
  DECLARE active_loans INT DEFAULT 0;
  DECLARE ready_holds INT DEFAULT 0;

  SELECT COUNT(*) INTO active_loans FROM loan WHERE item_id = p_copy_id AND return_ts IS NULL;
  IF active_loans > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete copy: it has an active loan.';
  END IF;

  SELECT COUNT(*) INTO ready_holds FROM hold_requests WHERE item_id = p_copy_id AND status = 'pending';
  IF ready_holds > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete copy: it is reserved for pickup.';
  END IF;

  DELETE FROM item_copy WHERE copy_id = p_copy_id;
END$$

DROP PROCEDURE IF EXISTS admin_delete_item_title$$
CREATE PROCEDURE admin_delete_item_title(IN p_title_id INT)
BEGIN
  IF EXISTS (SELECT 1 FROM item_copy WHERE title_id = p_title_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete title: copies still exist. Withdraw/delete copies first.';
  END IF;

  IF EXISTS (SELECT 1 FROM hold_requests WHERE item_id = p_title_id AND status IN ('pending','fulfilled')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete title: active holds exist.';
  END IF;

  DELETE FROM item_title WHERE title_id = p_title_id;
END$$

DELIMITER ;

-- ===============================
-- END OF FIXED SCHEMA
-- ===============================