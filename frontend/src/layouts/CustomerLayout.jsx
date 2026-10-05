import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../Styles/customer.css"; // we'll create this
import { MdSpaceDashboard } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { TbTransactionRupee } from "react-icons/tb";
import { logout } from "../utils/auth";  // update path based on file location

import "./CustomerLayout.css";

const CustomerLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
  logout(); // clears tokens & redirects to login
};

  return (
    <div className="cd-root">
      {/* Sidebar */}
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
  <img 
    src="/assets/images/updated-logo.svg" 
    alt="LendingCart Logo" 
    className="cd-logo-img"
  />
</div>


        <nav className="cd-nav">
          <NavLink
  to="/customer"
  end
  className={({ isActive }) =>
    "cd-nav-link" + (isActive ? " cd-nav-link-active" : "")
  }
>
  <span className="cd-nav-icon">
    <MdSpaceDashboard size={20} />
  </span>
  <span>Main Dashboard</span>
</NavLink>


          {/* <NavLink
            to="/customer/portfolio"
            className={({ isActive }) =>
              "cd-nav-link" + (isActive ? " cd-nav-link-active" : "")
            }
          >
            <span className="cd-nav-icon"><CgProfile size={20}/></span>
            <span>My Portfolio</span>
          </NavLink>

          <NavLink
            to="/customer/transactions"
            className={({ isActive }) =>
              "cd-nav-link" + (isActive ? " cd-nav-link-active" : "")
            }
          >
            <span className="cd-nav-icon"><TbTransactionRupee size={20}/></span>
            <span>Transactions</span>
          </NavLink> */}

          <NavLink
            to="/customer/profile"
            className={({ isActive }) =>
              "cd-nav-link" + (isActive ? " cd-nav-link-active" : "")
            }
          >
            <span className="cd-nav-icon">👤</span>
            <span>Profile</span>
          </NavLink>
        </nav>

      
      </aside>

      {/* Main area */}
      <div className="cd-main">
        {/* Topbar */}
        <header className="cd-topbar">
  <div className="cd-breadcrumb">
    <span>Pages /</span>
    <span className="cd-breadcrumb-current"> Main Dashboard</span>
  </div>

  <div className="cd-topbar-right">
    
    {/* Home Button */}
    <button
      className="cd-home-btn"
      onClick={() => navigate("/")}
    >
      Return to Home
    </button>

    <div className="cd-avatar">A</div>

    <button className="cd-logout-btn" onClick={handleLogout}>
      Logout
    </button>
  </div>
</header>

        {/* Content from nested routes */}
        <main className="cd-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};



export default CustomerLayout;

