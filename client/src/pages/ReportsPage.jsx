import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const ReportsPage = () => {
  const [date, setDate] = useState("");
  const [report, setReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(false);
  const [brandDate, setBrandDate] = useState("");
  const [brandStartDate, setBrandStartDate] = useState("");
  const [brandEndDate, setBrandEndDate] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [brandReport, setBrandReport] = useState(null);
  const [reportMode, setReportMode] = useState("marca");
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [customerReport, setCustomerReport] = useState(null);
  const [status, setStatus] = useState("");

  const loadReport = async () => {
    if (!date) return;
    try {
      const data = await apiFetch(`/api/reports/daily?date=${date}`);
      setReport(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadBrandReport = async () => {
    if (!brandDate && !brandStartDate) return;
    const params = new URLSearchParams();
    if (brandDate) {
      params.set("date", brandDate);
    } else {
      params.set("startDate", brandStartDate);
      if (brandEndDate) {
        params.set("endDate", brandEndDate);
      }
    }
    if (brandFilter.trim()) {
      params.set("brand", brandFilter.trim());
    }
    try {
      const data = await apiFetch(`/api/reports/by-brand?${params.toString()}`);
      setBrandReport(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadCustomerReport = async () => {
    if (!customerId) return;
    if (!brandDate && !brandStartDate) return;
    const params = new URLSearchParams();
    params.set("customerId", customerId);
    if (brandDate) {
      params.set("date", brandDate);
    } else {
      params.set("startDate", brandStartDate);
      if (brandEndDate) {
        params.set("endDate", brandEndDate);
      }
    }
    try {
      const data = await apiFetch(`/api/reports/by-customer?${params.toString()}`);
      setCustomerReport(data);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [brandData, customerData] = await Promise.all([
          apiFetch("/api/products/brands"),
          apiFetch("/api/customers")
        ]);
        setBrands(brandData);
        setCustomers(customerData);
      } catch (error) {
        setStatus(error.message);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    setBrandReport(null);
    setCustomerReport(null);
  }, [reportMode]);

  return (
    <div className="container">
      {report && (
        <div className="print-only">
          <h2>Reporte diario</h2>
          <div>Fecha: {date}</div>
          <div>Detalle: {reportDetail ? "Por venta" : "Resumen"}</div>
        </div>
      )}
      <h2>Reporte diario</h2>
      <div className="inline no-print" style={{ marginTop: 16 }}>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button onClick={loadReport}>Buscar</button>
        <label className="inline">
          <input
            type="checkbox"
            checked={reportDetail}
            onChange={(event) => setReportDetail(event.target.checked)}
          />
          Ver detalle por venta
        </label>
        <button className="secondary" onClick={() => window.print()} disabled={!report}>
          Imprimir
        </button>
      </div>
      {status && <div className="alert">{status}</div>}
      {report && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="badge">Total: {report.totalVendido}</div>
          <div>Cobrado en caja: {report.totalCobrado}</div>
          <div>Saldo pendiente: {report.saldoPendiente}</div>
          <div>Envío por rendir (cadete): {report.totalEnvioCadete}</div>
          <div>Ventas: {report.cantidadVentas}</div>
          <div>
            <strong>Totales por método</strong>
            <ul>
              {Object.entries(report.totalesPorMetodo).map(([metodo, total]) => (
                <li key={metodo}>{metodo}: {total}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Ventas</strong>
            {reportDetail ? (
              <ul>
                {report.ventas.map((venta) => (
                  <li key={venta._id}>
                    {new Date(venta.fechaHora).toLocaleTimeString()} - {venta.customerNombreSnapshot || "Sin cliente"} - {venta.total}
                    <ul>
                      {venta.items?.map((item, index) => (
                        <li key={`${venta._id}-${index}`}>
                          {item.descripcionSnapshot} · {item.cantidad} x {item.precioUnitario} = {item.subtotal}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {report.ventas.map((venta) => (
                  <li key={venta._id}>
                    {new Date(venta.fechaHora).toLocaleTimeString()} - {venta.customerNombreSnapshot || "Sin cliente"} - {venta.total}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: 24 }}>
        <h2>Reporte por marca</h2>
        <div className="grid grid-3">
          <label>
            Tipo de reporte
            <select value={reportMode} onChange={(event) => setReportMode(event.target.value)}>
              <option value="marca">Por marca</option>
              <option value="cliente">Por cliente</option>
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={brandDate} onChange={(event) => setBrandDate(event.target.value)} />
          </label>
          <label>
            Desde
            <input
              type="date"
              value={brandStartDate}
              onChange={(event) => setBrandStartDate(event.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={brandEndDate}
              onChange={(event) => setBrandEndDate(event.target.value)}
            />
          </label>
          {reportMode === "marca" ? (
            <label>
              Marca
              <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="">Todas</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Cliente
              <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">Seleccionar</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>{customer.nombre}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="inline">
          <button onClick={reportMode === "marca" ? loadBrandReport : loadCustomerReport}>
            Buscar
          </button>
        </div>
        {reportMode === "marca" && brandReport && (
          <div className="stack" style={{ marginTop: 12 }}>
            {brandReport.marca && (
              <div className="badge">Marca filtrada: {brandReport.marca}</div>
            )}
            <ul>
              {brandReport.marcas.map((marca) => (
                <li key={marca.marca}>
                  {marca.marca}: {marca.total} · Cantidad: {marca.cantidad}
                </li>
              ))}
            </ul>
          </div>
        )}
        {reportMode === "cliente" && customerReport && (
          <div className="stack" style={{ marginTop: 12 }}>
            <div>Total: {customerReport.total}</div>
            <div>Total cobrado: {customerReport.totalCobrado}</div>
            <div>Saldo pendiente: {customerReport.saldoPendiente}</div>
            <ul>
              {customerReport.ventas.map((venta) => (
                <li key={venta._id}>
                  {new Date(venta.fechaHora).toLocaleTimeString()} - {venta.total}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
