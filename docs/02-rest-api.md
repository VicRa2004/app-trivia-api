# 2. REST API y Paginación

Esta sección documenta la estructura de respuestas estándar de la API, especialmente cuando se devuelven múltiples registros.

---

## 2.1. Estructura de Paginación

Cualquier endpoint que devuelva una lista (como `GET /users`, `GET /categories`, `GET /quizzes`) acepta los *query params* `?page=X&limit=Y` (por defecto `page=1, limit=10`).

El formato de respuesta **siempre** será:

```json
{
  "data": [
    { /* Objeto 1 */ },
    { /* Objeto 2 */ }
  ],
  "meta": {
    "total": 50,          // Total absoluto de registros en DB
    "page": 1,            // Página actual solicitada
    "limit": 10,          // Límite por página solicitado
    "lastPage": 5         // Última página posible (Math.ceil(total/limit))
  }
}
```

---

## 2.2. Endpoints: Categories (Categorías)

### `GET /categories` (Público)
Devuelve lista paginada de categorías.
**Response `data` object:**
```json
{
  "id": "uuid",
  "name": "Historia",
  "iconUrl": "https://url.com/image.png"
}
```

### `POST /categories` (Protegido - JWT)
Crea una categoría.
**Body:** `{ "name": "Historia", "iconUrl": "..." }`

---

## 2.3. Endpoints: Quizzes

### `GET /quizzes` (Público)
Lista paginada de Quizzes públicos (`isPublic: true`).
**Response `data` object (incluye el creador y la categoría):**
```json
{
  "id": "uuid",
  "title": "Mitología Griega",
  "description": "...",
  "thumbnailUrl": "...",
  "isPublic": true,
  "categoryId": "uuid-cat",
  "creatorId": "uuid-user",
  "creator": {
    "id": "uuid-user",
    "username": "juanp"
  },
  "category": {
    "id": "uuid-cat",
    "name": "Historia"
  }
}
```

### `GET /quizzes/:id` (Público)
Trae el detalle **completo** de un Quiz, incluyendo TODAS sus preguntas y TODAS las opciones. (Usado generalmente para visualizar antes de jugar).

### `POST /quizzes` (Protegido - JWT)
Crea el cascarón de un Quiz.
**Body:** `{ "title": "...", "description": "...", "categoryId": "uuid", "isPublic": true }`

---

## 2.4. Endpoints: Preguntas y Opciones (Anidados al Quiz)

*(Todas estas rutas requieren JWT y **que tú seas el creador del Quiz**)*.

### `POST /quizzes/:quizId/questions`
Agrega una pregunta junto con todas sus opciones en una sola petición.

**Ejemplo 1: Opción Múltiple Clásica**
```json
{
  "questionText": "¿Quién pintó la Mona Lisa?",
  "questionType": "multiple_choice",
  "points": 1000,
  "timeLimit": 20,
  "orderNumber": 1,
  "imageUrl": "https://url.com/opcional-gioconda.jpg",
  "options": [
    { "content": "Da Vinci", "isCorrect": true },
    { "content": "Picasso", "isCorrect": false }
  ]
}
```

**Ejemplo 2: Respuesta Corta (Libre texto)**
```json
{
  "questionText": "¿En qué año se descubrió América?",
  "questionType": "short_answer",
  "points": 1000,
  "timeLimit": 20,
  "orderNumber": 2,
  "options": [
    { "content": "1492", "isCorrect": true },
    { "content": "mil cuatrocientos noventa y dos", "isCorrect": true }
  ]
}
```

**Ejemplo 3: Ordenamiento (Ordering)**
> 🚨 **Importante:** Obligatorio indicar la propiedad `position` en orden ascendente lógico.
```json
{
  "questionText": "Ordena de mayor a menor tamaño estos planetas",
  "questionType": "ordering",
  "points": 1500,
  "timeLimit": 30,
  "orderNumber": 3,
  "options": [
    { "content": "Júpiter", "position": 1 },
    { "content": "Tierra", "position": 2 },
    { "content": "Luna", "position": 3 }
  ]
}
```

**Ejemplo 4: Selección de Imagen (Image Choice)**
```json
{
  "questionText": "¿Cuál es la bandera de Canadá?",
  "questionType": "image_choice",
  "points": 1000,
  "timeLimit": 15,
  "orderNumber": 4,
  "options": [
    { "content": "Opción 1", "imageUrl": "https://url.com/bandera-canada.png", "isCorrect": true },
    { "content": "Opción 2", "imageUrl": "https://url.com/bandera-mexico.png", "isCorrect": false }
  ]
}
```

**Respuesta:** Retorna el objeto `Question` interconectado con su nuevo array de `Options`.

### `PATCH /quizzes/:quizId/questions/:questionId`
Sustituye propiedades de la pregunta y **reemplaza por completo** las opciones si se mandan en el array.

### `DELETE /quizzes/:quizId/questions/:questionId`
Elimina la pregunta y automáticamente sus opciones en la base de datos (Cascade).
