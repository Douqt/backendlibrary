import React, { useState, useEffect } from 'react';
import { X, Receipt, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '../config';

const PaymentHistory = ({ onClose }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('Fetching payment history for user:', user);

      if (!user) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          'x-user-type': user.user_type,
          'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
        }
      });

      const data = await response.json();
      console.log('Payment history response:', data);
      setPayments(data.payments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setError(error.message || 'Failed to load payment history');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractLast4Digits = (paymentMethod) => {
    const match = paymentMethod.match(/\d{4}$/);
    return match ? match[0] : 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Payment History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No payment history found</p>
              <p className="text-gray-500 text-sm mt-2">
                Your completed payments will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Fine Reason
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Payment Method
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Card
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.payment_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(payment.paid_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        ${parseFloat(payment.paid_amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="capitalize">{payment.reason}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          Credit/Debit Card
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        •••• {extractLast4Digits(payment.payment_method)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">
                    Total Payments: {payments.length}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    Total Amount Paid: $
                    {payments
                      .reduce((sum, payment) => sum + parseFloat(payment.paid_amount), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
