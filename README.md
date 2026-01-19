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
MONGODB_URI=mongodb://127.0.0.1:27017/quicksales
```

### client/.env
```
VITE_API_URL=http://127.0.0.1:4000
```

## Seed (datos de ejemplo)
Incluye 5 ventas de prueba y usuarios de ejemplo (por defecto `matias / 1023`).
```bash
cd server
npm run seed
```
> Nota: asegurate de tener MongoDB en ejecución antes de iniciar el backend o el seed.

## Atajos de teclado (venta)
- **F2**: enfocar descripción de producto.
- **F4**: enfocar cliente.
- **F6**: enfocar pagos.
- **Enter**: agregar ítem / confirmar cliente.
- **↑ / ↓**: navegar ítems.
- **Ctrl+Backspace** o **Delete**: eliminar ítem.
- **Ctrl+Enter**: guardar venta.
- **Esc**: cancelar/limpiar venta.

## Envíos y saldos
- Si el envío está **incluido en el pago**, el total se cobra en caja junto con el resto de la venta.
- Si el cliente **paga el envío al cadete**, el envío queda marcado como “cadete debe rendir” y no se exige en los pagos de caja.
- Se permiten pagos parciales: el saldo pendiente queda registrado en la venta y en el reporte diario.
- En el cierre de caja, los saldos pendientes quedan en 0; los importes del cadete permanecen pendientes para rendirse al día siguiente (o se marcan manualmente con el endpoint de cadete).
- Las ventas quedan **pendientes** salvo que se marque “pago en el momento”.
- Ventas pendientes pueden saldarse con `POST /api/sales/:id/payments`.
- Cambios en ventas se registran en auditoría interna.
- El cierre de caja es inmutable; ajustes posteriores se registran con notas de crédito/débito.
- El cierre de caja **no incluye el envío**, ya que es un dinero a rendir al cadete.
- Productos admiten marca y atributos (lista simple separada por comas).

## Endpoints principales
- `POST /api/products`
- `GET /api/products?query=`
- `POST /api/customers`
- `GET /api/customers?query=`
- `POST /api/sales`
- `GET /api/sales?date=YYYY-MM-DD&status=PENDIENTE`
- `PATCH /api/sales/:id`
- `POST /api/sales/:id/payments`
- `PATCH /api/sales/:id/cadete-rendido`
- `GET /api/reports/daily?date=YYYY-MM-DD`
- `POST /api/cash-closures`
- `GET /api/cash-closures?date=YYYY-MM-DD&detail=true`
- `POST /api/credit-notes`
- `GET /api/credit-notes?saleId=`
- `POST /api/auth/login`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `POST /api/cash-movements`
- `GET /api/cash-movements?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&descripcion=`

## Decisiones MVP
- Estado local con React hooks por simplicidad y velocidad.
- Búsqueda de productos/clientes por coincidencia parcial (suggestions) y exacta case-insensitive en backend.
- Totales en ARS sin decimales (redondeo a enteros).
- Pantallas de productos y clientes incluyen alta rápida además de búsqueda.
- La pantalla de ventas permite ver detalle, imputar pagos pendientes y emitir notas de crédito/débito.
- Login simple con usuarios locales (seed incluye `matias / 1023`).
- Movimientos de caja permiten registrar depósitos, pagos y retiros con filtros por fecha/descripcion.
- Transferencias requieren cuenta/alias en pagos y notas.
