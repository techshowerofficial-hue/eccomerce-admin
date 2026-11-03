import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="Sidebar">
      <div className="sidebar-options">
        <NavLink to="/add" className="sidebar-option">
          <p>Add Product</p>
        </NavLink>

        <NavLink to="/list" className="sidebar-option">
          <p>Product List</p>
        </NavLink>

        <NavLink to="/category" className="sidebar-option">
          <p>Categories</p>
        </NavLink>

        <NavLink to="/order" className="sidebar-option">
          <p>Orders</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;