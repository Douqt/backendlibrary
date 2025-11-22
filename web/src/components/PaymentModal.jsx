import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config';

const PaymentModal = ({ fine, onClose, onSuccess, notificationRef }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Processing, 3: Confirmation
  const [formData, setFormData] = useState({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [errors, setErrors] = useState({});
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Format card number as user types (XXXX-XXXX-XXXX-XXXX)
  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.match(/.{1,4}/g)?.join('-') || limited;
    return formatted;
  };

  // Format expiration date as MM/YY
  const formatExpirationDate = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expirationDate') {
      formattedValue = formatExpirationDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData({ ...formData, [name]: formattedValue });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate card number (16 digits)
    const cardDigits = formData.cardNumber.replace(/\D/g, '');
    if (!cardDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits';
    }

    // Validate expiration date
    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expirationDate)) {
      newErrors.expirationDate = 'Use MM/YY format';
    } else {
      const [month, year] = formData.expirationDate.split('/').map(num => parseInt(num));
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expirationDate = 'Invalid month';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expirationDate = 'Card is expired';
      }
    }

    // Validate CVV
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length !== 3) {
      newErrors.cvv = 'CVV must be exactly 3 digits';
    }

    // Validate cardholder name
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Move to processing step
    setStep(2);

    try {
      // Simulate processing delay (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Call backend API
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-type': user.user_type,
          'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
        },
        body: JSON.stringify({
          fine_id: fine.fine_id,
          card_number: formData.cardNumber,
          expiration_date: formData.expirationDate,
          cvv: formData.cvv,
          cardholder_name: formData.cardholderName
        })
      });

      const data = await response.json();
      if (data.success) {
        setPaymentDetails(data.payment);
        setStep(3); // Move to confirmation step

        // Refresh notifications immediately
        if (notificationRef?.current?.refresh) {
          notificationRef.current.refresh();
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed. Please try again.');
      setStep(1); // Go back to form
    }
  };

  const handleClose = () => {
    if (step === 3 && onSuccess) {
      onSuccess(); // Refresh fines list
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {step === 1 && 'Pay Fine'}
            {step === 2 && 'Processing Payment'}
            {step === 3 && 'Payment Successful'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step 1: Payment Form */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Fine Details */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount Due:</span>
                <span className="text-2xl font-bold text-blue-600">${fine.amount}</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Reason: {fine.reason}</div>
                <div>Fine ID: #{fine.fine_id}</div>
              </div>
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234-5678-9012-3456"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiration and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="text"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                    errors.expirationDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expirationDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expirationDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={formData.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Pay ${fine.amount}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Processing */}
        {step === 2 && (
          <div className="p-12 text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Processing Payment...
            </h3>
            <p className="text-gray-600">Please wait while we process your transaction</p>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && paymentDetails && (
          <div className="p-6">
            <div className="text-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">Your fine has been paid</p>
            </div>

            {/* Receipt Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold">${paymentDetails.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold">{paymentDetails.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Card:</span>
                <span className="font-semibold">•••• {paymentDetails.last4}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-semibold">
                  {new Date(paymentDetails.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fine ID:</span>
                <span className="font-semibold">#{paymentDetails.fine_id}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
