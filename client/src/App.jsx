import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import SalePage from "./pages/SalePage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import CashClosurePage from "./pages/CashClosurePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import SalesListPage from "./pages/SalesListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

const App = () => {
  return (
    <div className="app-shell">
      <header>
        <div>
          <strong>QuickSales POS</strong>
          <span className="badge" style={{ marginLeft: 12 }}>ARS</span>
        </div>
        <nav className="nav-links">
          <NavLink to="/venta">Nueva venta</NavLink>
          <NavLink to="/reportes">Reportes</NavLink>
          <NavLink to="/cierre-caja">Cierre caja</NavLink>
          <NavLink to="/ventas">Ventas</NavLink>
          <NavLink to="/usuarios">Usuarios</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/productos">Productos</NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<SalePage />} />
          <Route path="/venta" element={<SalePage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/cierre-caja" element={<CashClosurePage />} />
          <Route path="/ventas" element={<SalesListPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
