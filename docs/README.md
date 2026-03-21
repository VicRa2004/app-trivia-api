# Documentación de la API Trivia

Bienvenido a la documentación oficial para el Frontend. Esta guía está dividida en varias secciones para asegurar una integración robusta, escalable y siguiendo las mejores prácticas.

## Índice

1. [Autenticación y Seguridad](./01-authentication.md)
2. [REST API y Paginación](./02-rest-api.md)
3. [Motor de Juego (WebSockets)](./03-websockets.md)
4. [Manejo de Errores](./04-error-handling.md)

---

### Descripción General del Proyecto

- **Stack HTTP:** RESTful con JSON.
- **Stack Tiempo Real:** WebSockets (Socket.IO).
- **Seguridad:** JSON Web Tokens (JWT).
- **Base de Datos:** PostgreSQL vía Prisma ORM.

Si necesitas probar los endpoints REST rápidamente, recuerda que el entorno de desarrollo expone la interfaz interactiva de Swagger en la ruta `/api` (ej. `http://localhost:3000/api`).
