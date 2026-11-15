# NEPTUNO 2.0 — Batalla Naval

Juego estático preparado para GitHub Pages, sin compilación ni servidor propio.

## Modos

- 1 jugador contra computadora.
- 2 jugadores en un mismo dispositivo, por turnos y pantalla privada.
- Salas multijugador online para **2, 3, 4, 5 o 6 jugadores**, cada uno con su propio dispositivo.

## Multijugador

1. Entrá en **Multijugador online** y seleccioná entre 2 y 6 participantes.
2. Creá una sala y compartí el enlace o el código.
3. Cuando todos entren, cada uno coloca sus 5 barcos en secreto y confirma.
4. Los turnos se alternan entre los jugadores aún activos; antes de disparar elegí a qué rival atacar.
5. Los tiros conocidos se muestran en el radar de cada objetivo y no se pueden repetir. Cuando un jugador pierde sus cinco barcos, queda como espectador. El último con barcos gana.

### Conexión y límites

La versión web usa PeerJS/WebRTC, con **anfitrión como coordinador** (topología estrella). Los tableros secretos no se envían al anfitrión: el dispositivo atacado calcula los resultados. Se requiere conexión a Internet y **que el anfitrión permanezca conectado durante toda la partida**. Algunas combinaciones de redes, cortafuegos y NAT pueden impedir conexiones P2P; sin un servicio TURN o backend propio no se garantiza conexión en todas las redes ni se ofrecen reconexión tras pérdida de conexión, antitrampas centralizado o salas persistentes.

## Gráficos y sonidos

Barcos con detalles y orientación, texturas de agua, tablero animado, impactos y secuencia cinematográfica de hundimiento con explosión, fuego, burbujas y sonido. Se puede silenciar desde el icono superior.

## Publicación

Abrí `index.html` o subí este archivo a una carpeta publicada en GitHub Pages. No necesita Node, base de datos ni otras carpetas; requiere Internet para cargar PeerJS y las fuentes web.

## Pruebas

- Sintaxis JavaScript validada.
- Interfaz móvil individual probada en Chromium.
- Animación de hundimiento y limpieza del overlay probadas en Chromium.
- Flujo de partida multijugador en simulación de PeerJS de 2 a 6 participantes validado (lobby, preparación, turnos, objetivos y ganador tras eliminaciones).
- **Pendiente:** prueba de conexión P2P real entre dispositivos en redes independientes.