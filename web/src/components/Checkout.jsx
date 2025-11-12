import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { API_BASE_URL } from '../config';
import { Badge } from './ui/badge';

const Checkout = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState(['book', 'movie', 'electronics', 'article']); // Include articles by default
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Get search query and category from URL parameters
  const urlSearchQuery = searchParams.get('search');
  const urlCategory = searchParams.get('category');

  // Apply initial category filter if provided - exclusive selection
  useEffect(() => {
    if (urlCategory) {
      // Map itemType to filter type
      const filterType = urlCategory === 'electronic_rental' ? 'electronics' : urlCategory;
      setTypeFilters([filterType]);
    } else {
      // Default view shows all categories including articles
      setTypeFilters(['book', 'movie', 'electronics', 'article']);
    }
  }, [urlCategory]);

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        setLoading(true);
        // Fetch all items (both available and unavailable)
        const urls = [
          `${API_BASE_URL}/books`,
          `${API_BASE_URL}/movies`,
          `${API_BASE_URL}/articles`,
          `${API_BASE_URL}/electronics`
        ];

        if (urlSearchQuery) {
          urls[0] += `?search=${encodeURIComponent(urlSearchQuery)}`;
          urls[1] += `?search=${encodeURIComponent(urlSearchQuery)}`;
          urls[2] += `?search=${encodeURIComponent(urlSearchQuery)}`;
          urls[3] += `?search=${encodeURIComponent(urlSearchQuery)}`;
        }

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
              itemType: 'book',
              itemId: `book-${book.book_id}`,
              authors: book.authors,
              copies: book.copies,
              details: `Copies: ${book.copies} | ISBN: ${book.isbn} | Publisher: ${book.publisher_name}`,
              branch: book.branch_info,
              available: book.copies > 0
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
              itemType: 'movie',
              itemId: `movie-${movie.movie_id}`,
              authors: movie.director_name ? `Directed by ${movie.director_name}` : '',
              copies: movie.copy_amount,
              details: `Copies: ${movie.copy_amount} | Release: ${new Date(movie.release_date).getFullYear()} | Media: ${movie.media_type}`,
              branch: movie.branch_info,
              available: movie.copy_amount > 0
            });
          });
        }

        // Add articles
        if (responses[2].data) {
          responses[2].data.forEach(article => {
            allItems.push({
              id: `article-${article.article_id}`,
              title: article.title,
              type: 'article',
              itemType: 'article',
              itemId: `article-${article.article_id}`,
              authors: article.authors || 'Various Authors',
              copies: article.copies,
              details: `Copies: ${article.copies} | ISSN: ${article.issn} | Publisher: ${article.publisher_name}`,
              branch: article.branch_info,
              available: article.copies > 0
            });
          });
        }

        // Add electronics
        if (responses[3].data) {
          responses[3].data.forEach(device => {
            allItems.push({
              id: `electronic-${device.electronics_id}`,
              title: device.device_name,
              type: 'electronics',
              itemType: 'electronic_rental',
              itemId: `electronic-${device.electronics_id}`,
              authors: `Made by ${device.maker}`,
              copies: device.copy_amount,
              details: `Copies: ${device.copy_amount} | Serial: ${device.serial_num} | Manufactured: ${new Date(device.manufact_date).toLocaleDateString()}`,
              branch: device.branch_info,
              available: device.copy_amount > 0
            });
          });
        }

        setAllItems(allItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchAllItems();
  }, [urlSearchQuery]);

  // Filter items based on type filters and search, then paginate
  useEffect(() => {
    let filtered = allItems.filter(item =>
      typeFilters.includes(item.type) &&
      (localSearch === '' ||
       item.title.toLowerCase().includes(localSearch.toLowerCase()) ||
       item.authors.toLowerCase().includes(localSearch.toLowerCase()) ||
       item.details.toLowerCase().includes(localSearch.toLowerCase()))
    );

    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change

    setFilteredItems(filtered);
  }, [allItems, typeFilters, localSearch]);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleTypeFilter = (type) => {
    setTypeFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleLocalSearch = (e) => {
    setLocalSearch(e.target.value);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setTypeFilters(['book', 'movie', 'electronics', 'article']); // Include articles
    // Clear URL parameters
    setSearchParams({});
  };

  const handleCheckout = async (item) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: userData.member_id,
          item_id: item.itemId,
          item_type: item.itemType,
          branch_id: 1 // Default branch, in a real app this would be selected
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`"${item.title}" has been checked out successfully!`);

        // Update the item copies count and availability in real-time
        setAllItems(prev => prev.map(i => {
          if (i.id === item.id) {
            const newCopies = Math.max(0, i.copies - 1);
            const newAvailable = newCopies > 0;
            const updatedDetails = i.details.replace(/Copies: \d+/, `Copies: ${newCopies}`);
            return { ...i, copies: newCopies, available: newAvailable, details: updatedDetails };
          }
          return i;
        }));
      } else {
        const errorData = await response.json();
        alert(`Checkout failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed due to network error');
    }
  };

  const handleHoldRequest = async (item) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      const headers = {
        'Content-Type': 'application/json',
        'x-user-type': userData.user_type,
        'x-user-id': userData.user_type === 'member' ? userData.member_id : userData.staff_id
      };

      const response = await fetch(`${API_BASE_URL}/hold-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: userData.member_id,
          item_id: item.itemId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Hold request for "${item.title}" has been placed successfully! Your position in queue: ${result.data.queue_position}`);
      } else {
        const errorData = await response.json();
        alert(`Hold request failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Hold request error:', error);
      alert('Hold request failed due to network error');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'book': return 'bg-blue-100 text-blue-800';
      case 'movie': return 'bg-purple-100 text-purple-800';
      case 'article': return 'bg-red-100 text-red-800';
      case 'electronics': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Browse Library Items</h2>
        <p className="text-muted-foreground">Loading library items...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Browse Library Items</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Browse Library Items</h2>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            {/* Search Bar */}
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Search titles, authors, details..."
                value={localSearch}
                onChange={handleLocalSearch}
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={clearAllFilters} variant="outline">
                Clear All
              </Button>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-2 self-center">Filter by type:</span>
              {[
                { type: 'book', label: 'Books', icon: '📚' },
                { type: 'article', label: 'Articles', icon: '📄' },
                { type: 'movie', label: 'Movies', icon: '🎬' },
                { type: 'electronics', label: 'Electronics', icon: '💻' }
              ].map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant={typeFilters.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleTypeFilter(type)}
                  className="flex items-center gap-1"
                >
                  <span>{icon}</span>
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {urlSearchQuery && (
            <p className="text-muted-foreground mb-4">Global search results for: <span className="font-semibold">"{urlSearchQuery}"</span></p>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              {allItems.length === 0 ? 'No items available at the moment.' : 'No items match your filters.'}
            </p>
            {(localSearch || typeFilters.length < 3) && (
              <Button onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {getCurrentPageItems().map((item) => (
                <div key={item.id} className={`border border-border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  item.available ? 'bg-card' : 'bg-muted/30 opacity-75'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h3 className={`text-lg font-semibold line-clamp-2 ${
                          item.available ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {item.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          {!item.available && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-2">{item.authors}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                        <span>{item.details.split(' | ')[0]}</span>
                        <span>{item.details.split(' | ').slice(1).join(' | ')}</span>
                      </div>
                      <p className="text-sm text-primary">📍 {item.branch}</p>
                    </div>
                    {user && user.user_type === 'member' && (
                      <div className="flex gap-2 sm:flex-col sm:gap-1">
                        {item.available ? (
                          <Button
                            onClick={() => handleCheckout(item)}
                            size="sm"
                            className="sm:w-auto w-full"
                          >
                            Check Out
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleHoldRequest(item)}
                            variant="outline"
                            size="sm"
                            className="sm:w-auto w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            Request Hold
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center justify-center mt-12 gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    ⟪ First
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ⟨ Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next ⟩
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last ⟫
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                  (Page {currentPage} of {totalPages})
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
