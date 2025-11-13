import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_BASE_URL } from '../config';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetails, setStaffDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    branch_name: '',
    hourly: 15.00,
    position: 'associate',
    username: '',
    password: '',
    role: 'staff'
  });

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  useEffect(() => {
    // Filter staff based on search query
    if (searchQuery.trim() === '') {
      setFilteredStaff(staff);
    } else {
      const filtered = staff.filter(staffMember =>
        staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staffMember.branch_name && staffMember.branch_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStaff(filtered);
    }
  }, [staff, searchQuery]);

  const fetchStaff = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {};
      if (user) {
        headers['x-user-type'] = user.user_type;
        headers['x-user-id'] = user.user_type === 'member' ? user.member_id : user.staff_id;
      }

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
      console.log('Fetching branches...');
      const response = await fetch(`${API_BASE_URL}/branches`);
      const data = await response.json();
      console.log('Branches data:', data);
      setBranches(data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchStaffDetails = async (staffId) => {
    setDetailsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': user.user_type,
        'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, { headers });
      const data = await response.json();
      setStaffDetails(data.data);
    } catch (error) {
      console.error('Error fetching staff details:', error);
      setError('Failed to load staff details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStaffClick = (staffMember) => {
    setSelectedStaff(staffMember);
    fetchStaffDetails(staffMember.staff_id);
  };

  const handleBackToList = () => {
    setSelectedStaff(null);
    setStaffDetails(null);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      // Find the branch_id from the selected branch name
      const selectedBranch = branches.find(branch => branch.name === newStaff.branch_name);
      if (!selectedBranch) {
        alert('Please select a valid branch');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': user.user_type,
        'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
      };

      const staffData = {
        ...newStaff,
        branch_id: selectedBranch.branch_id
      };

      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers,
        body: JSON.stringify(staffData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Staff member created successfully!');
        setShowCreateForm(false);
        setNewStaff({
          name: '',
          email: '',
          branch_name: '',
          hourly: 15.00,
          position: 'associate',
          username: '',
          password: '',
          role: 'staff'
        });
        fetchStaff(); // Refresh the list
      } else {
        alert(`Failed to create staff member: ${data.message}`);
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      alert('Network error occurred while creating staff member');
    }
  };

  const handleTerminateStaff = async (staffId) => {
    if (!confirm('Are you sure you want to terminate this staff member?')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'x-user-type': user.user_type,
        'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        alert('Staff member terminated successfully!');
        fetchStaff(); // Refresh the list
        if (selectedStaff && selectedStaff.staff_id === staffId) {
          handleBackToList();
        }
      } else {
        const data = await response.json();
        alert(`Failed to terminate staff member: ${data.message}`);
      }
    } catch (error) {
      console.error('Error terminating staff:', error);
      alert('Network error occurred while terminating staff member');
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

  // Show detailed staff view
  if (selectedStaff && staffDetails) {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8 flex items-center gap-4">
            <Button onClick={handleBackToList} variant="outline">
              ← Back to Staff
            </Button>
            <div>
              <h2 className="text-4xl font-bold text-foreground">{staffDetails.name}</h2>
              <p className="text-muted-foreground">{staffDetails.email}</p>
            </div>
          </div>

          {detailsLoading ? (
            <p className="text-muted-foreground">Loading staff details...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Staff Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Staff Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <Badge className={`${
                      staffDetails.position === 'manager' ? 'bg-purple-100 text-purple-800' :
                      staffDetails.position === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {staffDetails.position}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium">{staffDetails.branch_name || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly Rate:</span>
                    <span className="font-medium">${staffDetails.hourly}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hire Date:</span>
                    <span className="font-medium">{new Date(staffDetails.hire_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    onClick={() => handleTerminateStaff(staffDetails.staff_id)}
                    className="w-full"
                  >
                    Terminate Staff Member
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    This action cannot be undone. The staff member will be marked as terminated.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show staff list
  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Staff Management</h2>
          <p className="text-muted-foreground mb-6">Search and manage library staff members</p>

          {/* Search Bar and Create Button */}
          <div className="flex gap-2 max-w-md mb-6">
            <input
              type="text"
              placeholder="Search by name, email, or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
            />
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear
            </Button>
          </div>

          <Button onClick={() => {
            setShowCreateForm(true);
            // Ensure branches are loaded when opening the form
            if (branches.length === 0) {
              fetchBranches();
            }
          }} className="mb-6">
            Add New Staff Member
          </Button>
        </div>

        {/* Create Staff Form */}
        {showCreateForm && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Add New Staff Member</h3>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Branch *</label>
                  <select
                    required
                    value={newStaff.branch_name}
                    onChange={(e) => setNewStaff({...newStaff, branch_name: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  >
                    <option value="">
                      {branches.length === 0 ? 'Loading branches...' : 'Select a branch...'}
                    </option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {branches.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {branches.length} branch{branches.length !== 1 ? 'es' : ''} available
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStaff.hourly}
                    onChange={(e) => setNewStaff({...newStaff, hourly: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Position</label>
                  <select
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({...newStaff, position: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  >
                    <option value="associate">Associate</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Username</label>
                  <input
                    type="text"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    placeholder="Leave blank to use email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                  <input
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    placeholder="Leave blank for default"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Staff Member</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                {staff.length === 0 ? 'No staff members found' : 'No staff members match your search'}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            filteredStaff.map(staffMember => (
              <div
                key={staffMember.staff_id}
                className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleStaffClick(staffMember)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{staffMember.name}</h3>
                    <p className="text-muted-foreground text-sm">{staffMember.email}</p>
                  </div>
                  <Badge className={`${
                    staffMember.position === 'manager' ? 'bg-purple-100 text-purple-800' :
                    staffMember.position === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {staffMember.position}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium">{staffMember.branch_name || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly:</span>
                    <span className="font-medium">${staffMember.hourly}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hired:</span>
                    <span className="font-medium">{new Date(staffMember.hire_date).toLocaleDateString()}</span>
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
};

export default Staff;
