-- Create the necessary views for admin reports
-- These views join multiple tables to generate comprehensive reports

-- Drop existing views if they exist
DROP VIEW IF EXISTS vw_member_summary;
DROP VIEW IF EXISTS vw_staff_member_report;
DROP VIEW IF EXISTS vw_admin_biweekly_loans;

-- Member summary view with loan and fine statistics
CREATE VIEW vw_member_summary AS
SELECT
    m.member_id,
    m.member_name,
    m.member_email,
    m.member_type,
    m.status,
    m.join_date,
    COALESCE(loan_stats.total_loans, 0) as total_loans,
    COALESCE(loan_stats.curr_loans, 0) as curr_loans,
    CASE
        WHEN m.member_type = 'faculty' THEN 10
        WHEN m.member_type = 'student' THEN 5
        ELSE 3
    END as max_loans,
    CASE WHEN COALESCE(loan_stats.curr_loans, 0) >=
        CASE
            WHEN m.member_type = 'faculty' THEN 10
            WHEN m.member_type = 'student' THEN 5
            ELSE 3
        END THEN 1 ELSE 0 END as is_restricted,
    COALESCE(fine_stats.total_fines, 0) as total_fines,
    COALESCE(fine_stats.total_fines_accrued, 0) as total_fines_accrued,
    COALESCE(fine_stats.paid_fines_value, 0) as paid_fines_value,
    COALESCE(fine_stats.outstanding_fines_balance, 0) as outstanding_fines_balance,
    loan_stats.date_last_checked_out
FROM member m
LEFT JOIN (
    SELECT
        member_id,
        COUNT(*) as total_fines,
        SUM(amount) as total_fines_accrued,
        SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as paid_fines_value,
        SUM(CASE WHEN payment_status = 'unpaid' THEN amount ELSE 0 END) as outstanding_fines_balance
    FROM fines
    WHERE deleted_at IS NULL
    GROUP BY member_id
) fine_stats ON m.member_id = fine_stats.member_id
LEFT JOIN (
    SELECT
        member_id,
        COUNT(*) as total_loans,
        COUNT(CASE WHEN return_ts IS NULL AND deleted_at IS NULL THEN 1 END) as curr_loans,
        MAX(loan_date) as date_last_checked_out
    FROM loan
    WHERE deleted_at IS NULL
    GROUP BY member_id
) loan_stats ON m.member_id = loan_stats.member_id
WHERE m.close_date = '9999-01-01';

-- Staff member report view
CREATE VIEW vw_staff_member_report AS
SELECT
    m.member_id,
    m.member_name,
    m.member_email,
    m.member_type,
    m.status,
    COALESCE(loan_stats.curr_loans, 0) as current_loaned_items,
    COALESCE(loan_stats.total_loans, 0) as total_loans,
    COALESCE(fine_stats.total_fines, 0) as total_fines,
    COALESCE(fine_stats.total_fines_accrued, 0) as fines_accrued,
    COALESCE(fine_stats.paid_fines_value, 0) as paid_fines_value,
    COALESCE(fine_stats.outstanding_fines_balance, 0) as outstanding_fines_balance
FROM member m
LEFT JOIN (
    SELECT
        member_id,
        COUNT(*) as total_fines,
        SUM(amount) as total_fines_accrued,
        SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) as paid_fines_value,
        SUM(CASE WHEN payment_status = 'unpaid' THEN amount ELSE 0 END) as outstanding_fines_balance
    FROM fines
    WHERE deleted_at IS NULL
    GROUP BY member_id
) fine_stats ON m.member_id = fine_stats.member_id
LEFT JOIN (
    SELECT
        member_id,
        COUNT(*) as total_loans,
        COUNT(CASE WHEN return_ts IS NULL AND deleted_at IS NULL THEN 1 END) as curr_loans
    FROM loan
    WHERE deleted_at IS NULL
    GROUP BY member_id
) loan_stats ON m.member_id = loan_stats.member_id
WHERE m.close_date = '9999-01-01'
ORDER BY outstanding_fines_balance DESC, member_name ASC;

-- Bi-weekly loans view
CREATE VIEW vw_admin_biweekly_loans AS
SELECT
    l.member_id,
    m.member_name,
    m.member_email,
    DATE_FORMAT(DATE_SUB(l.loan_date, INTERVAL WEEKDAY(l.loan_date) DAY), '%Y-%U') as biweek_label,
    DATE_SUB(l.loan_date, INTERVAL WEEKDAY(l.loan_date) DAY) as period_start,
    DATE_ADD(DATE_SUB(l.loan_date, INTERVAL WEEKDAY(l.loan_date) DAY), INTERVAL 13 DAY) as period_end,
    COUNT(*) as loans_in_period
FROM loan l
JOIN member m ON l.member_id = m.member_id
WHERE l.deleted_at IS NULL
  AND m.close_date = '9999-01-01'
GROUP BY l.member_id, m.member_name, m.member_email, biweek_label, period_start, period_end
ORDER BY period_start, member_name;
