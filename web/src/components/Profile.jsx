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



  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/members/${userData.member_id}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.data);
        setEditForm({
          name: data.data.member_name,
          email: data.data.member_email,
          member_type: data.data.member_type
        });
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

  const isStaff = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    return userData.user_type === 'staff';
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: profileData.member_name,
      email: profileData.member_email,
      member_type: profileData.member_type
    });
  };

  const handleSave = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const updateData = {
        member_name: editForm.name,
        member_email: editForm.email,
        member_type: editForm.member_type
      };

      const response = await fetch(`${API_BASE_URL}/members/${userData.member_id}`, {
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
                      <p className="text-foreground">{profileData.member_name}</p>
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
                      <p className="text-foreground">{profileData.member_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Member Type</label>
                    {isEditing && isStaff() ? (
                      <select
                        name="member_type"
                        value={editForm.member_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                      >
                        <option value="local">Local</option>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                      </select>
                    ) : (
                      <p className="text-foreground capitalize">{profileData.member_type}</p>
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
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
