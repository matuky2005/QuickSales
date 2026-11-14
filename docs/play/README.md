# Zombie Plague Web — Prueba del motor real (pre-alfa 0.4)

Este experimento es distinto de la demo gráfica: intenta inicializar **Xash3D WebAssembly + CS16Client** con un ZIP de archivos propios. No incluye los contenidos de Valve, plugins Zombie Plague, bots ni un servidor.

## Cómo probar desde Chrome en iPhone
1. Desde una instalación legítima de Counter-Strike 1.6, prepará un ZIP con **dos carpetas en la raíz:** `valve/` y `cstrike/`. Dentro de `cstrike/maps/` tiene que haber mapas `.bsp` como `de_dust2.bsp`.
2. Copiá el ZIP al almacenamiento del iPhone (por ejemplo, Archivos o iCloud Drive). No lo subas al repositorio.
3. Abrí `https://raw.githack.com/matuky2005/QuickSales/zombie-plague-pages/docs/play/index.html` desde Chrome. Girá el teléfono a horizontal.
4. Elegí el ZIP con **Seleccionar archivos** y tocá **Iniciar motor**.
5. Si falla, copiá el mensaje de `Registro de inicio` y compartilo, incluyendo los errores de consola si están disponibles.

## Funciones de la fase
- Selección local de ZIP, validación de rutas, carga de archivos en el FS virtual de Emscripten.
- Descarga del motor libre Xash3D y CS16Client desde jsDelivr.
- Intento de iniciar el mapa `de_dust2` y ejecutar comandos táctiles desde joystick y botones.
- Dos modos de apuntado experimentales, ambos sin validar en WebKit iOS.

## Limitaciones y advertencias
- **No se verificó una partida real en iPhone.** El ZIP de juego puede exigir varios cientos de MB de RAM y iOS puede cerrar la pestaña.
- El sistema de archivos se carga en memoria volátil. Al recargar, se pierde. El ZIP **no se envía al servidor web**.
- El modo de apuntado virtual puede no funcionar con el port de Xash3D, por el tratamiento de eventos no confiables de WebKit.
- La red multijugador requiere servidor dedicado con WebRTC. GitHub Pages no puede ejecutarlo.
- Zombie Plague se añade después de confirmar que el cliente real funciona, mediante servidor con AMX Mod X/Metamod.
- Los artefactos dependientes de terceros se cargan dinámicamente del CDN; pueden fallar por falta de conectividad o cambios de versiones.
- No publiques ZIP de material propietario de Valve ni credenciales en GitHub.

## Archivos
- `index.html`: interfaz de carga y HUD.
- `app.js`: arranque y carga del motor, consola de diagnóstico.
- `controls.js`: control multitáctil y envío de comandos.
- `style.css`: diseño apaisado para pantalla de teléfono.

## Referencia técnica
Basado en los ejemplos del repositorio `sealdev224/webxash3d-fwgs-cstrike`, especialmente `examples/raw-html-cs16/index.html`.

