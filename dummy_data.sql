USE library_db;

-- ========== BRANCHES ==========
INSERT INTO branches (name, address, phone, floor_count)
VALUES
('Central Library', '100 Main St, Springfield', '555-1111', 3),
('East Branch', '200 Oak Ave, Springfield', '555-2222', 2),
('West Branch', '300 Pine Rd, Springfield', '555-3333', 1),
('North Branch', '400 Elm St, Springfield', '555-4444', 2);

-- ========== MEMBERS ==========
INSERT INTO member (member_name, member_email, member_type, join_date, num_loans, status)
VALUES
('Alice Johnson', 'alice@example.com', 'local', '2024-01-15', 2, 'Active'),
('Bob Smith', 'bob@example.com', 'student', '2023-08-20', 1, 'Active'),
('Carol Lee', 'carol@example.com', 'faculty', '2022-09-05', 3, 'Active'),
('David Wilson', 'david@example.com', 'local', '2024-03-10', 0, 'Active'),
('Emma Davis', 'emma@example.com', 'student', '2023-09-15', 2, 'Active'),
('Frank Miller', 'frank@example.com', 'faculty', '2021-11-20', 5, 'Active');

-- ========== PUBLISHERS ==========
INSERT INTO publishers (name, imprint_name, country, city, established_year, contact_email, contact_phone, website, publisher_type, active)
VALUES
('Pearson', 'Pearson Education', 'USA', 'New York', 1950, 'info@pearson.com', '212-555-0100', 'https://pearson.com', 'Educational', TRUE),
('OReilly Media', NULL, 'USA', 'Boston', 1980, 'contact@oreilly.com', '617-555-0200', 'https://oreilly.com', 'Technical', TRUE),
('Penguin Random House', 'Vintage Books', 'USA', 'New York', 1927, 'contact@penguin.com', '212-555-0300', 'https://penguin.com', 'General', TRUE),
('MIT Press', NULL, 'USA', 'Cambridge', 1962, 'info@mitpress.com', '617-555-0400', 'https://mitpress.com', 'Academic', TRUE),
('Wiley', 'Wiley-Blackwell', 'USA', 'Hoboken', 1807, 'info@wiley.com', '201-555-0500', 'https://wiley.com', 'Academic', TRUE);

-- ========== AUTHORS ==========
INSERT INTO authors (name, birth_year)
VALUES
('John Doe', 1975),
('Jane Austen', 1775),
('Mark Twain', 1835),
('George Orwell', 1903),
('J.K. Rowling', 1965),
('Stephen King', 1947),
('Agatha Christie', 1890),
('Isaac Asimov', 1920),
('Philip K. Dick', 1928),
('Arthur C. Clarke', 1917);

-- ========== DIRECTORS ==========
INSERT INTO directors (name)
VALUES
('Steven Spielberg'),
('Christopher Nolan'),
('Greta Gerwig'),
('Martin Scorsese'),
('Quentin Tarantino'),
('Alfred Hitchcock'),
('Stanley Kubrick'),
('Francis Ford Coppola');

-- ========== GENRES ==========
INSERT INTO genres (name, applies_to)
VALUES
('Fiction', 'All'),
('Technology', 'book'),
('Computer Science', 'book'),
('Drama', 'movie'),
('Sci-Fi', 'movie'),
('Thriller', 'movie'),
('Romance', 'book'),
('Mystery', 'book'),
('Biography', 'book'),
('History', 'book');

-- ========== ITEM TITLES & COPIES ==========
INSERT INTO item_title (title)
VALUES
('Database Systems 101'),
('Intro to Artificial Intelligence'),
('Library Management Basics'),
('The Great Gatsby'),
('1984'),
('Harry Potter and the Sorcerer''s Stone'),
('The Shining'),
('Murder on the Orient Express'),
('Foundation'),
('Do Androids Dream of Electric Sheep?'),
('2001: A Space Odyssey');

INSERT INTO item_copy (title_id, status)
VALUES
(1, 'Available'),
(1, 'OnLoan'),
(2, 'Available'),
(2, 'Available'),
(3, 'Available'),
(4, 'Available'),
(5, 'OnLoan'),
(6, 'Available'),
(7, 'Available'),
(8, 'Available'),
(9, 'Available'),
(10, 'Available'),
(11, 'Available');

