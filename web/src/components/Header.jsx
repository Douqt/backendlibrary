import { Button } from './ui/button';
import { Library, Menu, User, LogOut } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, user, onSignIn, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">LibraryHub</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'checkout' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('checkout')}
          >
            Checkout
          </Button>
          {user && (
            <>
              {(user.user_type === 'staff') && (
                <Button
                  variant={activeTab === 'members' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('members')}
                >
                  Members
                </Button>
              )}
              {user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') && (
                <Button
                  variant={activeTab === 'staff' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('staff')}
                >
                  Staff
                </Button>
              )}
              <Button
                variant={activeTab === 'loans' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('loans')}
              >
                Loans
              </Button>
              <Button
                variant={activeTab === 'fines' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('fines')}
              >
                Fines
              </Button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {user.user_type === 'staff' ? user.name : user.name}
                  <span className="text-muted-foreground ml-2 capitalize">
                    ({user.user_type}{(user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin')) ? ' admin' : ''})
                  </span>
                </span>
              </div>
              <Button variant="outline" onClick={onLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onSignIn} className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
