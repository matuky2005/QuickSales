import React, { useEffect, useState } from "react";
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
import SettingsPage from "./pages/SettingsPage.jsx";
import RemitosPage from "./pages/RemitosPage.jsx";

const App = () => {
  const location = useLocation();
  const user = localStorage.getItem("qs-user");
  const isLogin = location.pathname === "/login";
  const [menuOpen, setMenuOpen] = useState(false);
  if (!user && !isLogin) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header>
        <div className="brand">
          <strong>QuickSales POS</strong>
          <span className="badge" style={{ marginLeft: 12 }}>ARS</span>
        </div>
        <button
          type="button"
          className="ghost menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Cerrar" : "Menú"}
        </button>
        <nav className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <div className="nav-group">
            <span className="nav-label">Venta</span>
            <NavLink to="/venta">Nueva</NavLink>
            <NavLink to="/ventas">Listado</NavLink>
            <NavLink to="/remitos">Remitos</NavLink>
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
            <NavLink to="/configuraciones">Configuraciones</NavLink>
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
          <Route path="/remitos" element={<RemitosPage />} />
          <Route path="/movimientos" element={<CashMovementsPage />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
          <Route path="/configuraciones" element={<SettingsPage />} />
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
