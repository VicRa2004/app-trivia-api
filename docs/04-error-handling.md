# 4. Manejo de Errores Estandarizados

Ya sea que estés consumiendo los Endpoints REST o el canal WebSocket, el backend cuenta con validadores globales fuertes (vía `class-validator`) que siempre te avisarán exactamente cuándo el payload está mal formato o rompe una regla de negocio.

---

## 4.1. Errores HTTP REST

NestJS tiene un patrón universal estricto para retornar las excepciones HTTP. Si tu Frontend hace la petición mediante `axios` o `fetch` y recibes un estatús _distinto_ a `2xx`, el Body del error será idéntico a este:

### Error Clásico 404/403/401
Aplica para: **Not Found**, **Forbidden**, **Unauthorized**.
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

### Error de Validación (Payload Incorrecto) 400
Aplica para: **Bad Request**. *(Ej. Falta un campo requerido de un formulario).*
Aquí, el campo `message` suele convertirse en un **Array** enumerando **todos los problemas de validación detectados a la vez**:
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be a string",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```
*(💡 Recomendación Frontend: Si vas a renderizar toast notifications, es muy útil hacer un `.join(', ')` sobre la propiedad `error.response.data.message` en caso de ser Array).*

---

## 4.2. Errores en WebSockets

El cliente WebSocket no tira "estatutos HTTP" ni rompe tu interfaz web repentinamente. En su lugar, el Gateway de juego intercepta tu petición y te dispara a ti personalmente un evento de escape llamado **`error`**.

### Evento `error`
**[JUGADOR U HOST] Escucha `error`** (Localmente).
Si envías un JWT vencido, si intentas iniciar el juego sin ser el Host, o si intentas responder cuando la pregunta no existe, el socket no va a parar la partida entera, solo te responderá a ti.
Payload:
```json
{
  "message": "Solo el host puede iniciar"
}
// También muy común:
{
  "message": "Token inválido o expirado"
}
```

Asegúrate de tener un *Listner* universal en tu código de Frontend para atrapar esta campana:
```javascript
socket.on("error", (err) => {
  alert(`Ups: ${err.message}`);
});
```
