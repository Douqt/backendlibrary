import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Card, CardContent } from './ui/card';
import { Book, FileText, Film, Laptop } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([
    {
      icon: Book,
      title: 'Books',
      description: 'Browse our extensive collection of books across all genres',
      count: 0,
      itemType: 'book',
      api: 'books'
    },
    {
      icon: Film,
      title: 'Movies',
      description: 'Explore our curated selection of films and documentaries',
      count: 0,
      itemType: 'movie',
      api: 'movies'
    },
    {
      icon: FileText,
      title: 'Articles',
      description: 'Access scholarly articles and research papers',
      count: 0,
      itemType: 'article',
      api: 'articles'
    },
    {
      icon: Laptop,
      title: 'Electronics',
      description: 'Borrow laptops, tablets, and other tech equipment',
      count: 0,
      itemType: 'electronic_rental',
      api: 'electronics'
    },
  ]);

  useEffect(() => {
    // Fetch counts for each item type
    const fetchCounts = async () => {
      try {
        const promises = categories.map(async (category) => {
          try {
            const response = await fetch(`${API_BASE_URL}/${category.api}`);
            const data = await response.json();
            return data.data ? data.data.length : 0;
          } catch (err) {
            console.error(`Error fetching ${category.api}:`, err);
            return 0;
          }
        });

        const counts = await Promise.all(promises);

        setCategories(prevCategories =>
          prevCategories.map((category, index) => ({
            ...category,
            count: counts[index]
          }))
        );
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <section className="py-20 px-4 w-full" id="collections">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Explore Our Collections
          </h2>
          <p className="text-xl text-muted-foreground">
            Find exactly what you're looking for in our diverse catalog
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link key={category.title} to={`/checkout?category=${category.itemType}`}>
              <Card
                className="group hover:shadow-hover transition-all duration-300 cursor-pointer bg-gradient-card border-border animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  <p className="text-3xl font-bold text-secondary">
                    {category.count}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
