import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BookOpen } from 'lucide-react';

const FeaturedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/books`)
      .then(res => res.json())
      .then(data => {
        // Take the first 4 books as featured
        setBooks((data.data || []).slice(0, 4));
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="py-20 px-4 text-center">Loading featured books...</div>;
  if (error) return <div className="py-20 px-4 text-center text-red-500">Error: {error}</div>;

  return (
    <section className="py-20 px-4 bg-muted/30 w-full">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Featured This Month
          </h2>
          <p className="text-xl text-muted-foreground">
            Staff picks and popular titles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book, index) => (
            <Card
              key={book.book_id}
              className="group hover:shadow-elegant transition-all duration-300 bg-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={book.available ? 'default' : 'secondary'}>
                    {book.available ? 'Available' : 'On Loan'}
                  </Badge>
                  <BookOpen className="h-5 w-5 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="text-xl leading-tight text-foreground">
                  {book.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">{book.authors}</p>
                <p className="text-sm text-secondary font-medium mb-4">
                  ISBN: {book.isbn}
                </p>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  disabled={!book.available}
                >
                  {book.available ? 'Reserve Now' : 'Add to Waitlist'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBooks;
