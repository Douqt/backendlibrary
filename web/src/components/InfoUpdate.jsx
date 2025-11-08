// InfoUpdate.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { UserCog } from 'lucide-react';

const API_BASE_URL = 'https://librarydb.duckdns.org/api';
// TODO: Replace `/users/me` with the actual route your backend exposes
// for fetching/updating the currently logged-in user's info.
const USER_INFO_ENDPOINT = `${API_BASE_URL}/users/me`;  //ADJUST THIS TO FIT ACTUAL API 

const InfoUpdate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // These are example attributes – adjust to match your actual schema.
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch user info when the pop-up is opened
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setError('');
        setSuccessMessage('');
        setIsFetching(true);

        const response = await fetch(USER_INFO_ENDPOINT, {
          credentials: 'include', // if you use cookies/session
        });

        if (!response.ok) {
          throw new Error(`Failed to load user info (status ${response.status})`);
        }

        const data = await response.json();

        // Adjust keys here to match the JSON shape returned by your API
        setUserInfo({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
        });
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('Unable to load your information. Please try again later.');
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAlter = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(USER_INFO_ENDPOINT, {
        method: 'PUT', // or 'PATCH' depending on your backend
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // if you use cookies/session
        body: JSON.stringify(userInfo),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user info (status ${response.status})`);
      }

      // Optionally, you can read updated data from response.json()
      // const updated = await response.json();
      setSuccessMessage('Your information has been updated successfully.');
    } catch (err) {
      console.error('Error updating user info:', err);
      setError('Unable to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setError('');
    setSuccessMessage('');
  };

  return (
    <section className="py-20 px-4 w-full" id="account-info">
      <div className="max-w-3xl mx-auto w-full">
        {/* Main card with button to open the pop-up */}
        <Card className="bg-gradient-card border-border animate-fade-in">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex p-3 rounded-xl bg-primary/10">
                <UserCog className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-1 text-foreground">
                  Your Account Information
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  View and update the personal details used for reservations, checkouts,
                  and notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="ml-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm md:text-base"
            >
              Open Info
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Pop-up (modal) with user information and "Alter" button at bottom-right */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg relative animate-fade-in">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Your Information
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review and update your details. Changes will be saved to your library
                    account in the backend MySQL database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="ml-4 text-muted-foreground hover:text-foreground text-xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Body / form */}
              {isFetching ? (
                <p className="text-sm text-muted-foreground">Loading your information...</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={userInfo.firstName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={userInfo.lastName}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={userInfo.email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={userInfo.phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={userInfo.address}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Error / success messages */}
              {error && (
                <p className="mt-4 text-sm text-destructive">
                  {error}
                </p>
              )}
              {successMessage && (
                <p className="mt-4 text-sm text-emerald-500">
                  {successMessage}
                </p>
              )}

              {/* Footer with "Alter" button on bottom-right */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAlter}
                  disabled={isSaving || isFetching}
                  className="ml-auto px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 disabled:opacity-60 text-sm"
                >
                  {isSaving ? 'Saving…' : 'Alter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default InfoUpdate;
