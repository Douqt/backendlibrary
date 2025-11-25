-- Library Reports Views
-- These views provide ready-to-query reports for administrators

-- =====================================================
-- VIEW 1: Overdue Loans with Member Info and Fines
-- =====================================================
-- Purpose: Show overdue items, the members who borrowed them, and any fines associated.
-- Tables used: loan, member, fines, books/movies/articles/electronics
CREATE OR REPLACE VIEW overdue_loans_report AS
SELECT
    l.loan_id,
    m.member_id,
    m.member_name,
    m.member_email,
    CASE l.item_type
        WHEN 'book' THEN b.title
        WHEN 'movie' THEN mv.title
        WHEN 'article' THEN a.title
        WHEN 'electronic_rental' THEN e.device_name
    END AS item_title,
    l.item_type,
    l.due_date,
    DATEDIFF(CURRENT_DATE(), l.due_date) AS days_overdue,
    COALESCE(f.amount, 0) AS fine_amount,
    f.payment_status,
    l.loan_date
FROM loan l
JOIN member m ON l.member_id = m.member_id
LEFT JOIN fines f ON f.loan_id = l.loan_id
LEFT JOIN books b ON l.item_id = b.book_id AND l.item_type = 'book'
LEFT JOIN movies mv ON l.item_id = mv.movie_id AND l.item_type = 'movie'
LEFT JOIN articles a ON l.item_id = a.artic_id AND l.item_type = 'article'
LEFT JOIN electronics e ON l.item_id = e.libra_id AND l.item_type = 'electronic_rental'
WHERE l.due_date < CURRENT_DATE() AND l.return_ts IS NULL AND m.deleted_at IS NULL
ORDER BY l.due_date ASC, m.member_name ASC;

-- =====================================================
-- VIEW 2: Most Borrowed Items by Type
-- =====================================================
-- Purpose: Show the most borrowed items in each category to guide inventory decisions.
-- Tables used: loan, books/movies/articles/electronics, member
CREATE OR REPLACE VIEW most_borrowed_items_report AS
SELECT
    l.item_type,
    CASE l.item_type
        WHEN 'book' THEN b.title
        WHEN 'movie' THEN mv.title
        WHEN 'article' THEN a.title
        WHEN 'electronic_rental' THEN e.device_name
    END AS item_title,
    COUNT(l.loan_id) AS times_borrowed,
    COUNT(DISTINCT l.member_id) AS unique_borrowers,
    MAX(l.loan_date) AS last_borrowed_date,
    ROUND(COUNT(l.loan_id) / COUNT(DISTINCT l.member_id), 2) AS avg_borrows_per_member
FROM loan l
LEFT JOIN books b ON l.item_id = b.book_id AND l.item_type = 'book'
LEFT JOIN movies mv ON l.item_id = mv.movie_id AND l.item_type = 'movie'
LEFT JOIN articles a ON l.item_id = a.artic_id AND l.item_type = 'article'
LEFT JOIN electronics e ON l.item_id = e.libra_id AND l.item_type = 'electronic_rental'
LEFT JOIN member m ON l.member_id = m.member_id
WHERE l.item_type IS NOT NULL AND m.deleted_at IS NULL
GROUP BY l.item_type,
         CASE l.item_type
             WHEN 'book' THEN b.title
             WHEN 'movie' THEN mv.title
             WHEN 'article' THEN a.title
             WHEN 'electronic_rental' THEN e.device_name
         END
ORDER BY l.item_type, times_borrowed DESC;

-- =====================================================
-- VIEW 3: Member Loan and Fine Summary
-- =====================================================
-- Purpose: Show each member's loan activity, fines owed, and total number of borrowed items.
-- Tables used: member, loan, fines
CREATE OR REPLACE VIEW member_activity_report AS
SELECT
    m.member_id,
    m.member_name,
    m.member_email,
    m.member_type,
    m.join_date,
    COUNT(DISTINCT l.loan_id) AS total_loans,
    SUM(CASE WHEN l.return_ts IS NULL THEN 1 ELSE 0 END) AS active_loans,
    SUM(CASE WHEN l.return_ts IS NOT NULL THEN 1 ELSE 0 END) AS returned_loans,
    COALESCE(SUM(f.amount), 0) AS total_fines_owed,
    COUNT(CASE WHEN f.payment_status = 'unpaid' THEN 1 END) AS unpaid_fines_count,
    MAX(l.loan_date) AS last_loan_date,
    DATEDIFF(CURRENT_DATE(), MAX(l.loan_date)) AS days_since_last_loan
FROM member m
LEFT JOIN loan l ON m.member_id = l.member_id
LEFT JOIN fines f ON f.member_id = m.member_id AND f.payment_status = 'unpaid'
WHERE m.deleted_at IS NULL
GROUP BY m.member_id, m.member_name, m.member_email, m.member_type, m.join_date
ORDER BY total_loans DESC, total_fines_owed DESC;

-- =====================================================
-- CSV EXPORT VIEWS (for easy Excel/dashboard integration)
-- =====================================================

