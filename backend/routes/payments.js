const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createNotification } = require('../services/notificationService');

// Middleware to extract user info from headers
const getUserFromRequest = (req) => {
  return {
    user_type: req.headers['x-user-type'],
    user_id: parseInt(req.headers['x-user-id'])
  };
};

// Card validation helpers
function validateCardNumber(cardNumber) {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  // Check if it's 16 digits
  return /^\d{16}$/.test(cleaned);
}

function validateExpirationDate(expDate) {
  // Check format MM/YY
  if (!/^\d{2}\/\d{2}$/.test(expDate)) {
    return false;
  }

  const [month, year] = expDate.split('/').map(num => parseInt(num));

  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }

  // Check if date is in the future
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
}

function validateCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

function validateCardholderName(name) {
  return name && name.trim().length > 0;
}

// POST /api/payments - Process a new payment
router.post('/', async (req, res) => {
  const { fine_id, card_number, expiration_date, cvv, cardholder_name } = req.body;
  const user = getUserFromRequest(req);

  try {
    // Validate all required fields
    if (!fine_id || !card_number || !expiration_date || !cvv || !cardholder_name) {
      return res.status(400).json({ error: 'All payment fields are required' });
    }

    // Validate card details
    if (!validateCardNumber(card_number)) {
      return res.status(400).json({ error: 'Invalid card number. Must be 16 digits.' });
    }

    if (!validateExpirationDate(expiration_date)) {
      return res.status(400).json({ error: 'Invalid or expired expiration date. Use MM/YY format.' });
    }

    if (!validateCVV(cvv)) {
      return res.status(400).json({ error: 'Invalid CVV. Must be 3-4 digits.' });
    }

    if (!validateCardholderName(cardholder_name)) {
      return res.status(400).json({ error: 'Cardholder name is required.' });
    }

    // Get the fine details
    const [fineRows] = await db.query(
      'SELECT * FROM fines WHERE fine_id = ?',
      [fine_id]
    );

    if (fineRows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const fine = fineRows[0];

    // Check if fine is already paid
    if (fine.payment_status === 'paid') {
      return res.status(400).json({ error: 'This fine has already been paid' });
    }

    // Check authorization - members can only pay their own fines
    if (user.user_type === 'member' && user.user_id !== fine.member_id) {
      return res.status(403).json({ error: 'Unauthorized to pay this fine' });
    }

    // Get last 4 digits of card for record keeping
    const last4Digits = card_number.replace(/[\s-]/g, '').slice(-4);

    // Create payment record
    const [paymentResult] = await db.query(
      'INSERT INTO payments (fine_id, paid_amount, payment_method) VALUES (?, ?, ?)',
      [fine_id, fine.amount, `Credit/Debit Card ending in ${last4Digits}`]
    );

    // Update fine status to paid
    await db.query(
      'UPDATE fines SET payment_status = ? WHERE fine_id = ?',
      ['paid', fine_id]
    );

    // Get item details for notification
    let itemTitle = null;
    try {
      const [loanDetails] = await db.query(
        `SELECT l.item_type, l.item_id
         FROM fines f
         JOIN loan l ON f.loan_id = l.loan_id
         WHERE f.fine_id = ?`,
        [fine_id]
      );

      if (loanDetails.length > 0) {
        const { item_type, item_id } = loanDetails[0];

        if (item_type === 'book') {
          const [bookDetails] = await db.query('SELECT title FROM books WHERE book_id = ?', [item_id]);
          if (bookDetails.length > 0) {
            itemTitle = bookDetails[0].title;
          }
        } else if (item_type === 'movie') {
          const [movieDetails] = await db.query('SELECT title FROM movies WHERE movie_id = ?', [item_id]);
          if (movieDetails.length > 0) {
            itemTitle = movieDetails[0].title;
          }
        } else if (item_type === 'article') {
          const [articleDetails] = await db.query('SELECT title FROM articles WHERE artic_id = ?', [item_id]);
          if (articleDetails.length > 0) {
            itemTitle = articleDetails[0].title;
          }
        } else if (item_type === 'electronic_rental') {
          const [electronicDetails] = await db.query('SELECT device_name as title FROM electronics WHERE libra_id = ?', [item_id]);
          if (electronicDetails.length > 0) {
            itemTitle = electronicDetails[0].title;
          }
        }
      }

      // Send fine paid notification
      await createNotification({
        memberId: fine.member_id,
        notificationType: 'fine_paid',
        data: {
          amount: fine.amount.toFixed(2),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Credit/Debit Card',
          fineReason: fine.reason,
          itemTitle: itemTitle
        },
        relatedFineId: fine_id,
        sendEmail: true
      });
    } catch (notificationError) {
      // Log error but don't fail the payment
      console.error('Failed to send payment confirmation notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        payment_id: paymentResult.insertId,
        fine_id: fine_id,
        amount: fine.amount,
        last4: last4Digits,
        payment_method: 'Credit/Debit Card',
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// GET /api/payments - Get payment history for the logged-in member
router.get('/', async (req, res) => {
  const user = getUserFromRequest(req);

  try {
    const memberId = user.user_id;

    // Only members can view their payment history
    if (user.user_type !== 'member') {
      return res.status(403).json({ error: 'Only members can view payment history' });
    }

    // Get payment history with fine details
    const [payments] = await db.query(
      `SELECT
        p.payment_id,
        p.fine_id,
        p.paid_amount,
        p.paid_at,
        p.payment_method,
        f.reason,
        f.item_id
      FROM payments p
      JOIN fines f ON p.fine_id = f.fine_id
      WHERE f.member_id = ?
      ORDER BY p.paid_at DESC`,
      [memberId]
    );

    res.json({ payments });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;
