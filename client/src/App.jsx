import React from "react";
import { NavLink, Route, Routes, Navigate, useLocation } from "react-router-dom";
import SalePage from "./pages/SalePage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import CashClosurePage from "./pages/CashClosurePage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import SalesListPage from "./pages/SalesListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import CashMovementsPage from "./pages/CashMovementsPage.jsx";

const App = () => {
  const location = useLocation();
  const user = localStorage.getItem("qs-user");
  const isLogin = location.pathname === "/login";
  if (!user && !isLogin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <strong>QuickSales POS</strong>
          <span className="badge" style={{ marginLeft: 12 }}>ARS</span>
        </div>
        <nav className="nav-links">
          <div className="nav-group">
            <span className="nav-label">Venta</span>
            <NavLink to="/venta">Nueva</NavLink>
            <NavLink to="/ventas">Listado</NavLink>
          </div>
          <div className="nav-group">
            <span className="nav-label">Caja</span>
            <NavLink to="/movimientos">Movimientos</NavLink>
            <NavLink to="/cierre-caja">Cierre</NavLink>
            <NavLink to="/reportes">Reportes</NavLink>
          </div>
          <div className="nav-group">
            <span className="nav-label">Gestión</span>
            <NavLink to="/productos">Productos</NavLink>
            <NavLink to="/clientes">Clientes</NavLink>
            <NavLink to="/usuarios">Usuarios</NavLink>
          </div>
          <button
            className="ghost"
            onClick={() => {
              localStorage.removeItem("qs-user");
              window.location.href = "/login";
            }}
          >
            Salir
          </button>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<SalePage />} />
          <Route path="/venta" element={<SalePage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/cierre-caja" element={<CashClosurePage />} />
          <Route path="/ventas" element={<SalesListPage />} />
          <Route path="/movimientos" element={<CashMovementsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Matias Lazarte</span>
        <span>381215745 · matiaslazarte13@hotmail.com</span>
      </footer>
    </div>
  );
};

export default App;