-- CSV-ready version of overdue loans
CREATE OR REPLACE VIEW overdue_loans_csv AS
SELECT
    'Loan ID' as header1, 'Member ID' as header2, 'Member Name' as header3, 'Member Email' as header4,
    'Item Title' as header5, 'Item Type' as header6, 'Due Date' as header7, 'Days Overdue' as header8,
    'Fine Amount' as header9, 'Payment Status' as header10, 'Loan Date' as header11
UNION ALL
SELECT
    CAST(l.loan_id AS CHAR), CAST(m.member_id AS CHAR), m.member_name, m.member_email,
    CASE l.item_type
        WHEN 'book' THEN b.title
        WHEN 'movie' THEN mv.title
        WHEN 'article' THEN a.title
        WHEN 'electronic_rental' THEN e.device_name
    END,
    l.item_type, CAST(l.due_date AS CHAR), CAST(DATEDIFF(CURRENT_DATE(), l.due_date) AS CHAR),
    CAST(COALESCE(f.amount, 0) AS CHAR), COALESCE(f.payment_status, 'No Fine'), CAST(l.loan_date AS CHAR)
FROM loan l
JOIN member m ON l.member_id = m.member_id
LEFT JOIN fines f ON f.loan_id = l.loan_id
LEFT JOIN books b ON l.item_id = b.book_id AND l.item_type = 'book'
LEFT JOIN movies mv ON l.item_id = mv.movie_id AND l.item_type = 'movie'
LEFT JOIN articles a ON l.item_id = a.artic_id AND l.item_type = 'article'
LEFT JOIN electronics e ON l.item_id = e.libra_id AND l.item_type = 'electronic_rental'
WHERE l.due_date < CURRENT_DATE() AND l.return_ts IS NULL AND m.deleted_at IS NULL;

-- CSV-ready version of most borrowed items
CREATE OR REPLACE VIEW most_borrowed_items_csv AS
SELECT
    'Item Type' as header1, 'Item Title' as header2, 'Times Borrowed' as header3,
    'Unique Borrowers' as header4, 'Last Borrowed' as header5, 'Avg Borrows/Member' as header6
UNION ALL
SELECT
    l.item_type,
    CASE l.item_type
        WHEN 'book' THEN b.title
        WHEN 'movie' THEN mv.title
        WHEN 'article' THEN a.title
        WHEN 'electronic_rental' THEN e.device_name
    END,
    CAST(COUNT(l.loan_id) AS CHAR), CAST(COUNT(DISTINCT l.member_id) AS CHAR),
    CAST(MAX(l.loan_date) AS CHAR),
    CAST(ROUND(COUNT(l.loan_id) / COUNT(DISTINCT l.member_id), 2) AS CHAR)
FROM loan l
LEFT JOIN books b ON l.item_id = b.book_id AND l.item_type = 'book'
LEFT JOIN movies mv ON l.item_id = mv.movie_id AND l.item_type = 'movie'
LEFT JOIN articles a ON l.item_id = a.artic_id AND l.item_type = 'article'
LEFT JOIN electronics e ON l.item_id = e.libra_id AND l.item_type = 'electronic_rental'
LEFT JOIN member m ON l.member_id = m.member_id
WHERE l.item_type IS NOT NULL AND m.deleted_at IS NULL
GROUP BY l.item_type,
         CASE l.item_type
             WHEN 'book' THEN b.title
             WHEN 'movie' THEN mv.title
             WHEN 'article' THEN a.title
             WHEN 'electronic_rental' THEN e.device_name
         END
ORDER BY l.item_type, COUNT(l.loan_id) DESC;

-- CSV-ready version of member activity
CREATE OR REPLACE VIEW member_activity_csv AS
SELECT
    'Member ID' as header1, 'Member Name' as header2, 'Email' as header3, 'Member Type' as header4,
    'Join Date' as header5, 'Total Loans' as header6, 'Active Loans' as header7, 'Returned Loans' as header8,
    'Total Fines Owed' as header9, 'Unpaid Fines Count' as header10, 'Last Loan Date' as header11,
    'Days Since Last Loan' as header12
UNION ALL
SELECT
    CAST(m.member_id AS CHAR), m.member_name, m.member_email, m.member_type, CAST(m.join_date AS CHAR),
    CAST(COUNT(DISTINCT l.loan_id) AS CHAR),
    CAST(SUM(CASE WHEN l.return_ts IS NULL THEN 1 ELSE 0 END) AS CHAR),
    CAST(SUM(CASE WHEN l.return_ts IS NOT NULL THEN 1 ELSE 0 END) AS CHAR),
    CAST(COALESCE(SUM(f.amount), 0) AS CHAR),
    CAST(COUNT(CASE WHEN f.payment_status = 'unpaid' THEN 1 END) AS CHAR),
    CAST(MAX(l.loan_date) AS CHAR),
    CAST(DATEDIFF(CURRENT_DATE(), MAX(l.loan_date)) AS CHAR)
FROM member m
LEFT JOIN loan l ON m.member_id = l.member_id
LEFT JOIN fines f ON f.member_id = m.member_id AND f.payment_status = 'unpaid'
WHERE m.deleted_at IS NULL
GROUP BY m.member_id, m.member_name, m.member_email, m.member_type, m.join_date
ORDER BY COUNT(DISTINCT l.loan_id) DESC, COALESCE(SUM(f.amount), 0) DESC;