-- ========== STAFF ==========
INSERT INTO staff (ssn, branch_id, name, email, hourly, num_hours, position, hire_date, employment_status)
VALUES
(1001, 1, 'Ellen Baker', 'ellen@library.com', 25.00, 40, 'admin', '2022-03-01', 'Active'),
(1002, 2, 'David Green', 'david@library.com', 20.00, 35, 'associate', '2023-06-15', 'Active'),
(1003, 3, 'Maria Lopez', 'maria@library.com', 18.00, 30, 'associate', '2024-02-20', 'Active'),
(1004, 1, 'James Wilson', 'james@library.com', 22.00, 38, 'associate', '2023-01-10', 'Active'),
(1005, 4, 'Sarah Johnson', 'sarah@library.com', 19.00, 32, 'associate', '2024-05-15', 'Active'),
(1006, 2, 'Michael Brown', 'michael@library.com', 21.00, 36, 'associate', '2023-11-08', 'Active');

-- ========== BOOKS ==========
INSERT INTO books (branch_id, title, isbn, publication_year, publisher_id, version_type, copies, available, section_descriptor, section_floor)
VALUES
(1, 'Database Systems 101', '9780133970777', 2020, 1, 'physical', 5, TRUE, 'Technology', 2),
(1, 'Intro to Artificial Intelligence', '9780262045755', 2021, 4, 'physical', 3, TRUE, 'Computer Science', 2),
(1, 'Library Management Basics', '9780321125217', 2019, 1, 'physical', 4, TRUE, 'Reference', 1),
(2, 'The Great Gatsby', '9780743273565', 1925, 3, 'physical', 6, TRUE, 'Literature', 1),
(2, '1984', '9780451524935', 1949, 3, 'physical', 4, TRUE, 'Literature', 1),
(3, 'Harry Potter and the Sorcerer''s Stone', '9780590353427', 1997, 5, 'physical', 8, TRUE, 'Children''s', 1),
(3, 'The Shining', '9780307743657', 1977, 3, 'physical', 3, TRUE, 'Horror', 2),
(4, 'Murder on the Orient Express', '9780062693662', 1934, 5, 'physical', 5, TRUE, 'Mystery', 1),
(4, 'Foundation', '9780553293357', 1951, 5, 'physical', 4, TRUE, 'Sci-Fi', 2),
(1, 'Do Androids Dream of Electric Sheep?', '9780345404473', 1968, 5, 'physical', 3, TRUE, 'Sci-Fi', 2),
(2, '2001: A Space Odyssey', '9780451457998', 1968, 5, 'physical', 2, TRUE, 'Sci-Fi', 2);

-- ========== ARTICLES ==========
INSERT INTO articles (title, branch_id, issn, publisher_id, version_type, copies, available)
VALUES
('Modern Databases', 1, '1234-5678', 1, 'digital', 10, TRUE),
('AI in Libraries', 1, '2345-6789', 4, 'digital', 8, TRUE),
('Digital Preservation Techniques', 2, '3456-7890', 4, 'digital', 12, TRUE),
('Information Retrieval Advances', 2, '4567-8901', 4, 'digital', 6, TRUE),
('Library Automation Systems', 3, '5678-9012', 1, 'digital', 15, TRUE),
('Open Access Publishing', 3, '6789-0123', 5, 'digital', 9, TRUE),
('Metadata Standards', 4, '7890-1234', 4, 'digital', 7, TRUE),
('User Experience in Libraries', 4, '8901-2345', 1, 'digital', 11, TRUE);

-- ========== MOVIES ==========
INSERT INTO movies (branch_id, title, isan, release_date, publisher_id, director_id, media_type, location_section, available, copy_amount)
VALUES
(1, 'Library Chronicles', '0000-0001-0000-0001', '2015-05-01', 1, 1, 'BluRay', 'Movies', TRUE, 2),
(1, 'Knowledge Quest', '0000-0002-0000-0002', '2020-07-12', 4, 2, 'BluRay', 'Documentary', TRUE, 1),
(2, 'The Matrix', '0000-0003-0000-0003', '1999-03-31', 5, 3, 'BluRay', 'Sci-Fi', TRUE, 3),
(2, 'Inception', '0000-0004-0000-0004', '2010-07-16', 5, 2, 'BluRay', 'Thriller', TRUE, 2),
(3, 'Pulp Fiction', '0000-0005-0000-0005', '1994-10-14', 5, 5, 'BluRay', 'Drama', TRUE, 4),
(3, 'The Godfather', '0000-0006-0000-0006', '1972-03-24', 3, 8, 'BluRay', 'Drama', TRUE, 2),
(4, '2001: A Space Odyssey', '0000-0007-0000-0007', '1968-04-02', 5, 7, 'BluRay', 'Sci-Fi', TRUE, 1),
(4, 'Blade Runner', '0000-0008-0000-0008', '1982-06-25', 5, 4, 'BluRay', 'Sci-Fi', TRUE, 2);

