import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const Checkout = ({ user, searchQuery, onClearSearch, initialCategoryFilter }) => {
  const [availableItems, setAvailableItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState(['book', 'movie', 'electronics', 'article']); // Include articles by default
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Apply initial category filter if provided - exclusive selection
  useEffect(() => {
    if (initialCategoryFilter) {
      // Map itemType to filter type
      const filterType = initialCategoryFilter === 'electronic_rental' ? 'electronics' : initialCategoryFilter;
      // If navigating from a category, only show that category
      setTypeFilters([filterType]);
    } else {
      // Default view shows all categories including articles
      setTypeFilters(['book', 'movie', 'electronics', 'article']);
    }
  }, [initialCategoryFilter]);

  useEffect(() => {
    const fetchAvailableItems = async () => {
      try {
        setLoading(true);
        const urls = [
          'https://130.131.225.98/api/books?available=true',
          'https://130.131.225.98/api/movies?available=true',
          'https://130.131.225.98/api/articles?available=true',
          'https://130.131.225.98/api/electronics?available=true'
        ];

        if (searchQuery) {
          urls[0] += `&search=${encodeURIComponent(searchQuery)}`;
          urls[1] += `&search=${encodeURIComponent(searchQuery)}`;
          urls[2] += `&search=${encodeURIComponent(searchQuery)}`;
          urls[3] += `&search=${encodeURIComponent(searchQuery)}`;
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
              itemId: book.book_id,
              authors: book.authors,
              details: `ISBN: ${book.isbn} | Publisher: ${book.publisher_name}`,
              branch: book.branch_info
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
              itemId: movie.movie_id,
              authors: movie.director_name ? `Directed by ${movie.director_name}` : '',
              details: `Release: ${new Date(movie.release_date).getFullYear()} | Media: ${movie.media_type}`,
              branch: movie.branch_info
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
              itemId: article.article_id,
              authors: article.authors || 'Various Authors',
              details: `Publisher: ${article.publisher_name} | ISSN: ${article.issn}`,
              branch: article.branch_info
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
              itemId: device.electronics_id,
              authors: `Made by ${device.maker}`,
              details: `Serial: ${device.serial_num} | Manufactured: ${new Date(device.manufact_date).toLocaleDateString()}`,
              branch: device.branch_info
            });
          });
        }

        setAvailableItems(allItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchAvailableItems();
  }, [searchQuery]);

  // Filter items based on type filters and search, then paginate
  useEffect(() => {
    let filtered = availableItems.filter(item =>
      typeFilters.includes(item.type) &&
      (localSearch === '' ||
       item.title.toLowerCase().includes(localSearch.toLowerCase()) ||
       item.authors.toLowerCase().includes(localSearch.toLowerCase()) ||
       item.details.toLowerCase().includes(localSearch.toLowerCase()))
    );

    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page when filters change

    setFilteredItems(filtered);
  }, [availableItems, typeFilters, localSearch]);

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
    if (onClearSearch) {
      onClearSearch();
    }
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

      const response = await fetch('https://130.131.225.98/api/loans', {
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

        // Clear search query after successful checkout
        if (onClearSearch) {
          onClearSearch();
        }

        // Remove the item from the list since it's no longer available
        setAvailableItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        const errorData = await response.json();
        alert(`Checkout failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed due to network error');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'book': return 'bg-blue-100 text-blue-800';
      case 'movie': return 'bg-purple-100 text-purple-800';
      case 'article': return 'bg-green-100 text-green-800';
      case 'electronics': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Checkout Available Items</h2>
        <p className="text-muted-foreground">Loading available items...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl font-bold mb-8 text-foreground">Checkout Available Items</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    </div>
  );

  return (
    <div className="py-20 px-4 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Available for Checkout</h2>

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

          {searchQuery && (
            <p className="text-muted-foreground mb-4">Global search results for: <span className="font-semibold">"{searchQuery}"</span></p>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              {availableItems.length === 0 ? 'No items available for checkout at the moment.' : 'No items match your filters.'}
            </p>
            {(localSearch || typeFilters.length < 3) && (
              <Button onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentPageItems().map((item) => (
                <div key={item.id} className="border p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-foreground line-clamp-2">{item.title}</h3>
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mb-2">{item.authors}</p>
                  <p className="text-sm text-muted-foreground mb-3">{item.details}</p>
                  <p className="text-sm text-primary mb-4">📍 {item.branch}</p>

                  {user && user.user_type === 'member' && (
                    <Button
                      onClick={() => handleCheckout(item)}
                      className="w-full"
                    >
                      Check Out
                    </Button>
                  )}
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
