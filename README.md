<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <h1>Trivia App API</h1>
  <p><strong>Un motor de Trivia en Tiempo Real (estilo Kahoot!) construido sobre NestJS</strong></p>
</div>

---

## Descripción del Proyecto

**Trivia App API** es un backend robusto de alto rendimiento diseñado para gestionar partidas de trivias interactivas. Se divide en dos poderosas capas:

1. **API RESTful:** Encargada de la administración de Usuarios, Categorías, y el CRUD completo de Cuestionarios (Quizzes) y sus métricas.
2. **WebSocket Gateway:** Un motor de juego impulsado por **Socket.IO** que maneja salas en tiempo real, sincronización de preguntas, marcadores en vivo (Leaderboards) y distribución de puntos, todo mientras mitiga mecánicas de trampa del lado del cliente.

## Características Principales

- **Autenticación y Seguridad:** JWT (JSON Web Tokens) con contraseñas encriptadas nativamente (Bcrypt) y guardias (Guards) granulares.
- **Gestión Documental:** Rutas REST completamente paginadas y predecibles.
- **Salas Multiplayer:** Hosts pueden crear salas con su propio PIN de 6 dígitos donde múltiples jugadores pueden emparejarse en tiempo real.
- **Motor de Puntos Dinámico:** El tiempo que tarda un jugador en responder afecta su puntaje final, calculando multiplicadores y bonificaciones al vuelo.
- **Auto-Documentación Dinámica:** Generación de Open API (Swagger) inyectada directamente en código para un _Developer Experience_ impecable.

---

## Stack Tecnológico

|                  Tecnología                   | Rol en el Proyecto                                                  |
| :-------------------------------------------: | :------------------------------------------------------------------ |
|       **[NestJS](https://nestjs.com/)**       | Framework Node.js progresivo y modular.                             |
|   **[Prisma ORM](https://www.prisma.io/)**    | Mapeo objeto-relacional (Tipado seguro de extremo a extremo).       |
| **[PostgreSQL](https://www.postgresql.org/)** | Base de datos relacional sólida y escalable.                        |
|      **[Socket.IO](https://socket.io/)**      | Comunicación bidireccional en tiempo real para el entorno de juego. |
|      **[Swagger](https://swagger.io/)**       | Documentación de la API Interactiva visual.                         |

---

## ⚙️ Requisitos Previos

Antes de poder levantar el ecosistema en tu máquina, requieres de:

- [Node.js](https://nodejs.org/) (v18 o superior).
- Base de datos PostgreSQL local o en la nube (ej., Supabase, Neon).

## Instalación y Puesta en Marcha

**1. Clonar el repositorio y descargar dependencias:**

```bash
git clone https://github.com/VicRa2004/app-trivia-api.git
cd app-trivia-api
npm install
```

**2. Configurar Entorno (`.env`):**
Duplica o crea un archivo `.env` en la raíz del proyecto y configura tus credenciales:

```env
# Variables de la Base de Datos Prisma
DATABASE_URL="postgresql://usuario:password@localhost:5432/trivia_db?schema=public"

# Variables de Seguridad
JWT_SECRET="mi_palabra_secreta_super_segura"
PORT=3000
```

**3. Inicializar Base de Datos (Migraciones):**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**4. Levantar el Servidor en Modo Desarrollo:**

```bash
npm run start:dev
```

¡Listo! Tu backend estará respirando en `http://localhost:3000`.

---

## Documentación

No estás solo en esto. Hemos preparado recursos para facilitarte la vida consumiendo esta API.

- **[Documentación del Frontend](./docs/README.md)**: Aquí encontrarás explícitamente **TODOS LOS EVENTOS** de WebSockets cómo funcionan y cómo atraparlos (Módulo de Juego).
- **[Open API / Swagger]**: Estando el servidor encendido, dirígete a `http://localhost:3000/api` en tu navegador web. Verás una interfaz de pruebas viva y las maquetas (DTOs) completas de cada ruta REST.

---

## Estructura del Proyecto

```text
src/
 ├── common/         # Interfaces globales como Respuestas Paginadas (PaginationDto)
 ├── modules/
 │   ├── auth/       # Casos de uso de seguridad (Login, Register, WebTokens)
 │   ├── categories/ # Temáticas de Quizzes
 │   ├── game/       # El "Cerebro" de Tiempo Real. Aquí viven los Sockets
 │   ├── quizzes/    # Cuestionarios, Preguntas y sus Opciones (Respuestas)
 │   └── users/      # Base de jugadores
 ├── app.module.ts   # Orquestador raíz de Nest
 └── main.ts         # Punto de ensamble de Servidor + Pipes globales + Swagger
```

---
