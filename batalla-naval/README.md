# NEPTUNO 2.1 — Batalla Naval

Juego estático preparado para GitHub Pages, sin compilación ni servidor propio.

## Modos

- 1 jugador contra computadora.
- 2 jugadores en un mismo dispositivo, por turnos y pantalla privada.
- Salas multijugador online para **2, 3, 4, 5 o 6 jugadores**, cada uno con su propio dispositivo.

## Multijugador

1. Entrá en **Multijugador online** y seleccioná entre 2 y 6 participantes.
2. Creá una sala y compartí el enlace o el código de **6 caracteres** (por ejemplo, `K7M4TX`). El ID completo de PeerJS se construye automáticamente; las invitaciones anteriores siguen aceptándose.
3. Cuando todos entren, cada uno coloca sus 5 barcos en secreto y confirma.
4. Los turnos se alternan entre los jugadores aún activos; antes de disparar elegí a qué rival atacar.
5. Los tiros conocidos se muestran en el radar de cada objetivo y no se pueden repetir. Cuando un jugador pierde sus cinco barcos, queda como espectador. El último con barcos gana.

### Conexión y límites

La versión web usa PeerJS/WebRTC, con **anfitrión como coordinador** (topología estrella). Los tableros secretos no se envían al anfitrión: el dispositivo atacado calcula los resultados. Se requiere conexión a Internet y **que el anfitrión permanezca conectado durante toda la partida**. Algunas combinaciones de redes, cortafuegos y NAT pueden impedir conexiones P2P; sin un servicio TURN o backend propio no se garantiza conexión en todas las redes ni se ofrecen reconexión tras pérdida de conexión, antitrampas centralizado o salas persistentes.

## Gráficos y sonidos

Barcos con detalles y orientación, texturas de agua, tablero animado, impactos y secuencia cinematográfica de hundimiento con explosión, fuego, burbujas y sonido. El evento de hundimiento se transmite a **todos los dispositivos**, incluidos los espectadores; se bloquean los siguientes disparos hasta terminar la animación.

**Narrador en español:** usando `speechSynthesis` del navegador anuncia «Turno de <nombre>» y «Barco hundido» (incluido el nombre de la víctima). El narrador y los efectos de sonido se activan/desactivan por separado con dos botones en la cabecera. La disponibilidad, voz exacta y reproducción automática dependen de cada navegador y de los permisos de audio; en iOS podría requerir tocar el botón de voces.

## Publicación

Abrí `index.html` o subí este archivo a una carpeta publicada en GitHub Pages. No necesita Node, base de datos ni otras carpetas; requiere Internet para cargar PeerJS y las fuentes web.

## Pruebas

- Sintaxis JavaScript validada.
- Interfaz móvil individual probada en Chromium.
- Animación de hundimiento y limpieza del overlay probadas en Chromium.
- Flujo multijugador simulado de 2 a 6 participantes: código corto, registro de salas, anuncios con nombre, hundimiento recibido y mostrado en todos los clientes y bloqueo de turnos durante el efecto.
- Interfaz visual en celular, botones de voz y duración del hundimiento comprobados con Chromium.
- **Pendiente:** prueba de conexión P2P real entre dispositivos en redes independientes.