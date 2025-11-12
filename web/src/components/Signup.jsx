import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    member_name: '',
    member_email: '',
    member_type: 'local', // Default to local member
    username: '',
    password: '',
    join_date: new Date().toISOString().split('T')[0] // Today's date
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully! You can now log in.');
        navigate('/signin'); // Redirect to sign-in page
      } else {
        setError(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg border border-gray-200">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Library Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account and start borrowing books, movies, and more!
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="member_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="member_name"
                name="member_name"
                type="text"
                required
                value={formData.member_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="member_email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="member_email"
                name="member_email"
                type="email"
                required
                value={formData.member_email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="Create a password"
              />
            </div>


          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
