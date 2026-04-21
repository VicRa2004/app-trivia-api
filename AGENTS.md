# AGENTS.md — Trivia App API

## Comandos esenciales

```bash
npm run start:dev        # Desarrollo con hot-reload
npm run build            # Compila a dist/
npm run start:prod       # Levanta desde dist/
npm run lint             # ESLint + fix
npm test                 # Tests unitarios (src/**/*spec.ts)
npm run test:e2e         # Tests e2e (test/**/*.e2e-spec.ts)
```

## Flujo de cambios en base de datos

Si modificas `prisma/schema.prisma`:
1. `npx prisma migrate dev --name <nombre>` — crea migración
2. `npx prisma generate` — regenera el cliente en `src/generated/prisma/`

Ambas comandos son necesarias. Si solo ejecutas `generate` sin migrate, los cambios no se aplican a la BD.

## Código Prisma generado

El cliente Prisma se genera en `src/generated/prisma/`. **No editar archivos manualmente ahí** — cualquier cambio se sobrescribe con `prisma generate`. Los modelos, enums y cliente se derivan directamente de `prisma/schema.prisma`.

## Testing

- Unit tests: patrón `*.spec.ts` en `src/`, configurados desde `package.json` (rootDir: `src`)
- E2E tests: patrón `*.e2e-spec.ts` en `test/`, configurados desde `test/jest-e2e.json`
- E2E tests requieren base de datos activa — verificar que PostgreSQL esté corriendo antes de ejecutar

## CORS

`main.ts:10-14` hardcodea el origen CORS a `http://localhost:5173`. Cambiar ahí si el frontend usa otro puerto.

## Estructura

```
src/
├── generated/prisma/   # NO EDITAR — generado por Prisma
├── modules/
│   ├── auth/           # JWT, login, registro
│   ├── game/           # WebSocket gateway (Socket.IO) + controlador REST
│   ├── quizzes/        # CRUD de quizzes, preguntas, opciones
│   ├── categories/     # Categorías
│   └── users/          # Perfil de jugador
├── common/             # DTOs e interfaces compartidas (PaginationDto)
├── prisma.service.ts   # Instancia singleton de PrismaClient
└── main.ts             # Bootstrap: ValidationPipe global, Swagger en /api, CORS
```

## Convenciones

- Prettier: comillas simples, trailing commas en todos los argumentos
- TypeScript: `noImplicitAny` deshabilitado (tsconfig.json:20)
- Nomenclatura archivos: `kebab-case.dto.ts`, `camelCase.service.ts`
- Los módulos son los límites de responsabilidad del proyecto

## Docs para integradores frontend

La documentación específica para el cliente (eventos WebSocket, flujos de juego) vive en `docs/03-websockets.md`. Consultar ahí antes de modificar o documentar el gateway.

## Swagger

La documentación interactiva está disponible en `http://localhost:3000/api` cuando el servidor está corriendo. Se genera automáticamente desde los DTOs y decorators del código.