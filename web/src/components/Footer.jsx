import { Library, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Library className="h-8 w-8" />
              <span className="text-2xl font-bold">LibraryHub</span>
            </div>
            <p className="text-primary-foreground/80">
              Your gateway to knowledge and discovery since 1950.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-secondary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Catalog</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Events</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-secondary transition-colors">Book Loans</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Reservations</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Research Help</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">Digital Resources</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{/* TODO: Fetch real contact phone from API */}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{/* TODO: Fetch real contact email from API */}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{/* TODO: Fetch real contact address from API */}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} LibraryHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
