import React, { useState } from "react";
import { apiFetch } from "../utils/api.js";

const ProductsPage = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);

  const buscar = async () => {
    if (!query.trim()) return;
    const data = await apiFetch(`/api/products?query=${encodeURIComponent(query)}`);
    setProducts(data);
  };

  return (
    <div className="container">
      <h2>Productos</h2>
      <div className="inline" style={{ marginTop: 16 }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
        <button onClick={buscar}>Buscar</button>
      </div>
      <ul style={{ marginTop: 16 }}>
        {products.map((product) => (
          <li key={product._id}>
            {product.descripcion} - Sugerido: {product.precioSugerido}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductsPage;