-- ========== ELECTRONICS ==========
INSERT INTO electronics (branch_id, device_name, serial_num, manufact_date, maker, available, copy_amount)
VALUES
(1, 'Laptop Dell XPS 13', 'DL123456', '2021-03-10', 'Dell', TRUE, 5),
(1, 'iPad Mini 6', 'IP234567', '2022-11-15', 'Apple', TRUE, 3),
(1, 'Surface Pro 8', 'MS345678', '2021-10-05', 'Microsoft', TRUE, 4),
(2, 'MacBook Air M2', 'MB456789', '2022-07-15', 'Apple', TRUE, 6),
(2, 'ThinkPad X1 Carbon', 'TP567890', '2022-01-20', 'Lenovo', TRUE, 3),
(3, 'iPad Pro 12.9"', 'IPP678901', '2022-04-26', 'Apple', TRUE, 2),
(3, 'Galaxy Tab S8', 'GT789012', '2022-02-25', 'Samsung', TRUE, 4),
(4, 'Chromebook Pixel', 'CP890123', '2021-11-30', 'Google', TRUE, 3),
(4, 'Surface Laptop 4', 'SL901234', '2021-04-15', 'Microsoft', TRUE, 5);

-- ========== LOANS ==========
INSERT INTO loan (item_id, item_type, member_id, loan_date, due_date, return_ts, branch_id)
VALUES
(1, 'book', 1, '2025-10-01', '2025-10-15', NULL, 1),
(2, 'book', 2, '2025-10-05', '2025-10-20', '2025-10-18', 1),
(3, 'book', 3, '2025-10-10', '2025-10-25', NULL, 1),
(4, 'book', 4, '2025-10-12', '2025-10-27', NULL, 2),
(5, 'book', 5, '2025-10-08', '2025-10-23', '2025-10-20', 2),
(6, 'book', 6, '2025-10-15', '2025-10-30', NULL, 3),
(1, 'movie', 1, '2025-10-20', '2025-11-03', NULL, 1),
(2, 'movie', 2, '2025-10-18', '2025-11-01', '2025-10-28', 1),
(1, 'electronic_rental', 3, '2025-10-22', '2025-11-05', NULL, 1);

-- ========== FINES ==========
INSERT INTO fines (loan_id, member_id, item_id, amount, reason, payment_status, created_at)
VALUES
(1, 1, 1, 5.00, 'late', 'unpaid', '2025-10-16 00:00:00'),
(2, 2, 2, 2.50, 'late', 'paid', '2025-10-21 00:00:00'),
(5, 5, 5, 10.00, 'lost', 'partially_paid', '2025-10-24 00:00:00'),
(8, 2, 2, 3.75, 'late', 'unpaid', '2025-10-29 00:00:00');

-- ========== PAYMENTS ==========
INSERT INTO payments (fine_id, paid_amount, paid_at, payment_method)
VALUES
(2, 2.50, '2025-10-22 14:30:00', 'cash'),
(3, 5.00, '2025-10-25 10:15:00', 'credit'),
(3, 3.00, '2025-10-26 16:45:00', 'debit');

-- ========== HOLD REQUESTS ==========
INSERT INTO hold_requests (member_id, item_id, request_date, status, queue_position, priority_score, notes)
VALUES
(1, 2, '2025-09-20', 'fulfilled', 1, 2, 'Requested next available copy'),
(2, 1, '2025-09-22', 'pending', 1, 1, 'Waiting for return'),
(3, 4, '2025-09-25', 'pending', 2, 3, 'Faculty priority request'),
(4, 6, '2025-09-28', 'fulfilled', 1, 2, 'Quick pickup'),
(5, 3, '2025-10-01', 'pending', 1, 1, 'Student request'),
(6, 7, '2025-10-03', 'pending', 3, 3, 'Faculty research material');

-- ========== SERVICES ==========
INSERT INTO services (service_type, fee, branch_id, service_date, service_time, service_subject, service_description)
VALUES
('Printing', 0.10, 1, '2025-10-01', '09:00:00', 'Black/White Prints', 'Charge per page printed, high quality'),
('Color Printing', 0.50, 1, '2025-10-01', '09:00:00', 'Color Prints', 'Charge per page for color printing'),
('3D Printing', 2.00, 1, '2025-10-02', '13:00:00', '3D Model Print', '3D printing service, material cost included'),
('Lamination', 1.50, 2, '2025-10-03', '10:00:00', 'Document Lamination', 'Protective lamination service'),
('Scanning', 0.25, 2, '2025-10-03', '10:00:00', 'Document Scanning', 'High resolution scanning service'),
('Computer Use', 0.01, 3, '2025-10-04', '08:00:00', 'Public Computer Access', 'Minimal charge for computer access'),
('Microfilm Reader', 0.50, 3, '2025-10-04', '08:00:00', 'Microfilm/Microfiche Reading', 'Hourly rate for archival material access'),
('Audiobook Recording', 5.00, 4, '2025-10-05', '14:00:00', 'Audiobook Production', 'Professional audiobook recording service'),
('Research Consultation', 0.01, 4, '2025-10-05', '14:00:00', 'Research Help', 'Minimal charge for research consultation');

