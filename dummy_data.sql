USE library_db;

-- ========== BRANCHES ==========
INSERT INTO branches (name, address, phone, floor_count)
VALUES
('Central Library', '100 Main St', '555-1111', 3),
('East Branch', '200 Oak Ave', '555-2222', 2),
('West Branch', '300 Pine Rd', '555-3333', 1);

-- ========== MEMBERS ==========
INSERT INTO member (member_name, member_email, member_type, join_date)
VALUES
('Alice Johnson', 'alice@example.com', 'local', '2024-01-15'),
('Bob Smith', 'bob@example.com', 'student', '2023-08-20'),
('Carol Lee', 'carol@example.com', 'faculty', '2022-09-05');

-- ========== PUBLISHERS ==========
INSERT INTO publishers (name, imprint_name, country, city, established_year, contact_email, website)
VALUES
('Pearson', 'Pearson Edu', 'USA', 'New York', 1950, 'info@pearson.com', 'https://pearson.com'),
('OReilly Media', NULL, 'USA', 'Boston', 1980, 'contact@oreilly.com', 'https://oreilly.com');

-- ========== AUTHORS ==========
INSERT INTO authors (name, birth_year)
VALUES
('John Doe', 1975),
('Jane Austen', 1775),
('Mark Twain', 1835);

-- ========== DIRECTORS ==========
INSERT INTO directors (name)
VALUES
('Steven Spielberg'),
('Christopher Nolan'),
('Greta Gerwig');

-- ========== GENRES ==========
INSERT INTO genres (name, applies_to)
VALUES
('Fiction', 'book'),
('Technology', 'book'),
('Drama', 'movie'),
('Sci-Fi', 'movie');

-- ========== ITEM TITLES & COPIES ==========
INSERT INTO item_title (title)
VALUES
('Database Systems 101'),
('Intro to Artificial Intelligence'),
('Library Management Basics');

INSERT INTO item_copy (title_id, status)
VALUES
(1, 'Available'),
(2, 'Available'),
(3, 'Available');

-- ========== STAFF ==========
INSERT INTO staff (ssn, branch_id, name, email, hourly, num_hours, position, hire_date)
VALUES
(1001, 1, 'Ellen Baker', 'ellen@library.com', 25.00, 40, 'admin', '2022-03-01'),
(1002, 2, 'David Green', 'david@library.com', 20.00, 35, 'associate', '2023-06-15'),
(1003, 3, 'Maria Lopez', 'maria@library.com', 18.00, 30, 'associate', '2024-02-20');

-- ========== BOOKS ==========
INSERT INTO books (branch_id, title, isbn, publication_year, publisher_id, version_type, copies, available, section_descriptor, section_floor)
VALUES
(1, 'Database Systems 101', '9780133970777', 2020, 1, 'physical', 5, TRUE, 'Technology', 2),
(2, 'Intro to Artificial Intelligence', '9780262045755', 2021, 2, 'physical', 3, TRUE, 'Computer Science', 1),
(3, 'Library Management Basics', '9780321125217', 2019, 1, 'physical', 4, TRUE, 'Reference', 1);

-- ========== ARTICLES ==========
INSERT INTO articles (title, branch_id, issn, publisher_id, version_type, copies, available)
VALUES
('Modern Databases', 1, '1234-5678', 1, 'digital', 10, TRUE),
('AI in Libraries', 2, '2345-6789', 2, 'digital', 8, TRUE);

-- ========== MOVIES ==========
INSERT INTO movies (branch_id, title, isan, release_date, publisher_id, director_id, media_type, location_section, available, copy_amount)
VALUES
(1, 'Library Chronicles', '0000-0001', '2015-05-01', 1, 1, 'BluRay', 'Movies', TRUE, 2),
(2, 'Knowledge Quest', '0000-0002', '2020-07-12', 2, 2, 'CD', 'Media', TRUE, 1);

