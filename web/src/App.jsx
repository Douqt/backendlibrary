import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import { API_BASE_URL } from './config';

import Hero from './components/Hero';
import Categories from './components/Categories';
import Checkout from './components/Checkout';
import FeaturedBooks from './components/FeaturedBooks';
import LoginModal from './components/LoginModal';
import Signup from './components/Signup';
import SignIn from './components/SignIn';
import Profile from './components/Profile';
import NotificationBell from './components/NotificationBell';
import PaymentHistory from './components/PaymentHistory';
import PaymentModal from './components/PaymentModal';
import AdminSUMM_Report from './components/AdminSUMM_Report';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

function App() {
  const [user, setUser] = useState(null);
  const [loginModal, setLoginModal] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setLoginModal(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('user');
    setActiveTab('dashboard');
  };

  const openLoginModal = () => {
    setLoginModal(true);
  };

  const closeLoginModal = () => {
    setLoginModal(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-background w-full">
        <Header
          user={user}
          onSignIn={openLoginModal}
          onLogout={handleLogout}
        />
        <main className="w-full">
          <Routes>
            <Route path="/" element={
              <>
                <Hero />
                <Categories />
                <FeaturedBooks />
              </>
            } />
            <Route path="/checkout" element={<Checkout user={user} />} />
            <Route path="/profile" element={
              user ? <Profile user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view your profile.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
            <Route path="/loans" element={
              user ? <Loans user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view your loans.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/fines" element={
              user ? <Fines user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view your fines.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/holds" element={
              user ? <HoldRequests user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to manage holds.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/events" element={
              user ? <Events user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view events.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/services" element={
              user ? <Services user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view services.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/reservations" element={
              user ? <Reservations user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to manage reservations.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/payment-history" element={
              user ? <PaymentHistory user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in to view payment history.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/admin-report" element={
              user && user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') ? <AdminSUMM_Report user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in as an admin to view reports.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/members" element={
              user?.user_type === 'staff' ? <Members /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in as staff to view members.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/staff" element={
              user && user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') ? <StaffManagement user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in as an admin to manage staff.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <LoginModal
          isOpen={loginModal}
          onClose={closeLoginModal}
          onLogin={handleLogin}
        />
      </div>
    </Router>
  );
}

function StaffManagement({ user }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  const fetchStaff = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/staff`, { headers });
      const data = await response.json();
      setStaff(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.staff_id
      };
      const response = await fetch(`${API_BASE_URL}/branches`, { headers });
      if (response.ok) {
        const data = await response.json();
        setBranches(data.data || []);
      } else {
        console.error('Failed to fetch branches');
        setBranches([]); // Set empty array to prevent errors
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]); // Set empty array to prevent errors
    }
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Staff Management</h2>
        <p className="text-muted-foreground">Loading staff...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Staff Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-4xl font-bold text-foreground">Staff Management</h2>
          <Button onClick={() => setShowForm(true)}>
            Add Staff Member
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No staff members found</p>
            </div>
          ) : (
            staff.map(member => (
              <div key={member.staff_id} className="border p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
                    <p className="text-muted-foreground">{member.position}</p>
                  </div>
                  <Badge className={`${
                    member.position === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {member.position}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">Email: {member.email}</p>
                <p className="text-sm text-muted-foreground mb-2">Branch: {member.branch_name || 'Not assigned'}</p>
                <p className="text-sm text-muted-foreground mb-4">Hire Date: {new Date(member.hire_date).toLocaleDateString()}</p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingStaff(member);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
  variant="destructive"
  size="sm"
  disabled={member.staff_id === user.staff_id} // Can't delete yourself
  onClick={async () => {
    if (!window.confirm(`Are you sure you want to remove ${member.name}?`)) return;

    try {
      // Soft-delete the staff
      await db.query(
        `UPDATE staff 
         SET employment_status = 'Terminated',
             terminated_at = NOW(),
             termination_cause = 'Removed'
         WHERE staff_id = ?`,
        [member.staff_id]
      );

      // Optionally, remove the staff from your local UI state immediately
      setStaffList(prev => prev.filter(s => s.staff_id !== member.staff_id));

      alert(`${member.name} has been removed.`);
    } catch (err) {
      console.error(err);
      alert('Error removing staff.');
    }
  }}
>
  Remove
</Button>
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Staff Form Modal */}
        {showForm && (
          <StaffForm
            staff={editingStaff}
            branches={branches}
            onSave={() => {
              fetchStaff();
              setShowForm(false);
              setEditingStaff(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingStaff(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function StaffForm({ staff, branches, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    position: staff?.position || 'associate',
    hourly: staff?.hourly || 15.00,
    branch_id: staff?.branch_id || '',
    ssn: staff?.ssn || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.staff_id
      };

      const url = staff
        ? `${API_BASE_URL}/staff/${staff.staff_id}`
        : `${API_BASE_URL}/staff`;
      const method = staff ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(staff ? 'Staff member updated successfully!' : 'Staff member added successfully!');
        onSave();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Error saving staff member');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-card p-6 rounded-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-foreground">
          {staff ? 'Edit Staff Member' : 'Add Staff Member'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">SSN (Required for new staff)</label>
            <input
              type="text"
              name="ssn"
              value={formData.ssn}
              onChange={handleChange}
              required={!staff}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Position</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="associate">Associate</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hourly Rate ($)</label>
            <input
              type="number"
              name="hourly"
              value={formData.hourly}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Branch</label>
            <select
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a branch</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit">
              {staff ? 'Update' : 'Add'} Staff Member
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="section">
      <h2>Dashboard</h2>
      <p>Welcome to the Library Management System</p>
    </div>
  )
}

function Books({ user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/books`)
      .then(res => res.json())
      .then(data => {
        setBooks(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleCheckout = async (book) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': user.user_type,
        'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: user.member_id,
          item_id: book.book_id,
          item_type: 'book',
          branch_id: book.branch_id
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Book "${book.title}" has been checked out successfully!`);
        // Refresh books list
        fetch(`${API_BASE_URL}/books`)
          .then(res => res.json())
          .then(data => setBooks(data.data || []))
          .catch(err => console.error('Error refreshing books:', err));
      } else {
        const errorData = await response.json();
        alert(`Checkout failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed due to network error');
    }
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Books Management</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Books Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Books Management</h2>
        <div className="books-list">
          {books.length === 0 ? (
            <p className="text-muted-foreground">No books found</p>
          ) : (
            books.map(book => (
              <div key={book.book_id} className="book-item border p-4 rounded-lg mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-1">ISBN: {book.isbn}</p>
                <p className="text-gray-600 mb-1">Authors: {book.authors}</p>
                <p className="text-gray-600 mb-1">Available: {book.available ? 'Yes' : 'No'}</p>
                <p className="text-gray-600 mb-1">Copies: {book.copies}</p>
                {user && user.user_type === 'member' && book.available && book.copies > 0 && (
                  <Button
                    className="mt-2"
                    onClick={() => handleCheckout(book)}
                  >
                    Check Out Book
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = {};
    if (user) {
      headers['x-user-type'] = user.user_type;
      headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
    }

    fetch(`${API_BASE_URL}/members`, { headers })
      .then(res => res.json())
      .then(data => {
        setMembers(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Members Management</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Members Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Members Management</h2>
        <div className="members-list">
          {members.length === 0 ? (
            <p className="text-muted-foreground">No members found</p>
          ) : (
            members.map(member => (
              <div key={member.member_id} className="member-item">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.member_name}</h3>
                <p className="text-gray-600 mb-1">Email: {member.member_email}</p>
                <p className="text-gray-600 mb-1">Type: {member.member_type}</p>
                <p className="text-gray-600 mb-1">Status: {member.status}</p>
                <p className="text-gray-600 mb-1">Loans: {member.num_loans}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Loans({ user }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = {};
    if (user) {
      headers['x-user-type'] = user.user_type;
      headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
    }

    fetch(`${API_BASE_URL}/loans`, { headers })
      .then(res => res.json())
      .then(data => {
        setLoans(data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Loans Management</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Loans Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  // Separate active and returned loans
  const activeLoans = loans.filter(loan => !loan.return_ts && loan.status !== 'returned');
  const returnedLoans = loans.filter(loan => loan.return_ts || loan.status === 'returned');

  const renderLoanCard = (loan) => (
    <div key={loan.loan_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {loan.item_title || 'Unknown Item'}
          </h3>
          {user && user.user_type === 'staff' && (
            <p className="text-sm text-muted-foreground mb-2">Loan ID: {loan.loan_id}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Status: <span className={`font-medium ${loan.status === 'active' ? 'text-green-600' : loan.status === 'overdue' ? 'text-red-600' : 'text-gray-600'}`}>{loan.status}</span></span>
            <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
            {loan.return_ts && (
              <span>Returned: {new Date(loan.return_ts).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        {loan.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const userData = JSON.parse(localStorage.getItem('user'));
                const headers = {
                  'Content-Type': 'application/json',
                  'x-user-type': userData.user_type,
                  'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
                };

                const response = await fetch(`${API_BASE_URL}/loans/${loan.loan_id}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify({ return_ts: new Date().toISOString().split('T')[0] })
                });

                if (response.ok) {
                  alert(`"${loan.item_title}" has been returned successfully!`);
                  // Refresh loans list
                  fetch(`${API_BASE_URL}/loans`, { headers })
                    .then(res => res.json())
                    .then(data => setLoans(data.data || []))
                    .catch(err => console.error('Error refreshing loans:', err));
                } else {
                  const errorData = await response.json();
                  alert(`Return failed: ${errorData.message}`);
                }
              } catch (error) {
                console.error('Return error:', error);
                alert('Return failed due to network error');
              }
            }}
          >
            Return Item
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">My Loans</h2>

        {/* Active Loans Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-foreground">Active Loans ({activeLoans.length})</h3>
          {activeLoans.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">No active loans</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLoans.map(renderLoanCard)}
            </div>
          )}
        </div>

        {/* Returned Loans Section */}
        {returnedLoans.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-foreground">Loan History ({returnedLoans.length})</h3>
            <div className="space-y-4">
              {returnedLoans.map(renderLoanCard)}
            </div>
          </div>
        )}

        {loans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No loans found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Fines({ user }) {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);

  const fetchFines = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = {};
    if (user) {
      headers['x-user-type'] = user.user_type;
      headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
    }

    fetch(`${API_BASE_URL}/fines`, { headers })
      .then(res => res.json())
      .then(data => {
        setFines(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFines();
  }, []);

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Fines Management</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Fines Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Fines Management</h2>
        <div className="space-y-4">
          {fines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No fines found</p>
            </div>
          ) : (
            fines.map(fine => (
              <div key={fine.fine_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      ${fine.amount} Fine - {fine.item_title || 'Unknown Item'}
                    </h3>
                    {user?.user_type === 'staff' && (
                      <p className="text-sm text-muted-foreground mb-2">Fine ID: {fine.fine_id}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Reason: {fine.reason}</span>
                      <span>Status: <span className={`font-medium ${fine.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{fine.payment_status}</span></span>
                      {user?.user_type === 'staff' && (
                        <span>Member: {fine.member_name}</span>
                      )}
                    </div>
                  </div>
                  {fine.payment_status === 'unpaid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const user = JSON.parse(localStorage.getItem('user'));
                          const headers = {
                            'Content-Type': 'application/json',
                            'x-user-type': user.user_type,
                            'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
                          };

                          const response = await fetch(`${API_BASE_URL}/fines/${fine.fine_id}`, {
                            method: 'PATCH',
                            headers,
                            body: JSON.stringify({ payment_status: 'paid' })
                          });

                          if (response.ok) {
                            // Refresh fines list
                            const finesResponse = await fetch(`${API_BASE_URL}/fines`, { headers });
                            const finesData = await finesResponse.json();
                            setFines(finesData || []);
                          }
                        } catch (error) {
                          console.error('Error paying fine:', error);
                        }
                      }}
                    >
                      Pay Fine
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function HoldRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);

  const fetchRequests = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/hold-requests`, { headers });
      const data = await response.json();
      setRequests(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hold requests:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const urls = [
        `${API_BASE_URL}/books?available=true`,
        `${API_BASE_URL}/movies?available=true`,
        `${API_BASE_URL}/articles?available=true`,
        `${API_BASE_URL}/electronics?available=true`
      ];

      const promises = urls.map(url => fetch(url).then(res => res.json()));
      const responses = await Promise.all(promises);
      const allItems = [];

      // Add books
      if (responses[0].data) {
        responses[0].data.forEach(book => {
          allItems.push({
            id: `book-${book.book_id}`,
            title: book.title,
            type: 'book',
            itemId: book.book_id
          });
        });
      }

      // Add movies
      if (responses[1].data) {
        responses[1].data.forEach(movie => {
          allItems.push({
            id: `movie-${movie.movie_id}`,
            title: movie.title,
            type: 'movie',
            itemId: movie.movie_id
          });
        });
      }

      // Add articles
      if (responses[2].data) {
        responses[2].data.forEach(article => {
          allItems.push({
            id: `article-${article.artic_id}`,
            title: article.title,
            type: 'article',
            itemId: article.artic_id
          });
        });
      }

      // Add electronics
      if (responses[3].data) {
        responses[3].data.forEach(device => {
          allItems.push({
            id: `electronic-${device.libra_id}`,
            title: device.device_name,
            type: 'electronic',
            itemId: device.libra_id
          });
        });
      }

      setAvailableItems(allItems);
    } catch (error) {
      console.error('Error fetching available items:', error);
    }
  };

  const handleCreateRequest = async (itemId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.member_id
      };

      const response = await fetch(`${API_BASE_URL}/hold-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: userData.member_id,
          item_id: itemId
        })
      });

      if (response.ok) {
        alert('Hold request created successfully!');
        fetchRequests();
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating hold request:', error);
      alert('Error creating hold request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/hold-requests/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'canceled' })
      });

      if (response.ok) {
        alert('Hold request canceled successfully!');
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error canceling hold request:', error);
      alert('Error canceling hold request');
    }
  };

  const handleFulfillRequest = async (requestId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/hold-requests/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'fulfilled' })
      });

      if (response.ok) {
        alert('Hold request fulfilled successfully!');
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error fulfilling hold request:', error);
      alert('Error fulfilling hold request');
    }
  };

  useEffect(() => {
    fetchRequests();
    if (user.user_type === 'member') {
      fetchAvailableItems();
    }
  }, [user]);

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Holds Management</h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Holds Management</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-4xl font-bold text-foreground">Holds Management</h2>
          {user.user_type === 'member' && (
            <Button onClick={() => setShowForm(true)}>
              Create Hold
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No hold requests found</p>
            </div>
          ) : (
            requests.map(request => (
              <div key={request.request_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {request.item_title || 'Unknown Item'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{request.member_name}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Queue Position: {request.queue_position}</span>
                      <span>Priority Score: {request.priority_score}</span>
                      <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <Badge className={`${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                      request.status === 'canceled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </Badge>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        {user.user_type === 'member' && request.member_id === user.member_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRequest(request.request_id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {user.user_type === 'staff' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleFulfillRequest(request.request_id)}
                          >
                            Fulfill
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Hold Request Form Modal */}
        {showForm && user.user_type === 'member' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-card p-6 rounded-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-foreground">Create Hold</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Select Item</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCreateRequest(parseInt(e.target.value.split('-')[1]));
                      }
                    }}
                  >
                    <option value="">Choose an item...</option>
                    {availableItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Events({ user }) {
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Events Management</h2>
        <p className="text-muted-foreground">Events feature coming soon...</p>
      </div>
    </div>
  );
}

function Services({ user }) {
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Services Management</h2>
        <p className="text-muted-foreground">Services feature coming soon...</p>
      </div>
    </div>
  );
}

function Reservations({ user }) {
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Reservations Management</h2>
        <p className="text-muted-foreground">Reservations feature coming soon...</p>
      </div>
    </div>
  );
}

export default App
