import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const SettingsPage = () => {
  const [oficial, setOficial] = useState("");
  const [blue, setBlue] = useState("");
  const [ticketHeader, setTicketHeader] = useState("");
  const [ticketFooter, setTicketFooter] = useState("");
  const [ticketWidth, setTicketWidth] = useState(58);
  const [showDate, setShowDate] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [status, setStatus] = useState("");

  const loadSettings = async () => {
    try {
      const [dolarData, ticketData] = await Promise.all([
        apiFetch("/api/settings/dolar"),
        apiFetch("/api/settings/ticket")
      ]);
      if (dolarData?.oficial) setOficial(dolarData.oficial);
      if (dolarData?.blue) setBlue(dolarData.blue);
      if (ticketData) {
        setTicketHeader(ticketData.header || "");
        setTicketFooter(ticketData.footer || "");
        setTicketWidth(ticketData.width || 58);
        setShowDate(Boolean(ticketData.showDate));
        setShowTime(Boolean(ticketData.showTime));
      }
    } catch (error) {
      setStatus(error.message);
    }
  };

  const saveSettings = async () => {
    try {
      await Promise.all([
        apiFetch("/api/settings/dolar", {
          method: "PUT",
          body: JSON.stringify({
            oficial: Number(oficial || 0),
            blue: Number(blue || 0)
          })
        }),
        apiFetch("/api/settings/ticket", {
          method: "PUT",
          body: JSON.stringify({
            header: ticketHeader,
            footer: ticketFooter,
            width: Number(ticketWidth || 0),
            showDate,
            showTime
          })
        })
      ]);
      setStatus("Configuraciones guardadas.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const fetchFromAmbito = async () => {
    try {
      const data = await apiFetch("/api/exchange-rates/dolar");
      if (data?.oficial?.venta) setOficial(data.oficial.venta);
      if (data?.blue?.venta) setBlue(data.blue.venta);
      setStatus("Cotización importada.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="container">
      <h2>Configuraciones</h2>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Dólar oficial (venta)
          <input
            type="number"
            value={oficial}
            onChange={(event) => setOficial(event.target.value)}
          />
        </label>
        <label>
          Dólar blue (venta)
          <input
            type="number"
            value={blue}
            onChange={(event) => setBlue(event.target.value)}
          />
        </label>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <button onClick={saveSettings}>Guardar configuraciones</button>
        <button className="secondary" onClick={fetchFromAmbito}>
          Importar desde Ámbito
        </button>
      </div>
      <h3 style={{ marginTop: 24 }}>Formato de ticket</h3>
      <div className="grid grid-3" style={{ marginTop: 8 }}>
        <label>
          Encabezado
          <textarea
            rows="3"
            value={ticketHeader}
            onChange={(event) => setTicketHeader(event.target.value)}
          />
        </label>
        <label>
          Pie
          <textarea
            rows="3"
            value={ticketFooter}
            onChange={(event) => setTicketFooter(event.target.value)}
          />
        </label>
        <label>
          Ancho (mm)
          <input
            type="number"
            value={ticketWidth}
            onChange={(event) => setTicketWidth(event.target.value)}
          />
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={showDate}
            onChange={(event) => setShowDate(event.target.checked)}
          />
          Mostrar fecha
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={showTime}
            onChange={(event) => setShowTime(event.target.checked)}
          />
          Mostrar hora
        </label>
      </div>
    </div>
  );
};

export default SettingsPage;
