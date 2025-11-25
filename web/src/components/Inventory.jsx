import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const Inventory = ({ user }) => {
  const [activeTab, setActiveTab] = useState('books');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableFilter, setAvailableFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchItems(activeTab);
  }, [activeTab, searchQuery, availableFilter, branchFilter]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/branches`);
      const data = await response.json();
      setBranches(data.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchItems = async (type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (availableFilter !== 'all') params.append('available', availableFilter);
      if (branchFilter !== 'all') params.append('branch_id', branchFilter);

      const response = await fetch(`${API_BASE_URL}/${type}?${params}`);
      const data = await response.json();
      setItems(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'articles', label: 'Articles', icon: '📄' },
    { id: 'electronics', label: 'Electronics', icon: '💻' }
  ];

  if (!user || user.user_type !== 'staff') {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full text-center">
          <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in as staff to manage inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground">View and manage library items</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={availableFilter}
              onChange={(e) => setAvailableFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
            >
              <option value="all">All Availability</option>
              <option value="true">Available Only</option>
              <option value="false">Unavailable Only</option>
            </select>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 min-w-[200px]"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name} - {branch.address}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => {
              const itemId = activeTab === 'books' ? item.book_id :
                            activeTab === 'movies' ? item.movie_id :
                            activeTab === 'articles' ? item.article_id :
                            item.electronics_id;
              const itemTitle = activeTab === 'electronics' ? item.device_name : item.title;

              return (
                <div key={itemId} className="border border-border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {itemTitle}
                    </h3>
                    <Badge className={`${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {activeTab === 'books' && (
                      <>
                        <p>Author(s): {item.authors || 'N/A'}</p>
                        <p>ISBN: {item.isbn || 'N/A'}</p>
                        <p>Copies: {item.copies}</p>
                      </>
                    )}
                    {activeTab === 'movies' && (
                      <>
                        <p>Director: {item.director_name || 'N/A'}</p>
                        <p>Release: {item.release_date || 'N/A'}</p>
                        <p>Copies: {item.copy_amount}</p>
                      </>
                    )}
                    {activeTab === 'articles' && (
                      <>
                        <p>Author(s): {item.authors || 'N/A'}</p>
                        <p>ISSN: {item.issn || 'N/A'}</p>
                        <p>Copies: {item.copies}</p>
                      </>
                    )}
                    {activeTab === 'electronics' && (
                      <>
                        <p>Maker: {item.maker || 'N/A'}</p>
                        <p>Serial: {item.serial_num || 'N/A'}</p>
                        <p>Copies: {item.copy_amount}</p>
                      </>
                    )}
                    <p>Branch: {item.branch_name}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
