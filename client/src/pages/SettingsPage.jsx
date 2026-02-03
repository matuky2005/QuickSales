import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const SettingsPage = () => {
  const [oficial, setOficial] = useState("");
  const [blue, setBlue] = useState("");
  const [status, setStatus] = useState("");

  const loadSettings = async () => {
    try {
      const data = await apiFetch("/api/settings/dolar");
      if (data?.oficial) setOficial(data.oficial);
      if (data?.blue) setBlue(data.blue);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const saveSettings = async () => {
    try {
      await apiFetch("/api/settings/dolar", {
        method: "PUT",
        body: JSON.stringify({
          oficial: Number(oficial || 0),
          blue: Number(blue || 0)
        })
      });
      setStatus("Cotización guardada.");
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
        <button onClick={saveSettings}>Guardar cotización</button>
        <button className="secondary" onClick={fetchFromAmbito}>
          Importar desde Ámbito
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
