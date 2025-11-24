import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    member_type: '',
    join_date: '',
    num_loans: 0,
    status: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    member_type: ''
  });

  // Type change request states
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false);
  const [typeChangeRequests, setTypeChangeRequests] = useState([]);
  const [typeChangeForm, setTypeChangeForm] = useState({
    requested_type: '',
    request_reason: ''
  });



  useEffect(() => {
    fetchProfile();
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    // Only fetch type change requests for members
    if (userData.user_type === 'member') {
      fetchTypeChangeRequests();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      // Use different endpoints based on user type
      const endpoint = userData.user_type === 'staff'
        ? `${API_BASE_URL}/staff/${userData.staff_id}`
        : `${API_BASE_URL}/members/${userData.member_id}`;

      const response = await fetch(endpoint, { headers });

      if (response.ok) {
        const data = await response.json();

        // Handle different data structures for staff vs members
        if (userData.user_type === 'staff') {
          setProfileData({
            name: data.data.name,
            email: data.data.email,
            position: data.data.position,
            branch_id: data.data.branch_id,
            branch_name: data.data.branch_name,
            hourly: data.data.hourly,
            hire_date: data.data.hire_date,
            staff_id: data.data.staff_id
          });
          setEditForm({
            name: data.data.name,
            email: data.data.email,
            position: data.data.position
          });
        } else {
          setProfileData(data.data);
          setEditForm({
            name: data.data.member_name,
            email: data.data.member_email,
            member_type: data.data.member_type
          });
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to load profile: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeChangeRequests = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/member-type-requests?member_id=${userData.member_id}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setTypeChangeRequests(data);
      }
    } catch (error) {
      console.error('Error fetching type change requests:', error);
    }
  };

  const handleSubmitTypeChangeRequest = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/member-type-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: userData.member_id,
          requested_type: typeChangeForm.requested_type,
          request_reason: typeChangeForm.request_reason
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Type change request submitted successfully!');
        setShowTypeChangeModal(false);
        setTypeChangeForm({ requested_type: '', request_reason: '' });
        await fetchTypeChangeRequests();
      } else {
        toast.error(data.error || 'Failed to submit type change request');
      }
    } catch (error) {
      console.error('Error submitting type change request:', error);
      toast.error('Network error occurred');
    }
  };

  const getUserData = () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  };

  const isStaff = () => {
    return getUserData().user_type === 'staff';
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    const userData = getUserData();
    if (userData.user_type === 'staff') {
      setEditForm({
        name: profileData.name,
        email: profileData.email,
        position: profileData.position
      });
    } else {
      setEditForm({
        name: profileData.member_name,
        email: profileData.member_email,
        member_type: profileData.member_type
      });
    }
  };

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      // Use different endpoints and data structures based on user type
      const endpoint = userData.user_type === 'staff'
        ? `${API_BASE_URL}/staff/${userData.staff_id}`
        : `${API_BASE_URL}/members/${userData.member_id}`;

      const updateData = userData.user_type === 'staff'
        ? {
            name: editForm.name,
            email: editForm.email,
            position: editForm.position
          }
        : {
            member_name: editForm.name,
            member_email: editForm.email,
            member_type: editForm.member_type
          };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        fetchProfile(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">My Profile</h2>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">My Profile</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-foreground">My Profile</h2>
          <p className="text-muted-foreground mt-2">View and manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-foreground">Account Information</h3>
                {!isEditing && (
                  <Button onClick={handleEdit} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                      />
                    ) : (
                      <p className="text-foreground">{isStaff() ? profileData.name : profileData.member_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                      />
                    ) : (
                      <p className="text-foreground">{isStaff() ? profileData.email : profileData.member_email}</p>
                    )}
                  </div>

                  {isStaff() ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Position</label>
                        {isEditing ? (
                          <select
                            name="position"
                            value={editForm.position}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                          >
                            <option value="associate">Associate</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <p className="text-foreground capitalize">{profileData.position}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Branch</label>
                        <p className="text-foreground">{profileData.branch_name || `Branch ${profileData.branch_id}`}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Hourly Rate</label>
                        <p className="text-foreground">${profileData.hourly}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Hire Date</label>
                        <p className="text-foreground">{profileData.hire_date ? new Date(profileData.hire_date).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Member Type</label>
                        <div className="flex items-center gap-2">
                          <p className="text-foreground capitalize">{profileData.member_type}</p>
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowTypeChangeModal(true)}
                              disabled={typeChangeRequests.some(r => ['pending', 'under_review'].includes(r.status))}
                            >
                              Request Change
                            </Button>
                          )}
                        </div>
                        {typeChangeRequests.length > 0 && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <div className="font-semibold text-blue-900 mb-1">Type Change Requests</div>
                            {typeChangeRequests.map(req => (
                              <div key={req.request_id} className="text-xs text-blue-800 flex justify-between items-center">
                                <span>
                                  {req.current_type} → {req.requested_type}:
                                  <span className={`ml-2 px-2 py-0.5 rounded ${
                                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    req.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                    req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {req.status}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Account Status</label>
                        <p className="text-foreground">{profileData.status}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Join Date</label>
                        <p className="text-foreground">{new Date(profileData.join_date).toLocaleDateString()}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Total Loans</label>
                        <p className="text-foreground">{profileData.num_loans}</p>
                      </div>
                    </>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Summary */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Summary</h3>
              <div className="space-y-3">
                {isStaff() ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="font-medium capitalize">{profileData.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-medium">{profileData.branch_name || `Branch ${profileData.branch_id}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <span className="font-medium">${profileData.hourly}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member Type:</span>
                      <span className="font-medium capitalize">{profileData.member_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Limit:</span>
                      <span className="font-medium">
                        {profileData.member_type === 'faculty' ? '10' : profileData.member_type === 'student' ? '5' : '3'} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Loans:</span>
                      <span className="font-medium">{profileData.num_loans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${profileData.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                        {profileData.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isStaff() && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/loans">View My Loans</a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/holds">Manage Holds</a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/fines">View Fines</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type Change Request Modal - Only for Members */}
      {!isStaff() && showTypeChangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Request Member Type Change</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Type</label>
                <input
                  type="text"
                  value={profileData.member_type}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 capitalize"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Requested Type</label>
                <select
                  value={typeChangeForm.requested_type}
                  onChange={(e) => setTypeChangeForm({...typeChangeForm, requested_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  {['local', 'student', 'faculty']
                    .filter(t => t !== profileData.member_type)
                    .map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Request</label>
                <textarea
                  value={typeChangeForm.request_reason}
                  onChange={(e) => setTypeChangeForm({...typeChangeForm, request_reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Please explain why you are requesting this type change..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTypeChangeModal(false);
                    setTypeChangeForm({ requested_type: '', request_reason: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitTypeChangeRequest}
                  disabled={!typeChangeForm.requested_type || !typeChangeForm.request_reason}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
