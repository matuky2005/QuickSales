import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

const ProductsPage = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [precioSugerido, setPrecioSugerido] = useState("");
  const [marca, setMarca] = useState("");
  const [atributosInput, setAtributosInput] = useState("");
  const [status, setStatus] = useState("");

  const buscar = async () => {
    try {
      const params = query.trim()
        ? `?query=${encodeURIComponent(query)}`
        : "";
      const data = await apiFetch(`/api/products${params}`);
      setProducts(data);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const crearProducto = async () => {
    if (!descripcion.trim()) return;
    try {
      const product = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          descripcion: descripcion.trim(),
          marca: marca.trim(),
          atributos: atributosInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          precioSugerido: Number(precioSugerido || 0)
        })
      });
      setStatus("Producto guardado.");
      setDescripcion("");
      setPrecioSugerido("");
      setMarca("");
      setAtributosInput("");
      setProducts((prev) => [product, ...prev]);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  return (
    <div className="container">
      <h2>Productos</h2>
      {status && <div className="alert">{status}</div>}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <label>
          Descripción
          <input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        </label>
        <label>
          Marca
          <input value={marca} onChange={(event) => setMarca(event.target.value)} />
        </label>
        <label>
          Atributos (coma)
          <input
            value={atributosInput}
            onChange={(event) => setAtributosInput(event.target.value)}
          />
        </label>
        <label>
          Precio sugerido
          <input
            type="number"
            value={precioSugerido}
            onChange={(event) => setPrecioSugerido(event.target.value)}
          />
        </label>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button onClick={crearProducto}>Guardar producto</button>
        </div>
      </div>
      <div className="inline" style={{ marginTop: 16 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        <button onClick={buscar}>Buscar</button>
      </div>
      <ul style={{ marginTop: 16 }}>
        {products.map((product) => (
          <li key={product._id}>
            {product.descripcion} {product.marca ? `(${product.marca})` : ""} - Sugerido: {product.precioSugerido}
            {product.atributos?.length ? ` · ${product.atributos.join(", ")}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductsPage;
