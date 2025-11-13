import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const AddItems = ({ user }) => {
  const [activeTab, setActiveTab] = useState('books');
  const [branches, setBranches] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Modal states for adding new entities
  const [showPublisherModal, setShowPublisherModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [entityLoading, setEntityLoading] = useState(false);

  // Form states for each item type
  const [bookForm, setBookForm] = useState({
    branch_id: '',
    title: '',
    isbn: '',
    publication_year: '',
    publisher_id: '',
    version_type: 'physical',
    copies: '',
    available: true,
    section_descriptor: '',
    section_floor: '',
    author_ids: []
  });

  const [movieForm, setMovieForm] = useState({
    branch_id: '',
    title: '',
    isan: '',
    release_date: '',
    director_id: '',
    publisher_id: '',
    media_type: 'DVD',
    location_section: '',
    copy_amount: '',
    available: true
  });

  const [articleForm, setArticleForm] = useState({
    branch_id: '',
    title: '',
    issn: '',
    publisher_id: '',
    copies: '',
    available: true,
    author_ids: []
  });

  const [electronicsForm, setElectronicsForm] = useState({
    branch_id: '',
    device_name: '',
    serial_num: '',
    manufact_date: '',
    maker: '',
    copy_amount: '',
    available: true
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [branchesRes, publishersRes, authorsRes, directorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/branches`),
        fetch(`${API_BASE_URL}/publishers`),
        fetch(`${API_BASE_URL}/authors`),
        fetch(`${API_BASE_URL}/directors`)
      ]);

      const [branchesData, publishersData, authorsData, directorsData] = await Promise.all([
        branchesRes.json(),
        publishersRes.json(),
        authorsRes.json(),
        directorsRes.json()
      ]);

      setBranches(branchesData.data || []);
      setPublishers(publishersData.data || []);
      setAuthors(authorsData.data || []);
      setDirectors(directorsData.data || []);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleAddEntity = async (entityType, name) => {
    if (!name.trim()) return;

    setEntityLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${entityType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim() })
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh the reference data to include the new entity
        await fetchReferenceData();
        setNewEntityName('');
        setShowPublisherModal(false);
        setShowAuthorModal(false);
        setShowDirectorModal(false);
        setMessage(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} added successfully!`);
      } else {
        setMessage(result.message || `Error adding ${entityType}`);
      }
    } catch (error) {
      console.error(`Error adding ${entityType}:`, error);
      setMessage(`Network error occurred while adding ${entityType}`);
    } finally {
      setEntityLoading(false);
    }
  };

  const handleSubmit = async (e, itemType, formData) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/${itemType}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} added successfully!`);
        // Reset form
        if (itemType === 'books') {
          setBookForm({
            branch_id: '',
            title: '',
            isbn: '',
            publication_year: '',
            publisher_id: '',
            version_type: 'physical',
            copies: '',
            available: true,
            section_descriptor: '',
            section_floor: '',
            author_ids: []
          });
        } else if (itemType === 'movies') {
          setMovieForm({
            branch_id: '',
            title: '',
            isan: '',
            release_date: '',
            director_id: '',
            publisher_id: '',
            media_type: 'DVD',
            location_section: '',
            copy_amount: '',
            available: true
          });
        } else if (itemType === 'articles') {
          setArticleForm({
            branch_id: '',
            title: '',
            issn: '',
            publisher_id: '',
            copies: '',
            available: true,
            author_ids: []
          });
        } else if (itemType === 'electronics') {
          setElectronicsForm({
            branch_id: '',
            device_name: '',
            serial_num: '',
            manufact_date: '',
            maker: '',
            copy_amount: '',
            available: true
          });
        }
      } else {
        setMessage(result.message || 'Error adding item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setMessage('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'books', label: 'Add Book', icon: '📚' },
    { id: 'movies', label: 'Add Movie', icon: '🎬' },
    { id: 'articles', label: 'Add Article', icon: '📄' },
    { id: 'electronics', label: 'Add Electronics', icon: '💻' }
  ];

  if (!user || user.user_type !== 'staff') {
    return (
      <div className="py-20 px-4 w-full">
        <div className="max-w-7xl mx-auto w-full text-center">
          <h2 className="text-4xl font-bold mb-8 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in as staff to add items.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Add Library Items</h2>
          <p className="text-muted-foreground">Add new books, movies, articles, and electronics to the library collection</p>
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

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Books Form */}
        {activeTab === 'books' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Add New Book</h3>
            <form onSubmit={(e) => handleSubmit(e, 'books', bookForm)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Branch *</label>
                  <select
                    value={bookForm.branch_id}
                    onChange={(e) => setBookForm({...bookForm, branch_id: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Publication Year</label>
                  <input
                    type="number"
                    value={bookForm.publication_year}
                    onChange={(e) => setBookForm({...bookForm, publication_year: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Publisher</label>
                  <div className="flex gap-2">
                    <select
                      value={bookForm.publisher_id}
                      onChange={(e) => setBookForm({...bookForm, publisher_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    >
                      <option value="">Select Publisher</option>
                      {publishers.map(publisher => (
                        <option key={publisher.publisher_id} value={publisher.publisher_id}>
                          {publisher.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPublisherModal(true)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Version Type</label>
                  <select
                    value={bookForm.version_type}
                    onChange={(e) => setBookForm({...bookForm, version_type: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  >
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Copies *</label>
                  <input
                    type="number"
                    min="0"
                    value={bookForm.copies}
                    onChange={(e) => setBookForm({...bookForm, copies: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Section Descriptor *</label>
                  <input
                    type="text"
                    value={bookForm.section_descriptor}
                    onChange={(e) => setBookForm({...bookForm, section_descriptor: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Section Floor *</label>
                  <input
                    type="number"
                    value={bookForm.section_floor}
                    onChange={(e) => setBookForm({...bookForm, section_floor: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-6">
                  {loading ? 'Adding Book...' : 'Add Book'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Movies Form */}
        {activeTab === 'movies' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Add New Movie</h3>
            <form onSubmit={(e) => handleSubmit(e, 'movies', movieForm)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Branch *</label>
                  <select
                    value={movieForm.branch_id}
                    onChange={(e) => setMovieForm({...movieForm, branch_id: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
                  <input
                    type="text"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({...movieForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ISAN</label>
                  <input
                    type="text"
                    value={movieForm.isan}
                    onChange={(e) => setMovieForm({...movieForm, isan: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Release Date</label>
                  <input
                    type="date"
                    value={movieForm.release_date}
                    onChange={(e) => setMovieForm({...movieForm, release_date: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Director</label>
                  <div className="flex gap-2">
                    <select
                      value={movieForm.director_id}
                      onChange={(e) => setMovieForm({...movieForm, director_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    >
                      <option value="">Select Director</option>
                      {directors.map(director => (
                        <option key={director.director_id} value={director.director_id}>
                          {director.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDirectorModal(true)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Publisher</label>
                  <div className="flex gap-2">
                    <select
                      value={movieForm.publisher_id}
                      onChange={(e) => setMovieForm({...movieForm, publisher_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    >
                      <option value="">Select Publisher</option>
                      {publishers.map(publisher => (
                        <option key={publisher.publisher_id} value={publisher.publisher_id}>
                          {publisher.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPublisherModal(true)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Media Type</label>
                  <select
                    value={movieForm.media_type}
                    onChange={(e) => setMovieForm({...movieForm, media_type: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  >
                    <option value="DVD">DVD</option>
                    <option value="Blu-ray">Blu-ray</option>
                    <option value="Digital">Digital</option>
                    <option value="VHS">VHS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location Section *</label>
                  <input
                    type="text"
                    value={movieForm.location_section}
                    onChange={(e) => setMovieForm({...movieForm, location_section: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Copy Amount *</label>
                  <input
                    type="number"
                    min="0"
                    value={movieForm.copy_amount}
                    onChange={(e) => setMovieForm({...movieForm, copy_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-6">
                  {loading ? 'Adding Movie...' : 'Add Movie'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Articles Form */}
        {activeTab === 'articles' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Add New Article</h3>
            <form onSubmit={(e) => handleSubmit(e, 'articles', articleForm)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Branch *</label>
                  <select
                    value={articleForm.branch_id}
                    onChange={(e) => setArticleForm({...articleForm, branch_id: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ISSN</label>
                  <input
                    type="text"
                    value={articleForm.issn}
                    onChange={(e) => setArticleForm({...articleForm, issn: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Publisher</label>
                  <div className="flex gap-2">
                    <select
                      value={articleForm.publisher_id}
                      onChange={(e) => setArticleForm({...articleForm, publisher_id: e.target.value})}
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    >
                      <option value="">Select Publisher</option>
                      {publishers.map(publisher => (
                        <option key={publisher.publisher_id} value={publisher.publisher_id}>
                          {publisher.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPublisherModal(true)}
                      className="px-3"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Copies *</label>
                  <input
                    type="number"
                    min="0"
                    value={articleForm.copies}
                    onChange={(e) => setArticleForm({...articleForm, copies: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-6">
                  {loading ? 'Adding Article...' : 'Add Article'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Electronics Form */}
        {activeTab === 'electronics' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-foreground">Add New Electronics Item</h3>
            <form onSubmit={(e) => handleSubmit(e, 'electronics', electronicsForm)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Branch *</label>
                  <select
                    value={electronicsForm.branch_id}
                    onChange={(e) => setElectronicsForm({...electronicsForm, branch_id: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Device Name *</label>
                  <input
                    type="text"
                    value={electronicsForm.device_name}
                    onChange={(e) => setElectronicsForm({...electronicsForm, device_name: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Serial Number</label>
                  <input
                    type="text"
                    value={electronicsForm.serial_num}
                    onChange={(e) => setElectronicsForm({...electronicsForm, serial_num: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Manufacture Date</label>
                  <input
                    type="date"
                    value={electronicsForm.manufact_date}
                    onChange={(e) => setElectronicsForm({...electronicsForm, manufact_date: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Maker</label>
                  <input
                    type="text"
                    value={electronicsForm.maker}
                    onChange={(e) => setElectronicsForm({...electronicsForm, maker: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Copy Amount *</label>
                  <input
                    type="number"
                    min="0"
                    value={electronicsForm.copy_amount}
                    onChange={(e) => setElectronicsForm({...electronicsForm, copy_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="px-6">
                  {loading ? 'Adding Electronics...' : 'Add Electronics'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Publisher Modal */}
        {showPublisherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New Publisher</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publisher Name *</label>
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Enter publisher name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPublisherModal(false);
                      setNewEntityName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddEntity('publishers', newEntityName)}
                    disabled={entityLoading || !newEntityName.trim()}
                  >
                    {entityLoading ? 'Adding...' : 'Add Publisher'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Author Modal */}
        {showAuthorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New Author</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author Name *</label>
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Enter author name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAuthorModal(false);
                      setNewEntityName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddEntity('authors', newEntityName)}
                    disabled={entityLoading || !newEntityName.trim()}
                  >
                    {entityLoading ? 'Adding...' : 'Add Author'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Director Modal */}
        {showDirectorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Add New Director</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Director Name *</label>
                  <input
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Enter director name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDirectorModal(false);
                      setNewEntityName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddEntity('directors', newEntityName)}
                    disabled={entityLoading || !newEntityName.trim()}
                  >
                    {entityLoading ? 'Adding...' : 'Add Director'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddItems;
