# 📢 Actualización Crítica para Frontend (V2.0)

¡Hola equipo Frontend! 👋 
La API y el motor de WebSockets han recibido una actualización titánica (`v2.0`) para soportar modalidades avanzadas estilo Kahoot!.

Hemos actualizado la documentación en la carpeta `docs/` (`02-rest-api.md` y `03-websockets.md`). 

A continuación, detallamos exactamente **qué cambió** y **qué tienes que ajustar en el código cliente** para no romper la aplicación:

---

## 1. Cambios en la REST API (Creación de Preguntas)

**Lo nuevo:** Hemos habilitado la capacidad multimedia (soporte de imágenes para el minijuego de *"Adivina la Foto"*).
- **Tu tarea:** Cuando consumas el endpoint para crear o editar preguntas (`POST /quizzes/:id/questions`), ahora debes permitir a los usuarios subir imágenes y mapear la URL en la nueva propiedad opcional `imageUrl` tanto a nivel **Pregunta** (`Question`) como a nivel **Opción** (`Option`).
- Las opciones también piden respetar estrictamente la llave `position: number` si están grabando el esquema asíncrono de una trivia tipo `ordering`.

> **Lee:** `docs/02-rest-api.md` (Sección 2.4 donde agregamos los 4 payloads de ejemplos).

---

## 2. Cambios Breaking (Ruptura) en WebSockets

> ⚠️ ¡Atención! El evento de enviar respuesta a través de Socket.IO rompió su contrato anterior. Tienes que actualizar tu `socket.emit`.

**El envío (`submit_answer`) cambió de estructura:**
Antes emitías el ID bajo el nombre `optionId: "xxx"`. 
**Ahora debes emitirlo como `answerPayload`**. Esto se hizo para permitir enviar Arrays o Texto Plano según el tipo de pregunta.

**Tu tarea: Modificar el Emit de esta forma:**
```javascript
// Si es de Opción Múltiple o Imagen (Mandas el UUID):
socket.emit("submit_answer", { 
  gamePin, token, timeElapsedMs,
  answerPayload: "uuid-opt-2" 
});

// Si es Texto Libre/Corto (Mandas lo que el user escribió):
socket.emit("submit_answer", { 
  gamePin, token, timeElapsedMs, 
  answerPayload: "Leonardo Da Vinci" 
});

// Si es Ordenamiento (Mandas un Array JSON de cómo los acomodó tu DnD UI):
socket.emit("submit_answer", { 
  gamePin, token, timeElapsedMs, 
  answerPayload: ["uuid-c", "uuid-a", "uuid-d"] 
});
```

---

## 3. Nueva UI Requerida: Alerta "Cupo de Ganadores Lleno"

Se le inyectó una regla de negocio nueva al Servidor.
Si un Quiz está configurado como **Privado** (`isPublic: false`), **solo los primeros 5 jugadores en contestar correctamente** se llevarán los puntos. A partir del sexto jugador que acierte, el backend le rebotará sus puntos.

**Tu tarea:**
En tu listener de respuesta, debes prepararte para un rechazo aunque el jugador haya contestado bien, mostrando una UI o Notificación tipo: *"¡Demasiado Tarde!"*.
```javascript
socket.on("answer_received", (response) => {
  if (response.success === false) {
    // Renderizar: response.message (ej. "Demasiado tarde, cupo de ganadores lleno")
    alert(response.message);
  } else {
    // Sumar puntos a su UI local local (response.newScore)
  }
})
```

---

## 4. Opciones Aleatorias Pre-procesadas

**Lo nuevo:** Ya no necesitas programar un validador de Fisher-Yates (Algoritmo Shuffle) en React, Vue, o Angular para desordenar botones en pantalla.
- El evento Socket `new_question` llegará con sus opciones matemáticamente desordenadas de forma aleatoria desde el Servidor para prevenir hacks del cliente (Solo aplica en modo *ordering* y *múltiple*).

¡Feliz Códificación! Ante dudas, revisa de nuevo el material completo en `/docs`.
