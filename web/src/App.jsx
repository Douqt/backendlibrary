import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';

import Hero from './components/Hero';
import Categories from './components/Categories';
import Checkout from './components/Checkout';
import FeaturedBooks from './components/FeaturedBooks';
import LoginModal from './components/LoginModal';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loginModal, setLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialCategoryFilter, setInitialCategoryFilter] = useState(null);

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
      await fetch('https://librarydb.duckdns.org/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const openLoginModal = () => {
    setLoginModal(true);
  };

  const closeLoginModal = () => {
    setLoginModal(false);
  };

  const scrollToCollections = () => {
    document.getElementById('collections')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setActiveTab('checkout');
    // Checkout component will handle fetching with search query
  };

  const handleCategoryClick = (itemType) => {
    // Navigate to checkout tab with specific filter applied
    setInitialCategoryFilter(itemType);
    setActiveTab('checkout');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onSignIn={openLoginModal}
        onLogout={handleLogout}
      />
      <main className="w-full">
        {activeTab === 'dashboard' && (
          <>
            <Hero
              onBrowseCollections={scrollToCollections}
              onSearchCatalog={handleSearch}
            />
            <Categories onCategoryClick={handleCategoryClick} />
            <FeaturedBooks />
          </>
        )}
        {activeTab === 'checkout' && <Checkout user={user} searchQuery={searchQuery} initialCategoryFilter={initialCategoryFilter} onClearSearch={clearSearch} />}
        {activeTab === 'members' && (user?.user_type === 'staff' ? <Members /> : (
          <div className="py-20 px-4 w-full">
            <div className="max-w-7xl mx-auto w-full text-center">
              <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in as staff to view members.</p>
              <Button onClick={openLoginModal}>Sign In</Button>
            </div>
          </div>
        ))}
        {activeTab === 'loans' && (user ? <Loans user={user} /> : (
          <div className="py-20 px-4 w-full">
            <div className="max-w-7xl mx-auto w-full text-center">
              <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in to view your loans.</p>
              <Button onClick={openLoginModal}>Sign In</Button>
            </div>
          </div>
        ))}
        {activeTab === 'staff' && (user && user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') ? <StaffManagement user={user} /> : (
          <div className="py-20 px-4 w-full">
            <div className="max-w-7xl mx-auto w-full text-center">
              <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in as an admin to manage staff.</p>
              <Button onClick={openLoginModal}>Sign In</Button>
            </div>
          </div>
        ))}
        {activeTab === 'fines' && (user ? <Fines user={user} /> : (
          <div className="py-20 px-4 w-full">
            <div className="max-w-7xl mx-auto w-full text-center">
              <h2 className="text-4xl font-bold mb-8 text-foreground">Please Sign In</h2>
              <p className="text-muted-foreground mb-4">You need to be logged in to view your fines.</p>
              <Button onClick={openLoginModal}>Sign In</Button>
            </div>
          </div>
        ))}
      </main>

      <LoginModal
        isOpen={loginModal}
        onClose={closeLoginModal}
        onLogin={handleLogin}
      />
    </div>
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

      const response = await fetch('https://librarydb.duckdns.org/api/staff', { headers });
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
      const response = await fetch('https://librarydb.duckdns.org/api/branches', { headers });
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
        ? `https://librarydb.duckdns.org/api/staff/${staff.staff_id}`
        : 'https://librarydb.duckdns.org/api/staff';
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
    fetch('https://librarydb.duckdns.org/api/books')
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

      const response = await fetch('https://librarydb.duckdns.org/api/loans', {
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
        fetch('https://librarydb.duckdns.org/api/books')
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

    fetch('https://librarydb.duckdns.org/api/members', { headers })
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

    fetch('https://librarydb.duckdns.org/api/loans', { headers })
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

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Loans Management</h2>
        <div className="loans-list">
          {loans.length === 0 ? (
            <p className="text-muted-foreground">No loans found</p>
          ) : (
            loans.map(loan => (
              <div key={loan.loan_id} className="loan-item border p-4 rounded-lg mb-4 bg-card">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {loan.item_title || 'Unknown Item'}
                </h3>
                {user && user.user_type === 'staff' && (
                  <p className="text-muted-foreground text-sm mb-1">Loan ID: {loan.loan_id}</p>
                )}
                <p className="text-muted-foreground mb-1">Status: {loan.status}</p>
                <p className="text-muted-foreground mb-3">Due Date: {new Date(loan.due_date).toLocaleDateString()}</p>

                {loan.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const userData = JSON.parse(localStorage.getItem('user'));
                        const headers = {
                          'Content-Type': 'application/json',
                          'x-user-type': userData.user_type,
                          'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
                        };

                        const response = await fetch(`https://librarydb.duckdns.org/api/loans/${loan.loan_id}`, {
                          method: 'DELETE',
                          headers
                        });

                        if (response.ok) {
                          alert(`"${loan.item_title}" has been returned successfully!`);
                          // Refresh loans list
                          fetch('https://librarydb.duckdns.org/api/loans', { headers })
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Fines({ user }) {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const headers = {};
    if (user) {
      headers['x-user-type'] = user.user_type;
      headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
    }

    fetch('https://librarydb.duckdns.org/api/fines', { headers })
      .then(res => res.json())
      .then(data => {
        setFines(data || []);
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
        <div className="fines-list">
          {fines.length === 0 ? (
            <p className="text-muted-foreground">No fines found</p>
          ) : (
            fines.map(fine => (
              <div key={fine.fine_id} className="fine-item border p-4 rounded-lg mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  ${fine.amount} Fine - {fine.item_title || 'Unknown Item'}
                </h3>
                {user?.user_type === 'staff' && (
                  <p className="text-gray-500 text-sm mb-1">Fine ID: {fine.fine_id}</p>
                )}
                <p className="text-gray-600 mb-1">Reason: {fine.reason}</p>
                <p className="text-gray-600 mb-1">Status: {fine.payment_status}</p>
                {user?.user_type === 'staff' && (
                  <p className="text-gray-600 mb-1">Member: {fine.member_name}</p>
                )}
                {fine.payment_status === 'unpaid' && (
                  <Button
                    className="mt-2"
                    onClick={async () => {
                      try {
                        const user = JSON.parse(localStorage.getItem('user'));
                        const headers = {
                          'Content-Type': 'application/json',
                          'x-user-type': user.user_type,
                          'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
                        };

                        const response = await fetch(`https://librarydb.duckdns.org/api/fines/${fine.fine_id}`, {
                          method: 'PATCH',
                          headers,
                          body: JSON.stringify({ payment_status: 'paid' })
                        });

                        if (response.ok) {
                          // Refresh fines list
                          const finesResponse = await fetch('https://librarydb.duckdns.org/api/fines', { headers });
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App
