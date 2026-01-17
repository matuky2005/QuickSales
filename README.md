# QuickSales POS (MERN)

Sistema POS minimalista orientado a velocidad y uso 100% con teclado.

## Requisitos
- Node.js 18+
- MongoDB local o remoto

## Instalación

### Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

### server/.env
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/quicksales
```

### client/.env
```
VITE_API_URL=http://localhost:4000
```

## Seed (datos de ejemplo)
Incluye 5 ventas de prueba.
```bash
cd server
npm run seed
```

## Atajos de teclado (venta)
- **F2**: enfocar descripción de producto.
- **F4**: enfocar cliente.
- **F6**: enfocar pagos.
- **Enter**: agregar ítem / confirmar cliente.
- **↑ / ↓**: navegar ítems.
- **Ctrl+Backspace** o **Delete**: eliminar ítem.
- **Ctrl+Enter**: guardar venta.
- **Esc**: cancelar/limpiar venta.

## Endpoints principales
- `POST /api/products`
- `GET /api/products?query=`
- `POST /api/customers`
- `GET /api/customers?query=`
- `POST /api/sales`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `POST /api/cash-closures`
- `GET /api/cash-closures?date=YYYY-MM-DD`

## Decisiones MVP
- Estado local con React hooks por simplicidad y velocidad.
- Búsqueda de productos/clientes por coincidencia parcial (suggestions) y exacta case-insensitive en backend.
- Totales en ARS sin decimales (redondeo a enteros).

