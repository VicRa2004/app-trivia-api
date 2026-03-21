# 1. Autenticación y Seguridad

Toda la aplicación se protege utilizando **JSON Web Tokens (JWT)**. Para acceder a rutas protegidas o participar en las salas de WebSockets, el cliente debe estar autenticado.

---

## 1.1. Iniciar Sesión (Login)

**Ruta:** `POST /auth/login`  
**Acceso:** Público

### Body (Request)
```json
{
  "email": "juan@example.com",
  "password": "Password123!"
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "juanp",
    "email": "juan@example.com"
  }
}
```

### Posibles Errores
- `401 Unauthorized`: "Credenciales inválidas" (contraseña incorrecta o correo no existe).
- `400 Bad Request`: Faltan campos obligatorios.

---

## 1.2. Registro (Register)

**Ruta:** `POST /auth/register`  
**Acceso:** Público

### Body (Request)
```json
{
  "fullName": "Juan Pérez",
  "username": "juanp",
  "email": "juan@example.com",
  "password": "Password123!",
  "age": 25,
  "preferredLanguage": "es"
}
```
*(Nota: `age` y `preferredLanguage` son opcionales según el esquema, pero recomendados).*

### Response (201 Created)
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": "uuid-del-usuario",
    "fullName": "Juan Pérez",
    "username": "juanp",
    "email": "juan@example.com"
  }
}
```

### Posibles Errores
- `400 Bad Request`: "El usuario o el email ya están registrados".
- `400 Bad Request`: Errores de validación (ej. el email no tiene formato válido, el password es muy corto).

---

## 1.3. Uso del Token JWT

Una vez que obtienes el `access_token`, debes incluirlo en todas las peticiones subsecuentes hacia rutas protegidas.

### En HTTP REST
Agrega el siguiente Header en la petición:
```http
Authorization: Bearer <TU_ACCESS_TOKEN>
```

### En WebSockets
En cada evento que emitas, debes incluirlo dentro del payload (data) del evento:
```json
{
  "gamePin": "123456",
  "token": "<TU_ACCESS_TOKEN>"
}
```
*(Se usa este método en lugar de interceptar la conexión puramente para dar más flexibilidad de reconexión y manejo de errores dinámicos).*
