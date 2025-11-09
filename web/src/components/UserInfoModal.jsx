import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { X } from 'lucide-react';
import { API_URL } from '../config/api';

const UserInfoModal = ({ isOpen, onClose, user, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    member_name: user?.name || '',
    username: user?.username || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if anything is being updated
    const nameChanged = formData.member_name && formData.member_name !== user.name;
    const usernameChanged = formData.username && formData.username !== user.username;
    const passwordChanging = formData.new_password || formData.current_password || formData.confirm_password;

    if (!nameChanged && !usernameChanged && !passwordChanging) {
      setError('No changes to save');
      setLoading(false);
      return;
    }

    // Validate username if changed
    if (usernameChanged) {
      if (formData.username.length < 3) {
        setError('Username must be at least 3 characters long');
        setLoading(false);
        return;
      }
    }

    // Validate password fields if changing password
    if (passwordChanging) {
      if (!formData.current_password) {
        setError('Current password is required to change password');
        setLoading(false);
        return;
      }

      if (!formData.new_password) {
        setError('New password is required');
        setLoading(false);
        return;
      }

      if (formData.new_password !== formData.confirm_password) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.new_password.length < 6) {
        setError('New password must be at least 6 characters long');
        setLoading(false);
        return;
      }
    }

    try {
      const requestBody = {};

      if (nameChanged) {
        requestBody.member_name = formData.member_name;
      }

      if (usernameChanged) {
        requestBody.username = formData.username;
      }

      if (passwordChanging) {
        requestBody.current_password = formData.current_password;
        requestBody.new_password = formData.new_password;
      }

      const response = await fetch(`${API_URL}/api/members/me/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-type': user.user_type,
          'x-user-id': user.member_id
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Information updated successfully!');

        // Update localStorage with new user data
        const updatedUser = {
          ...user,
          name: data.data.member_name,
          member_name: data.data.member_name,
          username: data.data.username
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Call success callback
        if (onUpdateSuccess) {
          onUpdateSuccess(updatedUser);
        }

        // Reset password fields
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to update information');
      }
    } catch (error) {
      console.error('Error updating info:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      member_name: user?.name || '',
      username: user?.username || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="relative">
          <CardTitle className="text-center">Update Your Information</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-sm text-center bg-green-50 p-2 rounded">
                {success}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="member_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.member_name}
                onChange={handleChange}
                disabled={loading}
                placeholder={user?.name}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                placeholder={user?.username}
                minLength={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 3 characters and unique
              </p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">
                Email (cannot be changed)
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Change Password (Optional)</h3>

              {/* Current Password */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="current_password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.current_password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.new_password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UserInfoModal;
