# 3. Motor de Juego (WebSockets)

Toda la lógica en tiempo real para replicar una experiencia tipo Kahoot! vive en un Gateway de Socket.IO.

**URL del WebSocker:** `ws://localhost:3000` (El cliente oficial de Socket.io la resolverá como `http://localhost:3000`).

Para iniciar todo esto, el **Host/Presentador** debe crear la partida mediante REST HTTP:
**`POST /game/create/:quizId`** *(Protegido con JWT)*
Respuesta de éxito:
```json
{
  "gamePin": "123456",
  "sessionId": "uuid-game-session"
}
```
Con ese `gamePin`, todos (jugadores y Host) están listos para entrar al cuarto de Sockets.

> ⚠️ Todos los eventos EMITIDOS que verás abajo requieren un Payload base para autenticarte frente al Socket y asociarte al cuarto correcto:
> `{ "gamePin": "123456", "token": "eyJhbGciOiJIUz..." }`

---

## 3.1. Lobby & Conexión (`join_game`)

**[JUGADOR O HOST] Emite `join_game`**
Payload:
```json
{
  "gamePin": "123456",
  "token": "tu_jwt"
}
```

**[TODOS] Escuchan `player_joined`**
Una vez un jugador valida su PIN y Token, Socket.io avisa (Broadcast) a toda la sala de su llegada.
Payload:
```json
{
  "player": "juanp",
  "playersList": [
    { "userId": "uuid-1", "username": "maria", "score": 0 },
    { "userId": "uuid-2", "username": "juanp", "score": 0 }
  ]
}
```
*Útil para que el Celular diga "¡Estás dentro!" y que la Pantalla del Host dibuje los nombres saltando.*

---

## 3.2. Arrancar Partida (`start_game`)

**[HOST] Emite `start_game`**
**Payload Base:** `{ "gamePin", "token" }`

**[TODOS] Escuchan `game_started`**
Notifica que acabó el lobby.
Payload:
```json
{
  "message": "¡El host ha iniciado la partida! Preparaos..."
}
```

---

## 3.3. Ciclo de Preguntas: Entregar Pregunta (`next_question`)

**[HOST] Emite `next_question`**
**Payload Base:** `{ "gamePin", "token" }`

**[TODOS] Escuchan `new_question`** (o `all_questions_ended`)
El servidor escupe la pregunta actual para todos los tableros.
Payload `new_question`:
```json
{
  "index": 0,
  "total": 5,
  "question": {
    "id": "uuid-question",
    "text": "¿Capital de Japón?",
    "type": "multiple_choice",
    "points": 1000,
    "timeLimit": 20,
    "options": [
      { "id": "uuid-o1", "content": "Kioto" },
      { "id": "uuid-o2", "content": "Tokio" }
      // NOTA: NO INCLUYE `isCorrect`. Total contra trampas.
    ]
  }
}
```
Si ya se agotaron las preguntas, el payload que escucharán es `all_questions_ended`:
```json
{
  "message": "Fin de las preguntas."
}
```

---

## 3.4. Ciclo de Preguntas: Responder (`submit_answer`)

**[JUGADOR] Emite `submit_answer`**
Envía al servidor la opción elegida en su UI y cuánto tardó en picarle.
Payload extendido:
```json
{
  "gamePin": "123456",
  "token": "tu_jwt",
  "optionId": "uuid-o2",
  "timeElapsedMs": 3500
}
```
*(Se usa `timeElapsedMs` para penalizar la lentitud. Responde rápido = más puntos. Responder después de los 20 segundos restará considerablemente los puntos otorgados al 50% mínimo, que es la logica base Kahoot)*.

**[JUGADOR] Escucha `answer_received`** (Esto SÓLO le llega a quien respondió).
El servidor acusa recibo, valida si es correcta temporalmente en RAM y actualiza su score local.
Payload `answer_received`:
```json
{
  "success": true,
  "pointsScored": 890,
  "newScore": 1450
}
```
*Si falló, lanzará puntos cero. Si intentó responder 2 veces, mandará `success: false`.*

---

## 3.5. Ciclo de Preguntas: Revelar (`show_correct_answer`)

**[HOST] Emite `show_correct_answer`**
*(Cuando su temporizador gigante de 20s en UI llega a 0)*.

**[TODOS] Escuchan `correct_answer_revealed`**
El servidor quita el velo, dice quién tenía la razón y genera un mini PODIO PARCIAL para actualizar posiciones en pantalla (Top 5).
Payload `correct_answer_revealed`:
```json
{
  "correctOptions": ["uuid-o2"],
  "currentRanking": [
    { "username": "maria", "score": 2300 },
    { "username": "juanp", "score": 1450 }
  ]
}
```
*(El ciclo vuelve a repetirse desde el paso 3.3 con el Host apretando "Siguiente Pregunta").*

---

## 3.6. Cierre Magnífico (`finish_game`)

**[HOST] Emite `finish_game`**

**[TODOS] Escuchan `game_finished`**
El servidor cierra la sala entera, toma todos los puntos de la memoria RAM y hace un **DUMP transaccional en PostgreSQL** creando la tabla `Attempt` para registrar la jugada real con el progreso en Score, Responses y Timestamps de todos.
Payload `game_finished`:
```json
{
  "message": "El juego ha finalizado. Aquí los resultados:",
  "podium": [
    { "username": "maria", "score": 8900 },
    { "username": "juanp", "score": 7500 },
    { "username": "pedro", "score": 4200 }
  ]
}
```
Inmediatamente tras recibir esto, el Servidor va a expulsar forzosamente (disconnect/leave) a todos los Sockets involucrados en la sala `"123456"` para prevenir inyección de cache fantasma.
