import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { X } from 'lucide-react';
import { API_URL } from '../config/api';

const RegistrationModal = ({ isOpen, onClose, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    member_type: 'local',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register/member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_name: formData.member_name,
          member_email: formData.member_email,
          member_type: formData.member_type,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          'Registration successful!\n\n' +
          'Your account has been created with "Pending" status.\n' +
          'Please wait for staff approval before you can log in and use the system.\n\n' +
          'You will be notified once your account is approved.'
        );
        handleClose();
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      member_name: '',
      member_email: '',
      member_type: 'local',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <CardTitle className="text-center">Create Account</CardTitle>
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

            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="member_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.member_name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="member_email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.member_email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Member Type <span className="text-red-500">*</span>
              </label>
              <select
                name="member_type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.member_type}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="local">Local Resident</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Your account will be pending approval by staff
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="johndoe"
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={6}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Re-enter password"
              />
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegistrationModal;