-- ========== ELECTRONICS ==========
INSERT INTO electronics (branch_id, device_name, serial_num, manufact_date, maker, available, copy_amount)
VALUES
(1, 'Laptop Dell', 'DL123', '2021-03-10', 'Dell', TRUE, 5),
(2, 'iPad Mini', 'IP234', '2022-11-15', 'Apple', TRUE, 3);

-- ========== LOANS ==========
INSERT INTO loan (item_id, item_type, member_id, loan_date, due_date, branch_id)
VALUES
(1, 'book', 1, '2025-10-01', '2025-10-15', 1),
(2, 'book', 2, '2025-10-05', '2025-10-20', 2),
(3, 'book', 3, '2025-10-10', '2025-10-25', 3);

-- ========== FINES ==========
INSERT INTO fines (loan_id, member_id, item_id, amount, reason, payment_status)
VALUES
(1, 1, 1, 5.00, 'late', 'unpaid'),
(2, 2, 2, 10.00, 'lost', 'paid');

-- ========== PAYMENTS ==========
INSERT INTO payments (fine_id, paid_amount, payment_method)
VALUES
(2, 10.00, 'credit');

-- ========== HOLD REQUESTS ==========
INSERT INTO hold_requests (member_id, item_id, request_date, status, queue_position, priority_score, notes)
VALUES
(1, 2, '2025-09-20', 'fulfilled', 1, 5, 'Requested next available copy'),
(2, 1, '2025-09-22', 'pending', 2, 4, 'Waiting list');

-- ========== SERVICES ==========
INSERT INTO services (service_type, fee, branch_id, service_date, service_time, service_subject, service_description)
VALUES
('Printing', 0.10, 1, '2025-10-01', '10:00:00', 'Black/White Prints', 'Charge per page printed'),
('3D Printing', 2.00, 2, '2025-10-02', '13:00:00', '3D Model Print', '3D printing service');

-- ========== EVENTS ==========
INSERT INTO events (event_name, branch_id, event_date, event_time, event_subject, event_description)
VALUES
('Book Club', 1, '2025-11-01', '18:00:00', 'Fiction Night', 'Members discuss popular fiction books'),
('Tech Workshop', 2, '2025-11-10', '15:00:00', 'AI Basics', 'Introductory session on AI applications');

-- ========== RESERVATIONS ==========
INSERT INTO reservations (member_id, branch_id, room_number, res_date, res_time, room_type, capacity, is_available)
VALUES
(1, 1, 'R101', '2025-11-02', '14:00:00', 'study', 4, TRUE),
(2, 2, 'M201', '2025-11-03', '10:00:00', 'meeting', 8, TRUE);

-- ========== RELATION TABLES ==========
INSERT INTO book_authors (book_id, author_id)
VALUES
(1, 1),
(2, 2),
(3, 3);

INSERT INTO article_authors (artic_id, author_id)
VALUES
(1, 1),
(2, 2);

INSERT INTO item_genres (item_id, genre_id)
VALUES
(1, 2),
(2, 1),
(3, 1);

INSERT INTO service_staff (service_id, staff_id)
VALUES
(1, 1),
(2, 2);

INSERT INTO works_at (staff_id, branch_id, num_hours)
VALUES
(1, 1, 40),
(2, 2, 35),
(3, 3, 30);

INSERT INTO event_staff (event_id, staff_id)
VALUES
(1, 1),
(2, 2);

INSERT INTO event_attendees (event_id, member_id)
VALUES
(1, 1),
(1, 2),
(2, 3);

-- ========== AUTH ==========
INSERT INTO member_auth (member_id, username, password)
VALUES
(1, 'alicej', 'pass1'),
(2, 'bobsmith', 'pass2'),
(3, 'carollee', 'pass3');

INSERT INTO staff_auth (staff_id, username, password, role)
VALUES
(1, 'ellenb', 'adminpass', 'admin'),
(2, 'davidg', 'staffpass', 'staff'),
(3, 'marial', 'staffpass2', 'staff');
