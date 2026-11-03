import React from "react";
import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

import Add from "./Pages/Add/Add.jsx";
import List from "./Pages/List/List.jsx";
import Order from "./Pages/Order/Order.jsx";
import Category from "./Pages/Category/Category.jsx";

const App = () => {
  return (
    <div className="App">
      <Navbar />

      {/* Top Navigation Tabs */}
      <div className="admin-tabs">
        <NavLink to="/add" className="admin-tab">
          Add Product
        </NavLink>

        <NavLink to="/list" className="admin-tab">
          Product List
        </NavLink>

        <NavLink to="/category" className="admin-tab">
          Categories
        </NavLink>

        <NavLink to="/order" className="admin-tab">
          Orders
        </NavLink>
      </div>

      {/* Main Content */}
      <main className="admin-main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/add" replace />} />
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List />} />
          <Route path="/category" element={<Category />} />
          <Route path="/order" element={<Order />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;