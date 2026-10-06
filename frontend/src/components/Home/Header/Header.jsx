import React, { useState, useEffect, useRef } from "react";
import NseTicker from "../../NseTicker";

/* ========= SINGLE SOURCE OF TRUTH ========= */
const NAV_ITEMS = [
  { title: "Home", href: "/" },

  { title: "About Us", href: "/about-us" },

  {
    title: "Learn and Explore",
    href: "/",
    children: [
      { title: "Calculate Your Investment", href: "/calculators" },
      { title: "Financial Independence", href: "/retirement-calculator" },

    {
  title: "Learn With Us",
  href: "/learn-with-us",
}
    ],
  },

  { title: "FMAX-PortfolioIQ", href: "/subscription" },

  { title: "Contact Us", href: "/contact-us" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  /* ========= AUTH CHECK ========= */
  useEffect(() => {
    const token =
      localStorage.getItem("foliomax_accessToken") ||
      sessionStorage.getItem("foliomax_accessToken");

    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 > Date.now()) {
        setUser(payload);
      }
    } catch (err) {
      console.error("Invalid token");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("foliomax_accessToken");
    localStorage.removeItem("foliomax_refreshToken");
    sessionStorage.removeItem("foliomax_accessToken");
    sessionStorage.removeItem("foliomax_refreshToken");
    window.location.href = "/login";
  };

  /* ========= CLOSE PROFILE DROPDOWN ON OUTSIDE CLICK ========= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-dropdown")) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ========= MOBILE ESC CLOSE ========= */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && mobileOpen) closeMobileMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    document.body.classList.toggle("mobile-menu-visible", mobileOpen);
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("mobile-menu-visible");
    };
  }, [mobileOpen]);

  /* ========= HANDLERS ========= */
  const toggleMobileMenu = () => setMobileOpen((v) => !v);
  const closeMobileMenu = () => {
    setMobileOpen(false);
    setOpenSubmenus({});
  };

  const toggleSubmenu = (idx) =>
    setOpenSubmenus((p) => ({ ...p, [idx]: !p[idx] }));

  const handleMobileLinkClick = (href, e) => {
    if (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
    }
    closeMobileMenu();
    setTimeout(() => (window.location.href = href), 100);
  };
  const renderMenuItems = (items) => (
  <ul>
    {items.map((item, idx) => (
      <li
        key={idx}
        className={item.children ? "dropdown" : ""}
      >
        <a href={item.href}>{item.title}</a>

        {item.children && renderMenuItems(item.children)}
      </li>
    ))}
  </ul>
);

