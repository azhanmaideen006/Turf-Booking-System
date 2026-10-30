import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MapPin, Menu, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("admin") ||
        localStorage.getItem("user") ||
        "null"
      );
    } catch {
      return null;
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function updateUser() {
      try {
        setUser(
          JSON.parse(
            localStorage.getItem("admin") ||
            localStorage.getItem("user") ||
            "null"
          )
        );
      } catch {
        setUser(null);
      }
    }

    window.addEventListener("storage", updateUser);
    window.addEventListener("userLogin", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("userLogin", updateUser);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");

    setUser(null);
    closeMenu();
    navigate("/", { replace: true });
  }

  const displayName =
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={closeMenu}>
        <span className="brand-icon">⚽</span>
        Turf<span className="brand-accent">Zone</span>
      </Link>

      <nav className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
        <NavLink to="/" onClick={closeMenu}>Home</NavLink>

        <a href="/#turfs" onClick={closeMenu}>
          Explore Turfs
        </a>

        <NavLink to="/my-bookings" onClick={closeMenu}>
          My Bookings
        </NavLink>
      </nav>

      <div className={`nav-actions ${menuOpen ? "nav-actions-open" : ""}`}>
        <span className="location-label">
          <MapPin size={16} /> Find your turf
        </span>

        {user ? (
          <div className="nav-user-info">
            <span className="welcome-user">
              Welcome, {displayName}
            </span>

            <button
              className="login-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="login-button"
            onClick={closeMenu}
          >
            Login
          </Link>
        )}

        <Link
          to="/admin"
          className="admin-nav-button"
          onClick={closeMenu}
        >
          <ShieldCheck size={17} /> Admin
        </Link>
      </div>

      <button
        type="button"
        className="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((previous) => !previous)}
      >
        <Menu size={24} />
      </button>
    </header>
  );
}