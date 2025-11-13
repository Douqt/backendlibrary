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
          <h2 className="text-4xl font-bold mb-8 text-foreground">Fines Management</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <h2 className="text-4xl font-bold mb-8 text-foreground">Fines Management</h2>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-4xl font-bold text-foreground">Fines Management</h2>
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

export default App
