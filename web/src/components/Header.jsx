import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Library, Menu, User, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Header = ({ user, onSignIn, onLogout }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Library className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">LibraryHub</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/checkout"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            Checkout
          </NavLink>
          {user && (
            <>
              {(user.user_type === 'staff') && (
                <NavLink
                  to="/members"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Members
                </NavLink>
              )}
              {user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') && (
                <NavLink
                  to="/staff"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Staff
                </NavLink>
              )}
              <NavLink
                to="/loans"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                Loans
              </NavLink>
              <NavLink
                to="/fines"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                Fines
              </NavLink>
              <NavLink
                to="/holds"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                Holds
              </NavLink>
              {(user.user_type === 'staff') && (
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Inventory
                </NavLink>
              )}
              {user.user_type === 'member' && (
                <NavLink
                  to="/payment-history"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Payments
                </NavLink>
              )}
              {user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin') && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  Reports
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              {/* Notification Bell for members */}
              <NotificationBell user={user} setActiveTab={(tab) => navigate(`/${tab}`)} />

              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 text-sm min-w-0 hover:bg-accent px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Click to view/edit profile"
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">
                  {user.user_type === 'staff' ? user.name : user.name}
                  <span className="text-muted-foreground ml-2 capitalize">
                    ({user.user_type}{(user.user_type === 'staff' && (user.role === 'admin' || user.position === 'admin')) ? ' admin' : ''})
                  </span>
                </span>
              </button>
              <Button variant="outline" onClick={onLogout} className="gap-2 flex-shrink-0">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/signin">
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
