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
import AddItems from './components/AddItems';
import Staff from './components/Staff';
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
            <Route path="/add-items" element={
              user?.user_type === 'staff' ? <AddItems user={user} /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in as staff to add items.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/reports" element={
              user?.user_type === 'staff' ? <AdminSUMM_Report /> : (
                <div className="py-20 px-4 w-full">
                  <div className="max-w-7xl mx-auto w-full text-center">
                    <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
                    <p className="text-muted-foreground mb-4">You need to be logged in as staff to view reports.</p>
                    <Button onClick={openLoginModal}>Sign In</Button>
                  </div>
                </div>
              )
            } />
            <Route path="/staff" element={
              user?.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') ? <Staff /> : (
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

function Fines({ user }) {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
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

  // Update filtered members when fines or search query changes
  useEffect(() => {
    if (user?.user_type === 'staff') {
      // Group fines by member
      const finesByMember = {};
      fines.forEach(fine => {
        const memberKey = `${fine.member_name} (${fine.member_email})`;
        if (!finesByMember[memberKey]) {
          finesByMember[memberKey] = {
            memberName: fine.member_name,
            memberEmail: fine.member_email,
            fines: []
          };
        }
        finesByMember[memberKey].fines.push(fine);
      });

      // Sort members alphabetically
      let sortedMembers = Object.keys(finesByMember).sort();

      // Filter based on search query
      if (searchQuery.trim() !== '') {
        sortedMembers = sortedMembers.filter(memberKey => {
          const memberData = finesByMember[memberKey];
          return memberData.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 memberData.memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
        });
      }

      setFilteredMembers(sortedMembers.map(key => ({ key, ...finesByMember[key] })));
    }
  }, [fines, searchQuery, user?.user_type]);

  const handlePayFine = (fine) => {
    setSelectedFine(fine);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalOpen(false);
    setSelectedFine(null);
    fetchFines();
  };

  if (loading) {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-4xl font-bold mb-8 text-foreground">
            {user?.user_type === 'staff' ? 'Fines Management' : 'My Fines'}
          </h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-4xl font-bold mb-8 text-foreground">
            {user?.user_type === 'staff' ? 'Fines Management' : 'My Fines'}
          </h2>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  // For staff: Group fines by member
  if (user?.user_type === 'staff') {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Fines Management</h2>
            <p className="text-muted-foreground mb-6">Search and manage member fines</p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                placeholder="Search by member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
              />
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear
              </Button>
            </div>

            <Button variant="outline" asChild className="float-right">
              <a href="/payment-history">View Payment History</a>
            </Button>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                {fines.length === 0 ? 'No fines found' : 'No members match your search'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} className="mt-4">
                  Clear Search
                </Button>
              )}
              {fines.length === 0 && (
                <p className="text-muted-foreground mt-2">Great job staying current with your payments!</p>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredMembers.map(memberData => {
                const memberFines = memberData.fines;
                const unpaidFines = memberFines.filter(fine => fine.payment_status === 'unpaid');
                const paidFines = memberFines.filter(fine => fine.payment_status === 'paid');

                return (
                  <div key={memberData.key} className="border border-border rounded-lg p-6 bg-card">
                    <div className="mb-6 pb-4 border-b border-border">
                      <h3 className="text-xl font-semibold text-foreground">{memberData.memberName}</h3>
                      <p className="text-muted-foreground">{memberData.memberEmail}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-red-600 font-medium">{unpaidFines.length} Unpaid</span>
                        <span className="text-green-600 font-medium">{paidFines.length} Paid</span>
                      </div>
                    </div>

                    {/* Unpaid Fines */}
                    {unpaidFines.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-4 text-foreground">Unpaid Fines</h4>
                        <div className="space-y-3">
                          {unpaidFines.map(fine => (
                            <div key={fine.fine_id} className="border border-border rounded-lg p-4 bg-background hover:shadow-sm transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                  <h5 className="font-medium text-foreground mb-1">${fine.amount} Fine - {fine.item_title || 'Unknown Item'}</h5>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>Fine ID: {fine.fine_id}</span>
                                    <span>Reason: {fine.reason}</span>
                                    <span>Created: {new Date(fine.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handlePayFine(fine)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Pay Fine
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Paid Fines */}
                    {paidFines.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium mb-4 text-foreground">Paid Fines</h4>
                        <div className="space-y-3">
                          {paidFines.map(fine => (
                            <div key={fine.fine_id} className="border border-border rounded-lg p-4 bg-muted/20">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">${fine.amount} - {fine.item_title || 'Unknown Item'}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Paid: {new Date(fine.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                  Paid
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {paymentModalOpen && selectedFine && (
            <PaymentModal
              fine={selectedFine}
              onClose={() => {
                setPaymentModalOpen(false);
                setSelectedFine(null);
              }}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </div>
    );
  }

  // For members: Show their own fines
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-4xl font-bold text-foreground">My Fines</h2>
          <Button variant="outline" asChild>
            <a href="/payment-history">View Payment History</a>
          </Button>
        </div>

        <div className="space-y-4">
          {fines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No fines found</p>
              <p className="text-muted-foreground mt-2">Great job staying current with your payments!</p>
            </div>
          ) : (
            fines.map(fine => (
              <div key={fine.fine_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      ${fine.amount} Fine - {fine.item_title || 'Unknown Item'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Reason: {fine.reason}, Status: {fine.payment_status}, Created: {new Date(fine.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {fine.payment_status === 'unpaid' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePayFine(fine)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Pay Fine
                    </Button>
                  )}
                  {fine.payment_status === 'paid' && (
                    <Badge className="bg-green-100 text-green-800">
                      Paid
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {paymentModalOpen && selectedFine && (
          <PaymentModal
            fine={selectedFine}
            onClose={() => {
              setPaymentModalOpen(false);
              setSelectedFine(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}

function Loans({ user }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);

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

  // Update filtered members when loans or search query changes
  useEffect(() => {
    if (user?.user_type === 'staff') {
      // Group loans by member
      const loansByMember = {};
      loans.forEach(loan => {
        const memberKey = `${loan.member_name} (${loan.member_email})`;
        if (!loansByMember[memberKey]) {
          loansByMember[memberKey] = {
            memberName: loan.member_name,
            memberEmail: loan.member_email,
            loans: []
          };
        }
        loansByMember[memberKey].loans.push(loan);
      });

      // Sort members alphabetically
      let sortedMembers = Object.keys(loansByMember).sort();

      // Filter based on search query
      if (searchQuery.trim() !== '') {
        sortedMembers = sortedMembers.filter(memberKey => {
          const memberData = loansByMember[memberKey];
          return memberData.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 memberData.memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
        });
      }

      setFilteredMembers(sortedMembers.map(key => ({ key, ...loansByMember[key] })));
    }
  }, [loans, searchQuery, user?.user_type]);

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">
          {user?.user_type === 'staff' ? 'Loans Management' : 'My Loans'}
        </h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">
          {user?.user_type === 'staff' ? 'Loans Management' : 'My Loans'}
        </h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  // For staff: Group loans by member
  if (user?.user_type === 'staff') {
    const handleReturnItem = async (loan) => {
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
    };

    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Loans Management</h2>
            <p className="text-muted-foreground mb-6">Search and manage member loans</p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                placeholder="Search by member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
              />
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear
              </Button>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                {loans.length === 0 ? 'No loans found' : 'No members match your search'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredMembers.map(memberData => {
                const memberLoans = memberData.loans;
                const activeLoans = memberLoans.filter(loan => !loan.return_ts && loan.status !== 'returned');
                const returnedLoans = memberLoans.filter(loan => loan.return_ts || loan.status === 'returned');

                return (
                  <div key={memberData.key} className="border border-border rounded-lg p-6 bg-card">
                    <div className="mb-6 pb-4 border-b border-border">
                      <h3 className="text-xl font-semibold text-foreground">{memberData.memberName}</h3>
                      <p className="text-muted-foreground">{memberData.memberEmail}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-blue-600 font-medium">{activeLoans.length} Active</span>
                        <span className="text-green-600 font-medium">{returnedLoans.length} Returned</span>
                      </div>
                    </div>

                    {/* Active Loans */}
                    {activeLoans.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-4 text-foreground">Active Loans</h4>
                        <div className="space-y-3">
                          {activeLoans.map(loan => (
                            <div key={loan.loan_id} className="border border-border rounded-lg p-4 bg-background hover:shadow-sm transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                  <h5 className="font-medium text-foreground mb-1">{loan.item_title || 'Unknown Item'}</h5>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>Loan ID: {loan.loan_id}</span>
                                    <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                                    <span>Status: <span className={`font-medium ${loan.status === 'active' ? 'text-green-600' : loan.status === 'overdue' ? 'text-red-600' : 'text-gray-600'}`}>{loan.status}</span></span>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReturnItem(loan)}
                                >
                                  Return Item
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Returned Loans */}
                    {returnedLoans.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium mb-4 text-foreground">Returned Loans</h4>
                        <div className="space-y-3">
                          {returnedLoans.map(loan => (
                            <div key={loan.loan_id} className="border border-border rounded-lg p-4 bg-muted/20">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{loan.item_title || 'Unknown Item'}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Returned: {new Date(loan.return_ts).toLocaleDateString()}
                                  </span>
                                </div>
                                <Badge className="bg-green-100 text-green-800">
                                  Returned
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For members: Show their own loans
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

function HoldRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update filtered members when requests or search query changes
  useEffect(() => {
    if (user?.user_type === 'staff') {
      // Group holds by member
      const holdsByMember = {};
      requests.forEach(request => {
        const memberKey = `${request.member_name} (${request.member_email})`;
        if (!holdsByMember[memberKey]) {
          holdsByMember[memberKey] = {
            memberName: request.member_name,
            memberEmail: request.member_email,
            holds: []
          };
        }
        holdsByMember[memberKey].holds.push(request);
      });

      // Sort members alphabetically
      let sortedMembers = Object.keys(holdsByMember).sort();

      // Filter based on search query
      if (searchQuery.trim() !== '') {
        sortedMembers = sortedMembers.filter(memberKey => {
          const memberData = holdsByMember[memberKey];
          return memberData.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 memberData.memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
        });
      }

      setFilteredMembers(sortedMembers.map(key => ({ key, ...holdsByMember[key] })));
    }
  }, [requests, searchQuery, user?.user_type]);

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

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">
          {user?.user_type === 'staff' ? 'Holds Management' : 'My Holds'}
        </h2>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">
          {user?.user_type === 'staff' ? 'Holds Management' : 'My Holds'}
        </h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  // For staff: Group holds by member
  if (user?.user_type === 'staff') {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Holds Management</h2>
            <p className="text-muted-foreground mb-6">Search and manage member holds</p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-md mb-6">
              <input
                type="text"
                placeholder="Search by member name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
              />
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Clear
              </Button>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                {requests.length === 0 ? 'No hold requests found' : 'No members match your search'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {filteredMembers.map(memberData => {
                const memberHolds = memberData.holds;
                const activeHolds = memberHolds.filter(hold => hold.status === 'pending');
                const completedHolds = memberHolds.filter(hold => hold.status !== 'pending');

                return (
                  <div key={memberData.key} className="border border-border rounded-lg p-6 bg-card">
                    <div className="mb-6 pb-4 border-b border-border">
                      <h3 className="text-xl font-semibold text-foreground">{memberData.memberName}</h3>
                      <p className="text-muted-foreground">{memberData.memberEmail}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-yellow-600 font-medium">{activeHolds.length} Active</span>
                        <span className="text-green-600 font-medium">{completedHolds.length} Completed</span>
                      </div>
                    </div>

                    {/* Active Holds */}
                    {activeHolds.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-medium mb-4 text-foreground">Active Holds</h4>
                        <div className="space-y-3">
                          {activeHolds
                            .sort((a, b) => a.queue_position - b.queue_position) // Sort by queue position
                            .map(hold => (
                            <div key={hold.request_id} className="border border-border rounded-lg p-4 bg-background hover:shadow-sm transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                  <h5 className="font-medium text-foreground mb-1">{hold.item_title || 'Unknown Item'}</h5>
                                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span>Queue Position: {hold.queue_position}</span>
                                    <span>Priority Score: {hold.priority_score}</span>
                                    <span>Requested: {new Date(hold.request_date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  Pending
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Holds */}
                    {completedHolds.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium mb-4 text-foreground">Completed Holds</h4>
                        <div className="space-y-3">
                          {completedHolds
                            .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)) // Sort by date
                            .map(hold => (
                            <div key={hold.request_id} className="border border-border rounded-lg p-4 bg-muted/20">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{hold.item_title || 'Unknown Item'}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Completed: {new Date(hold.updated_at || hold.request_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <Badge className={`${
                                  hold.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                                  hold.status === 'canceled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {hold.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For members: Show their own holds
  // Separate and sort active and completed holds
  const activeHolds = requests
    .filter(request => request.status === 'pending')
    .sort((a, b) => a.queue_position - b.queue_position); // Sort by queue position (lowest first)

  const completedHolds = requests
    .filter(request => request.status !== 'pending')
    .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)); // Sort by date (newest first)

  const renderHoldCard = (request) => (
    <div key={request.request_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {request.item_title || 'Unknown Item'}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Queue Position: {request.queue_position}</span>
            <span>Priority Score: {request.priority_score}</span>
            <span>Requested: {new Date(request.request_date).toLocaleDateString()}</span>
            {request.status !== 'pending' && (
              <span>Completed: {new Date(request.updated_at || request.request_date).toLocaleDateString()}</span>
            )}
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
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">My Holds</h2>

        {/* Active Holds Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-foreground">Active Holds ({activeHolds.length})</h3>
          {activeHolds.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">No active hold requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeHolds.map(renderHoldCard)}
            </div>
          )}
        </div>

        {/* Completed Holds Section */}
        {completedHolds.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-foreground">Hold History ({completedHolds.length})</h3>
            <div className="space-y-4">
              {completedHolds.map(renderHoldCard)}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No hold requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Members() {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Filter members based on search query
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.member_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [members, searchQuery]);

  const fetchMembers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {};
      if (user) {
        headers['x-user-type'] = user.user_type;
        headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
      }

      const response = await fetch(`${API_BASE_URL}/members`, { headers });
      const data = await response.json();
      setMembers(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId) => {
    setDetailsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': user.user_type,
        'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
      };

      // Fetch member details, loans, fines, and holds in parallel
      const [memberRes, loansRes, finesRes, holdsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/members/${memberId}`, { headers }),
        fetch(`${API_BASE_URL}/loans?member_id=${memberId}`, { headers }),
        fetch(`${API_BASE_URL}/fines?member_id=${memberId}`, { headers }),
        fetch(`${API_BASE_URL}/hold-requests?member_id=${memberId}`, { headers })
      ]);

      const [memberData, loansData, finesData, holdsData] = await Promise.all([
        memberRes.json(),
        loansRes.json(),
        finesRes.json(),
        holdsRes.json()
      ]);

      setMemberDetails({
        member: memberData.data,
        loans: loansData.data || [],
        fines: finesData || [],
        holds: holdsData.data || []
      });
    } catch (error) {
      console.error('Error fetching member details:', error);
      setError('Failed to load member details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
    fetchMemberDetails(member.member_id);
  };

  const handleBackToList = () => {
    setSelectedMember(null);
    setMemberDetails(null);
  };

  const handleMemberTypeChange = async (memberId, newType) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          member_name: memberDetails.member.member_name,
          member_email: memberDetails.member.member_email,
          member_type: newType
        })
      });

      if (response.ok) {
        // Update the local state
        setMemberDetails(prev => ({
          ...prev,
          member: {
            ...prev.member,
            member_type: newType
          }
        }));
        // Also update the selected member
        setSelectedMember(prev => ({
          ...prev,
          member_type: newType
        }));
        alert(`Member type updated to ${newType.charAt(0).toUpperCase() + newType.slice(1)} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to update member type: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating member type:', error);
      alert('Network error occurred while updating member type');
    }
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Members Management</h2>
        <p className="text-muted-foreground">Loading members...</p>
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

  // Show detailed member view
  if (selectedMember && memberDetails) {
    const { member, loans, fines, holds } = memberDetails;

    // Separate active and returned loans
    const activeLoans = loans.filter(loan => !loan.return_ts && loan.status !== 'returned');
    const returnedLoans = loans.filter(loan => loan.return_ts || loan.status === 'returned');

    // Separate paid and unpaid fines
    const unpaidFines = fines.filter(fine => fine.payment_status === 'unpaid');
    const paidFines = fines.filter(fine => fine.payment_status === 'paid');

    // Separate active and fulfilled holds, and sort them
    const activeHolds = holds
      .filter(hold => hold.status === 'pending')
      .sort((a, b) => a.queue_position - b.queue_position); // Sort by queue position (lowest first)

    const completedHolds = holds
      .filter(hold => hold.status !== 'pending')
      .sort((a, b) => new Date(b.request_date) - new Date(a.request_date)); // Sort by date (newest first)

    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8 flex items-center gap-4">
            <Button onClick={handleBackToList} variant="outline">
              ← Back to Members
            </Button>
            <div>
              <h2 className="text-4xl font-bold text-foreground">{member.member_name}</h2>
              <p className="text-muted-foreground">{member.member_email}</p>
            </div>
          </div>

          {detailsLoading ? (
            <p className="text-muted-foreground">Loading member details...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Member Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Member Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Member Type:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.member_type}
                        onChange={(e) => handleMemberTypeChange(member.member_id, e.target.value)}
                        className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white text-gray-900"
                        disabled={detailsLoading}
                      >
                        <option value="local">Local</option>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                      </select>
                      {member.member_type !== 'local' && (
                        <Badge className={`${
                          member.member_type === 'faculty' ? 'bg-purple-100 text-purple-800' :
                          member.member_type === 'student' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {member.member_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${member.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Join Date:</span>
                    <span className="font-medium">{new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Loans:</span>
                    <span className="font-medium">{member.num_loans}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{activeLoans.length}</div>
                    <div className="text-sm text-muted-foreground">Active Loans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{unpaidFines.length}</div>
                    <div className="text-sm text-muted-foreground">Unpaid Fines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{activeHolds.length}</div>
                    <div className="text-sm text-muted-foreground">Active Holds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{returnedLoans.length}</div>
                    <div className="text-sm text-muted-foreground">Returned Items</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Loans */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Active Loans ({activeLoans.length})</h3>
            {activeLoans.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No active loans</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLoans.map(loan => (
                  <div key={loan.loan_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-1">
                          {loan.item_title || 'Unknown Item'}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Loan ID: {loan.loan_id}</span>
                          <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>
                          <span>Status: <span className={`font-medium ${loan.status === 'active' ? 'text-green-600' : loan.status === 'overdue' ? 'text-red-600' : 'text-gray-600'}`}>{loan.status}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unpaid Fines */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Unpaid Fines ({unpaidFines.length})</h3>
            {unpaidFines.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No unpaid fines</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidFines.map(fine => (
                  <div key={fine.fine_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-1">
                          ${fine.amount} Fine - {fine.item_title || 'Unknown Item'}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Fine ID: {fine.fine_id}</span>
                          <span>Reason: {fine.reason}</span>
                          <span>Created: {new Date(fine.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        Unpaid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Holds */}
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">Active Holds ({activeHolds.length})</h3>
            {activeHolds.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">No active holds</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeHolds.map(hold => (
                  <div key={hold.request_id} className="border border-border rounded-lg p-6 bg-card hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-foreground mb-1">
                          {hold.item_title || 'Unknown Item'}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Queue Position: {hold.queue_position}</span>
                          <span>Priority Score: {hold.priority_score}</span>
                          <span>Requested: {new Date(hold.request_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Sections */}
          {(returnedLoans.length > 0 || paidFines.length > 0 || completedHolds.length > 0) && (
            <div className="mt-12">
              <h3 className="text-3xl font-semibold mb-8 text-foreground">History</h3>

              {/* Returned Loans History */}
              {returnedLoans.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold mb-4 text-foreground">Loan History ({returnedLoans.length})</h4>
                  <div className="space-y-4">
                    {returnedLoans.slice(0, 5).map(loan => (
                      <div key={loan.loan_id} className="border border-border rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{loan.item_title || 'Unknown Item'}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              Returned: {new Date(loan.return_ts).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Returned
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paid Fines History */}
              {paidFines.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold mb-4 text-foreground">Fine History ({paidFines.length})</h4>
                  <div className="space-y-4">
                    {paidFines.slice(0, 5).map(fine => (
                      <div key={fine.fine_id} className="border border-border rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">${fine.amount} - {fine.item_title || 'Unknown Item'}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              Paid: {new Date(fine.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Holds History */}
              {completedHolds.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-xl font-semibold mb-4 text-foreground">Hold History ({completedHolds.length})</h4>
                  <div className="space-y-4">
                    {completedHolds.slice(0, 5).map(hold => (
                      <div key={hold.request_id} className="border border-border rounded-lg p-4 bg-muted/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{hold.item_title || 'Unknown Item'}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              Completed: {new Date(hold.request_date).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge className={`${
                            hold.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                            hold.status === 'canceled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {hold.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show members list
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Members Management</h2>
          <p className="text-muted-foreground mb-6">Search and manage library members</p>

          {/* Search Bar */}
          <div className="flex gap-2 max-w-md mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
            />
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                {members.length === 0 ? 'No members found' : 'No members match your search'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            filteredMembers.map(member => (
              <div
                key={member.member_id}
                className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleMemberClick(member)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{member.member_name}</h3>
                    <p className="text-muted-foreground text-sm">{member.member_email}</p>
                  </div>
                  <Badge className={`${
                    member.member_type === 'faculty' ? 'bg-purple-100 text-purple-800' :
                    member.member_type === 'student' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {member.member_type}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${member.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                      {member.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loans:</span>
                    <span className="font-medium">{member.num_loans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{new Date(member.join_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Click to view detailed information</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App
