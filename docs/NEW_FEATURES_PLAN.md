# Plan de Evolución: Modo Kahoot Avanzado

Este documento detalla las modificaciones y pasos necesarios que deberán implementarse (sin modificar la base actual todavía) para cumplir con las características completas tipo Kahoot! mencionadas: Diferentes tipos de preguntas, imágenes granulares y soporte para límites de respuestas en trivias privadas.

---

## FASE 1: Evolución del Esquema de Datos (Prisma)

Aunque la base de datos ya cuenta con el Enum de 5 tipos de preguntas y límites de tiempo, necesita ajustes para soportar los nuevos requerimientos multimedia y lógicos.

1. **Agregar Imágenes a Preguntas y Opciones:**
   - En el modelo `Question`: Agregar el campo `imageUrl String? @map("image_url")`. Así la pregunta puede ser "Identifica el animal de la foto".
   - En el modelo `Option`: Agregar el campo `imageUrl String? @map("image_url")`. Esto es indispensable para el modo `image_choice` (1 de 4 imágenes).
2. **Garantizar Posiciones Obligatorias:**
   - En el modelo `Option`, el campo `position Int?` debe volverse vital para el tipo de pregunta de `ordering` (ej. ordenar eventos históricos cronológicamente de posición 1 a 4).

---

## FASE 2: Modificación de la Autoevaluación en Sockets (`game.service.ts`)

Actualmente, el motor evalúa si acertaste buscando la opción marcada con `isCorrect = true`. Esto es suficiente para Opción Múltiple, Falso/Verdadero y Seleccionar Imagen, pero **debemos de rediseñar `submitAnswer` basado en `questionType`**:

1. **Lógica `short_answer` (Texto Libre):**
   - El front enviará un texto en el Payload `optionId` (o en un nuevo campo `givenAnswer`).
   - El backend deberá correr un filtrado (convertir a minúsculas, limpiar acentos/espacios) y compararlo contra el `content` de las opciones correctas.
2. **Lógica `ordering`:**
   - El front enviará un Array `["uuid-opt3", "uuid-opt1", ...]` representando el orden que eligió el jugador.
   - El backend verificará matemáticamente si ese Array coincide con el `position` oficial de cada Option.
3. **Puntajes Específicos:**
   - La validación `timeElapsedMs` contra `timeLimit` funcionará idénticamente para dar el % de puntaje.

---

## FASE 3: Lógica Condicional de Trivias Privadas (Top 5)

La diferencia radical entre `isPublic` normal y Privado requiere un contador de memoria en el Gateway.

1. **Estado en Memoria Actualizado:**
   - En el objeto de estado del juego de `game.service.ts`, debemos registrar cuántos jugadores han respondido correctamente a la *pregunta actual*.
   - Ex. `currentQuestionCorrectAnswersCount: number`.
2. **Mecánica Top 5 Activa:**
   - Al detectar y confirmar si el quiz arrancó desde un estado `isPublic: false` (Privado), el motor activa un firewall.
   - Cuando llega el evento `submit_answer` de un usuario y éste lo tiene correcto, sumamos +1 a `currentQuestionCorrectAnswersCount`.
   - Si ese contador excede `5`, y entra un sexto jugador correcto, el servidor **rechaza su puntaje** (le emite `success: false, message: "Demasiado tarde, cupo de respuestas lleno"`).
3. **Mecánica Pública:**
   - El firewall de contadores se ignora. Todos juegan hasta que el `timeLimit` o el Host presione mostrar respuestas.

---

## FASE 4: Actualización de la REST API y la Documentación Frontend

Una vez implementada la lógica dura, necesitamos exponer estas actualizaciones para que el CLI o Dashboard web puedan cargarlas correctamente:

1. **Actualizar DTOs:**
   - `CreateQuestionDto` y `CreateOptionDto` deberán aceptar `imageUrl` opcionales en sus clases validadoras `@IsOptional() @IsUrl()`.
   - Validar que, si envían preguntas tipo `ordering`, el campo `position` de las opciones no vaya vacío mediante *Custom Decorators* de `class-validator`.
2. **Actualizar Documentación Swagger / Guía MD:**
   - Exponer en `02-rest-api.md` cómo enviar el payload JSON para una pregunta tipo *Respuesta Corta*, *Ordenamiento* y *Selección de Imagen*.
   - Exponer en `03-websockets.md` los nuevos keys dentro de los eventos, como subir arrays en la Payload de WebSockets si estamos respondiendo a un minijuego de *Ordering*.
