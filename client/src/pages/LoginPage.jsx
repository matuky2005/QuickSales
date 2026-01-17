import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const handleLogin = async () => {
    try {
      const user = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      localStorage.setItem("qs-user", JSON.stringify(user));
      setStatus("Sesión iniciada.");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2>Login</h2>
      {status && <div className="alert">{status}</div>}
      <div className="stack" style={{ marginTop: 16 }}>
        <label>
          Usuario
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button onClick={handleLogin}>Ingresar</button>
      </div>
    </div>
  );
};

export default LoginPage;
