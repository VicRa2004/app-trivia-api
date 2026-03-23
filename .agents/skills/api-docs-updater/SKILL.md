---
name: api-docs-updater
description: Actualiza la documentación del proyecto orientada al frontend (en la carpeta docs) cada vez que se realiza un cambio en el backend o API. Asegúrate de usar esta skill cada vez que el usuario mencione cambios en la base de datos, en las rutas de la API, en los controladores, o cuando modifique la forma en la que la API recibe o devuelve datos, incluso si no pide explicitamente actualizar la documentación.
---

# API Docs Updater

Esta skill se encarga de mantener la documentación de la API sincronizada con los cambios realizados en el backend. Su objetivo principal es asegurar que la documentación sirva como una guía clara tanto para futuros prompts de IA como para el desarrollo del frontend.

## Cuándo usar esta skill
- Cuando modifiques, agregues o elimines un endpoint de la API.
- Cuando cambies la estructura de las peticiones (body, params, query) o respuestas.
- Cuando haya cambios en la lógica de negocio del backend que el frontend deba tener en cuenta (ej. nuevos estados, validaciones, códigos de error).

## Reglas de Documentación
1. **Ubicación:** Toda la documentación debe actualizarse o crearse dentro del directorio `c:\Users\victo\Documents\proyectos\app-trivia-api\docs`.
2. **Idioma:** Las explicaciones y redacción de la documentación deben estar **SIEMPRE EN ESPAÑOL**, siguiendo la regla global del proyecto.
3. **Público Objetivo:** La documentación está pensada para 2 entes principales:
   - **Desarrolladores Frontend:** Necesitan saber exactamente cómo consumir la API, qué enviar y qué esperar.
   - **Asistentes de IA (Prompts futuros):** Las descripciones deben ser ricas en contexto para que una IA futura pueda leer el archivo y saber exactamente cómo integrar el backend en el frontend sin tener que leer el código fuente del backend.

## Cómo ejecutar esta skill

Cuando detectes que el usuario ha terminado de realizar un cambio en el backend (o te pida explícitamente actualizar la documentación), sigue estos pasos:

### 1. Analizar el cambio en el backend
- Revisa qué endpoints se han visto afectados.
- Identifica el contrato de datos (interfaces, tipos, DTOs de request y response).
- Identifica posibles errores o nuevos códigos de estado (ej. 400 Bad Request por validación).

### 2. Identificar el archivo de documentación
- Chequea la carpeta `docs/` para ver si ya existe un archivo correspondiente a ese dominio (ej. `05-question-types-guide.md`, `06-api-endpoints.md`, etc.).
- Si existe, edítalo en la sección correspondiente. Si no, crea un archivo nuevo con un título descriptivo y agrégalo al índice si lo hay.

### 3. Formato del documento
Utiliza el siguiente formato para los endpoints:

```markdown
## [METODO] /ruta/del/endpoint

**Descripción:** ¿Qué hace este endpoint y en qué contexto del flujo de la trivia se utiliza?

### Para el Frontend:
- **Cuándo llamarlo:** (ej. "Llamar a este endpoint cuando el usuario envía una respuesta a una pregunta de opción múltiple").
- **Body / Params necesarios:**
  \`\`\`json
  {
    "parametro1": "string (Requerido) - Razón por la que es requerido",
    "parametro2": "number (Opcional)"
  }
  \`\`\`
- **Respuesta Exitosa (200 OK):**
  \`\`\`json
  {
    "data": "...",
    "message": "..."
  }
  \`\`\`
- **Posibles Errores:** (Ej. 400 Si falta un parámetro, 404 Si la partida no existe. Indica cómo debe reaccionar el front: "Mostrar un toast de error").

### Contexto para IA (Prompts Futuros):
> [!IMPORTANT]
> **Instrucciones de integración:** Cuando construyas el componente de frontend para esta vista, asegúrate de gestionar el estado de carga (`isLoading`) mientras haces el fetch, y valida el formato de `parametro1` antes de llamar a la API para ahorrar requests.
```

## Importante
- Revisa las reglas globales en `AGENTS.md` (ya sea en la raíz o en `/docs`) y asegúrate de respetarlas.
- Trata de ser muy explicativo sobre la lógica del negocio, e.g., si el backend ahora espera que el ID sea numérico en vez de string, resáltalo visualmente para que la IA futura que haga el frontend lo note rápidamente.
