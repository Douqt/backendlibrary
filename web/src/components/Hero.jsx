import { useState } from 'react';
import { Button } from './ui/button';
import { Search, Book } from 'lucide-react';

const Hero = ({ onBrowseCollections, onSearchCatalog }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchCatalog(searchQuery.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gradient-hero" id="hero">
      <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary-foreground">
          LibraryHub
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
          Explore thousands of books, articles, movies, and more at your fingertips
        </p>
        <div className="flex gap-4 justify-center flex-wrap max-w-lg mx-auto">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="Search our catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
            />
            <Button
              size="lg"
              variant="secondary"
              onClick={handleSearch}
              className="px-6"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={onBrowseCollections}
            className="text-lg px-8 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 w-full"
          >
            <Book className="mr-2 h-5 w-5" />
            Explore Collections
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
