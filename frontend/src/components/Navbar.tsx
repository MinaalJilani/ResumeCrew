import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, MessageSquare, Sparkles, LogOut, X, AlertTriangle } from "lucide-react";
import { isLoggedIn, logout } from "@/lib/auth";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const hideNavbar = ["/login", "/register", "/signup"].includes(location.pathname);
  if (hideNavbar) return null;

  const isLanding = location.pathname === "/";
  const navItems = [
    { label: "Home", path: "/", icon: Home, show: !loggedIn && !isLanding },
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, show: loggedIn },
    { label: "Chat", path: "/chat", icon: MessageSquare, show: loggedIn },
  ].filter(item => item.show);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 animate-in fade-in duration-500">
        <div className="w-full mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-all btn-hover">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              ResumeCrew<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all btn-hover ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="w-px h-6 bg-border/50 mx-2 hidden sm:block" />

            {loggedIn ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-all text-sm font-medium px-4 py-2 hover:bg-red-500/5 rounded-xl border border-transparent hover:border-red-500/10 btn-hover"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 hidden sm:block btn-hover"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Logout?</h3>
            </div>
            <p className="text-muted-foreground mb-6">Are you sure you want to log out of your session?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 transition-all btn-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all btn-hover shadow-lg shadow-red-600/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
