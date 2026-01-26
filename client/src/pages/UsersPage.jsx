import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", active: true });
  const [status, setStatus] = useState("");

  const loadUsers = async () => {
    try {
      const data = await apiFetch("/api/users");
      setUsers(data);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const createUser = async () => {
    if (!form.username || !form.password) {
      setStatus("Usuario y contraseña obligatorios.");
      return;
    }
    try {
      await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify(form)
      });
      setForm({ username: "", password: "", active: true });
      setStatus("Usuario creado.");
      loadUsers();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const toggleUser = async (user) => {
    try {
      await apiFetch(`/api/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active })
      });
      loadUsers();
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container">
      <h2>Usuarios</h2>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Usuario
          <input
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={createUser}>Crear usuario</button>
        </div>
      </div>

      <table className="table" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.active ? "Sí" : "No"}</td>
              <td>
                <button className="ghost" onClick={() => toggleUser(user)}>
                  {user.active ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="3" className="helper">Sin usuarios.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
