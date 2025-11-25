const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Email templates for different notification types
 */
const emailTemplates = {
  loan_confirmation: (data) => ({
    subject: 'Loan Confirmation - Your Item Has Been Checked Out',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Loan Confirmation</h2>
        <p>Dear ${data.memberName},</p>
        <p>Your loan has been successfully confirmed!</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Item:</strong> ${data.itemTitle}</p>
          <p><strong>Loan Date:</strong> ${data.loanDate}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Branch:</strong> ${data.branchName}</p>
        </div>

        <p>Please return the item by the due date to avoid late fees.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Loan Confirmation\n\nDear ${data.memberName},\n\nYour loan has been successfully confirmed!\n\nItem: ${data.itemTitle}\nLoan Date: ${data.loanDate}\nDue Date: ${data.dueDate}\nBranch: ${data.branchName}\n\nPlease return the item by the due date to avoid late fees.`
  }),

  loan_almost_due: (data) => ({
    subject: 'Reminder: Your Loan is Due Soon',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Reminder: Item Due Soon</h2>
        <p>Dear ${data.memberName},</p>
        <p>This is a friendly reminder that your loan is due in <strong>${data.daysUntilDue} days</strong>.</p>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Item:</strong> ${data.itemTitle}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Days Remaining:</strong> ${data.daysUntilDue}</p>
        </div>

        <p>Please return or renew the item before the due date to avoid late fees.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Reminder: Item Due Soon\n\nDear ${data.memberName},\n\nThis is a friendly reminder that your loan is due in ${data.daysUntilDue} days.\n\nItem: ${data.itemTitle}\nDue Date: ${data.dueDate}\nDays Remaining: ${data.daysUntilDue}\n\nPlease return or renew the item before the due date to avoid late fees.`
  }),

  loan_due: (data) => ({
    subject: 'Item Due Today - Please Return',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Item Due Today</h2>
        <p>Dear ${data.memberName},</p>
        <p>Your loan is <strong>due today</strong>. Please return the item to avoid late fees.</p>

        <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Item:</strong> ${data.itemTitle}</p>
          <p><strong>Due Date:</strong> ${data.dueDate} (Today)</p>
          <p><strong>Return Location:</strong> Any library branch</p>
        </div>

        <p><strong>Note:</strong> Late fees will be applied starting tomorrow if the item is not returned.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Item Due Today\n\nDear ${data.memberName},\n\nYour loan is due today. Please return the item to avoid late fees.\n\nItem: ${data.itemTitle}\nDue Date: ${data.dueDate} (Today)\nReturn Location: Any library branch\n\nNote: Late fees will be applied starting tomorrow if the item is not returned.`
  }),

  loan_overdue: (data) => ({
    subject: 'OVERDUE: Please Return Your Item',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #991b1b;">OVERDUE ITEM</h2>
        <p>Dear ${data.memberName},</p>
        <p>Your loan is <strong style="color: #991b1b;">overdue by ${data.daysOverdue} days</strong>. Late fees are being applied.</p>

        <div style="background-color: #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #991b1b;">
          <p><strong>Item:</strong> ${data.itemTitle}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
          <p><strong>Current Fine:</strong> $${data.currentFine}</p>
        </div>

        <p><strong>Action Required:</strong> Please return the item immediately to your nearest library branch.</p>
        <p><strong>Important:</strong> Continued overdue items may result in account suspension.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `OVERDUE ITEM\n\nDear ${data.memberName},\n\nYour loan is overdue by ${data.daysOverdue} days. Late fees are being applied.\n\nItem: ${data.itemTitle}\nDue Date: ${data.dueDate}\nDays Overdue: ${data.daysOverdue}\nCurrent Fine: $${data.currentFine}\n\nAction Required: Please return the item immediately to your nearest library branch.\n\nImportant: Continued overdue items may result in account suspension.`
  }),

  fine_paid: (data) => ({
    subject: 'Payment Confirmation - Fine Paid',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Confirmation</h2>
        <p>Dear ${data.memberName},</p>
        <p>Thank you! Your payment has been received and processed successfully.</p>

        <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Payment Amount:</strong> $${data.amount}</p>
          <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Fine Type:</strong> ${data.fineReason}</p>
        </div>

        ${data.itemTitle ? `<p><strong>Related Item:</strong> ${data.itemTitle}</p>` : ''}
        <p>Your account has been updated. Thank you for using our library system.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Payment Confirmation\n\nDear ${data.memberName},\n\nThank you! Your payment has been received and processed successfully.\n\nPayment Amount: $${data.amount}\nPayment Date: ${data.paymentDate}\nPayment Method: ${data.paymentMethod}\nFine Type: ${data.fineReason}\n\n${data.itemTitle ? `Related Item: ${data.itemTitle}\n\n` : ''}Your account has been updated. Thank you for using our library system.`
  }),

  hold_available: (data) => ({
    subject: 'Great News! Your Requested Item is Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Your Hold is Ready for Pickup!</h2>
        <p>Dear ${data.memberName},</p>
        <p>Great news! The item you requested is now available and ready for you to pick up.</p>

        <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Item:</strong> ${data.itemTitle}</p>
          <p><strong>Pickup Location:</strong> ${data.branchName}</p>
          <p><strong>Hold Expires:</strong> 7 days from today</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>⚠️ Important:</strong> Please collect your item within <strong>7 days</strong> or your hold will expire and the item will be made available to the next person in the queue.</p>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul style="color: #374151;">
          <li>Visit ${data.branchName} during operating hours</li>
          <li>Show your library card or member ID at the circulation desk</li>
          <li>Check out your item and enjoy!</li>
        </ul>

        <p>Thank you for using our library hold service!</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Your Hold is Ready for Pickup!\n\nDear ${data.memberName},\n\nGreat news! The item you requested is now available and ready for you to pick up.\n\nItem: ${data.itemTitle}\nPickup Location: ${data.branchName}\nHold Expires: 7 days from today\n\n⚠️ IMPORTANT: Please collect your item within 7 days or your hold will expire and the item will be made available to the next person in the queue.\n\nNext Steps:\n- Visit ${data.branchName} during operating hours\n- Show your library card or member ID at the circulation desk\n- Check out your item and enjoy!\n\nThank you for using our library hold service!`
  }),

  account_approved: (data) => ({
    subject: 'Welcome! Your Library Account Has Been Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Account Approved!</h2>
        <p>Dear ${data.memberName},</p>
        <p>Great news! Your library account has been approved and is now active.</p>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <p><strong>Account Status:</strong> Active</p>
          <p><strong>Member Type:</strong> ${data.memberType}</p>
          <p><strong>Approval Date:</strong> ${data.approvalDate}</p>
        </div>

        <p><strong>What you can do now:</strong></p>
        <ul style="color: #374151;">
          <li>Browse and search our catalog</li>
          <li>Borrow books, movies, and other items</li>
          <li>Access digital resources</li>
          <li>Manage your loans and fines online</li>
        </ul>

        <p>Visit our library or log in to your account to start exploring our collection!</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This is an automated message from the Library System. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Account Approved!\n\nDear ${data.memberName},\n\nGreat news! Your library account has been approved and is now active.\n\nAccount Status: Active\nMember Type: ${data.memberType}\nApproval Date: ${data.approvalDate}\n\nWhat you can do now:\n- Browse and search our catalog\n- Borrow books, movies, and other items\n- Access digital resources\n- Manage your loans and fines online\n\nVisit our library or log in to your account to start exploring our collection!`
  })
};

/**
 * Send email notification
 * @param {string} to - Recipient email address
 * @param {string} notificationType - Type of notification (loan_confirmation, loan_almost_due, etc.)
 * @param {Object} data - Data to populate the email template
 * @returns {Promise<Object>} - Send result with success status
 */
async function sendEmail(to, notificationType, data) {
  try {
    // Get template for notification type
    const template = emailTemplates[notificationType];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationType}`);
    }

    // Generate email content from template
    const { subject, html, text } = template(data);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: text,
      html: html
    });

    console.log(`Email sent successfully to ${to}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: to
    };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);

    return {
      success: false,
      error: error.message,
      recipient: to
    };
  }
}

/**
 * Test email configuration
 * Sends a test email to verify setup
 */
async function testEmailConfig(recipientEmail) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: 'Test Email - Library System',
      text: 'This is a test email from the Library Notification System.',
      html: '<p>This is a test email from the <strong>Library Notification System</strong>.</p>'
    });

    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Test email failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  testEmailConfig,
  transporter
};