const renderDesktopMenu = () => (
  <ul className="navigation clearfix">
    {NAV_ITEMS.map((item, idx) => (
      <li
        key={idx}
        className={item.children ? "dropdown" : ""}
      >
        <a href={item.href}>{item.title}</a>

        {item.children && renderMenuItems(item.children)}
      </li>
    ))}
  </ul>
);

  const renderAuthSection = () => {
    if (!user) {
      return (
        <a href="/login" className="signin-btn">
          Sign In
        </a>
      );
    }

    return (
      <div
        className="profile-dropdown"
        style={{ position: "relative", cursor: "pointer" }}
      >
        <div
          onClick={() => setProfileOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.name || "User"
            )}`}
            alt="Profile"
            style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
            }}
          />
          <span style={{ fontWeight: 500 }}>
            {user.name || "User"}
          </span>
        </div>

        {profileOpen && (
          <div
  style={{
    position: "absolute",
    top: "45px",
    right: 0,
    background: "#fff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    minWidth: "160px",
    padding: "8px 0",
    zIndex: 999,
  }}
>
  {/* DASHBOARD BUTTON */}
  <button
    onClick={() => (window.location.href = "/customer")}
    style={{
      width: "100%",
      background: "transparent",
      border: "none",
      padding: "10px 15px",
      textAlign: "left",
      cursor: "pointer",
      fontWeight: 500,
    }}
  >
    Dashboard
  </button>

  {/* ✅ LOGOUT BUTTON */}
  <button
    onClick={handleLogout}
    style={{
      width: "100%",
      background: "transparent",
      border: "none",
      padding: "10px 15px",
      textAlign: "left",
      cursor: "pointer",
      color: "#ff4d4f",
      fontWeight: 500,
    }}
  >
    Logout
  </button>
</div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="main-header header-style-five">
        <div className="header-top-three">
          <NseTicker />
        </div>

        <div className="header-lower">
          <div className="outer-container">
            <div className="outer-box">
              <figure className="logo-box">
                <a href="/">
                  <img src="/assets/images/updated-logo.svg" alt="Logo" />
                </a>
              </figure>

              <div className="menu-area">
                <button
                  className="mobile-nav-toggler"
                  onClick={toggleMobileMenu}
                  type="button"
                >
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                  <span className="icon-bar" />
                </button>

                <nav className="main-menu navbar-expand-md navbar-light">
                  <div className="collapse navbar-collapse show clearfix">
                    {renderDesktopMenu()}
                  </div>
                </nav>
              </div>

              <div className="menu-right-content">
                {renderAuthSection()}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky-header">
          <div className="header-top-three">
            <NseTicker />
          </div>
          <div className="outer-container">
            <div className="outer-box">
              <figure className="logo-box">
                <a href="/">
                  <img src="/assets/images/updated-logo.svg" alt="Logo" />
                </a>
              </figure>

              <div className="menu-area clearfix">
                <nav className="main-menu navbar-expand-md navbar-light">
                  <div className="collapse navbar-collapse show clearfix">
                    {renderDesktopMenu()}
                  </div>
                </nav>
              </div>

              <div className="menu-right-content">
                {renderAuthSection()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={mobileMenuRef}
        className={`mobile-menu ${mobileOpen ? "open" : ""}`}
      >
        <div className="menu-backdrop" onClick={closeMobileMenu} />
        <div className="close-btn" onClick={closeMobileMenu}>
          <i className="fas fa-times" />
        </div>

        <nav className="menu-box">
          <div className="nav-logo">
            <a href="/" onClick={(e) => handleMobileLinkClick("/", e)}>
              <img src="/assets/images/updated-logo.svg" alt="Logo" />
            </a>
          </div>

          <ul className="mobile-navigation clearfix">
            {NAV_ITEMS.map((item, idx) =>
              item.children ? (
                <li key={idx} className="has-children">
                  <button
                    className="mobile-parent-link"
                    onClick={() => toggleSubmenu(idx)}
                  >
                    {item.title}
                    <span
                      className={`submenu-toggle ${
                        openSubmenus[idx] ? "open" : ""
                      }`}
                    >
                      ▸
                    </span>
                  </button>
                  <ul className={`submenu ${openSubmenus[idx] ? "open" : ""}`}>
                    {item.children.map((child, cidx) => (
                      <li key={cidx}>
                        <a
                          href={child.href}
                          onClick={(e) =>
                            handleMobileLinkClick(child.href, e)
                          }
                        >
                          {child.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={idx}>
                  <a
                    href={item.href}
                    onClick={(e) => handleMobileLinkClick(item.href, e)}
                  >
                    {item.title}
                  </a>
                </li>
              )
            )}
          </ul>

          <div style={{ padding: "20px" }}>
  {!user ? (
    <a
      href="/login"
      onClick={(e) => handleMobileLinkClick("/login", e)}
      className="signin-btn"
      style={{
        display: "block",
        textAlign: "center",
      }}
    >
      Sign In
    </a>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <button
        onClick={() => {
          closeMobileMenu();
          window.location.href = "/customer";
        }}
        style={{
          padding: "10px",
          border: "none",
          background: "#f5f5f5",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Dashboard
      </button>

      <button
        onClick={() => {
          closeMobileMenu();
          handleLogout();
        }}
        style={{
          padding: "10px",
          border: "none",
          background: "#fff1f0",
          color: "#ff4d4f",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Logout
      </button>
    </div>
  )}
</div>
        </nav>
      </div>
    </>
  );
};

export default Header;