-- ========== EVENTS ==========
INSERT INTO events (event_name, branch_id, event_date, event_time, event_subject, event_description)
VALUES
('Book Club Meeting', 1, '2025-12-01', '18:00:00', 'Fiction Night', 'Monthly book club discussing contemporary fiction'),
('Tech Workshop', 1, '2025-12-08', '15:00:00', 'AI Basics', 'Introductory workshop on artificial intelligence'),
('Story Time', 2, '2025-12-02', '10:00:00', 'Children''s Stories', 'Weekly story time for children ages 3-8'),
('Author Talk', 2, '2025-12-15', '19:00:00', 'Local Author Reading', 'Local author discusses their latest work'),
('Genealogy Workshop', 3, '2025-12-03', '13:00:00', 'Family History Research', 'Learn to research your family history'),
('Film Screening', 3, '2025-12-20', '18:00:00', 'Classic Cinema', 'Monthly classic film screening and discussion'),
('Job Search Workshop', 4, '2025-12-04', '14:00:00', 'Resume Building', 'Workshop on resume writing and job search skills'),
('Poetry Reading', 4, '2025-12-18', '17:00:00', 'Open Mic Poetry', 'Monthly poetry reading and open mic event');

-- ========== RESERVATIONS ==========
INSERT INTO reservations (member_id, branch_id, room_number, res_date, res_time, room_type, capacity, is_available)
VALUES
(1, 1, 'R101', '2025-11-02', '14:00:00', 'study', 4, TRUE),
(2, 1, 'R102', '2025-11-03', '10:00:00', 'study', 2, TRUE),
(3, 2, 'M201', '2025-11-04', '13:00:00', 'meeting', 8, TRUE),
(4, 2, 'M202', '2025-11-05', '15:00:00', 'meeting', 12, TRUE),
(5, 3, 'C301', '2025-11-06', '09:00:00', 'conference', 20, TRUE),
(6, 3, 'C302', '2025-11-07', '11:00:00', 'conference', 25, TRUE),
(1, 4, 'S401', '2025-11-08', '16:00:00', 'study', 1, TRUE),
(2, 4, 'S402', '2025-11-09', '12:00:00', 'study', 1, TRUE);

-- ========== RELATION TABLES ==========
INSERT INTO book_authors (book_id, author_id)
VALUES
(1, 1),
(2, 8),
(3, 1),
(4, 2),
(5, 4),
(6, 5),
(7, 6),
(8, 7),
(9, 8),
(10, 9),
(11, 10);

INSERT INTO article_authors (artic_id, author_id)
VALUES
(1, 1),
(2, 8),
(3, 1),
(4, 8),
(5, 1),
(6, 4),
(7, 8),
(8, 1);

INSERT INTO item_genres (item_id, genre_id)
VALUES
(1, 2), (1, 3),
(2, 2), (2, 3),
(3, 9), (3, 10),
(4, 1), (4, 7),
(5, 1), (5, 5),
(6, 1), (6, 5),
(7, 1), (7, 6),
(8, 1), (8, 8),
(9, 1), (9, 5),
(10, 1), (10, 5),
(11, 1), (11, 5);

INSERT INTO service_staff (service_id, staff_id)
VALUES
(1, 1), (1, 4),
(2, 1), (2, 4),
(3, 1), (3, 4),
(4, 2), (4, 6),
(5, 2), (5, 6),
(6, 3), (6, 5),
(7, 3), (7, 5),
(8, 5), (8, 6),
(9, 5), (9, 6);

INSERT INTO works_at (staff_id, branch_id, num_hours)
VALUES
(1, 1, 40),
(2, 2, 35),
(3, 3, 30),
(4, 1, 38),
(5, 4, 32),
(6, 2, 36);

INSERT INTO event_staff (event_id, staff_id)
VALUES
(1, 1), (1, 4),
(2, 1), (2, 4),
(3, 2), (3, 6),
(4, 2), (4, 6),
(5, 3), (5, 5),
(6, 3), (6, 5),
(7, 5), (7, 6),
(8, 5), (8, 6);

INSERT INTO event_attendees (event_id, member_id)
VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 4), (2, 5),
(3, 2), (3, 4), (3, 5),
(4, 3), (4, 6),
(5, 1), (5, 3), (5, 6),
(6, 2), (6, 4),
(7, 1), (7, 2), (7, 5),
(8, 3), (8, 4), (8, 6);

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
