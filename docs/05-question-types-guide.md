# 5. Estructuración de los 5 Tipos de Preguntas

Esta es una guía de referencia rápida sobre cómo estructurar el objeto JSON que debes enviar al Backend (a la ruta `POST /quizzes/:quizId/questions`) para crear cada uno de los 5 modos de minijuegos diferentes.

Recordemos la estructura base de cualquier pregunta:
```typescript
{
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "short_answer" | "ordering" | "image_choice";
  points?: number;       // Default: 1000
  timeLimit?: number;    // Default: 20
  orderNumber: number;   // Orden de aparición en el quiz
  imageUrl?: string;     // URL opcional de foto de apoyo
  options: Option[];     // Array con las reglas específicas abajo
}
```

---

## 1. Múltiple Opción (`multiple_choice`)

Este es el tipo estándar de Kahoot. De 2 a 4 opciones, solo una correcta.

```json
{
  "questionText": "¿Cuál es la montaña más alta del mundo?",
  "questionType": "multiple_choice",
  "orderNumber": 1,
  "options": [
    { "content": "K2", "isCorrect": false },
    { "content": "Monte Everest", "isCorrect": true },
    { "content": "Kangchenjunga", "isCorrect": false },
    { "content": "Lhotse", "isCorrect": false }
  ]
}
```

---

## 2. Falso o Verdadero (`true_false`)

Variante simplificada. Técnicamente se comporta idéntico a Múltiple Opción pero solo mandas las dicotomías.

```json
{
  "questionText": "El sol gira alrededor de la tierra.",
  "questionType": "true_false",
  "orderNumber": 2,
  "options": [
    { "content": "Verdadero", "isCorrect": false },
    { "content": "Falso", "isCorrect": true }
  ]
}
```

---

## 3. Respuesta Corta Libre (`short_answer`)

El usuario no elige botones, debe escribir texto en un input.
**Cómo funciona en el backend:** El servidor tomará todas las `options` marcadas como `isCorrect: true` y aceptará el texto del jugador si coincide (sin importar mayúsculas, minúsculas o espacios extra).

```json
{
  "questionText": "¿Cuál es el símbolo químico del oro?",
  "questionType": "short_answer",
  "orderNumber": 3,
  "options": [
    { "content": "Au", "isCorrect": true },
    { "content": "au", "isCorrect": true },
    { "content": "Oro", "isCorrect": true }
  ]
}
```

---

## 4. Ordenamiento Lógico (`ordering`)

El usuario debe acomodar eventos y formar una escalera.
**Regla OBLIGATORIA:** Todas las opciones deben incluir la propiedad numérica **`position`** estableciendo el orden correcto definitivo (generalmente de 1 a 4). 

```json
{
  "questionText": "Ordena estos presidentes de México cronológicamente (Del más antiguo al más reciente)",
  "questionType": "ordering",
  "orderNumber": 4,
  "options": [
    { "content": "Benito Juárez", "position": 1 },
    { "content": "Porfirio Díaz", "position": 2 },
    { "content": "Lázaro Cárdenas", "position": 3 },
    { "content": "Vicente Fox", "position": 4 }
  ]
}
```
*(Nota: Al jugarse vía WebSockets, el servidor desordenará matemáticamente la matriz antes de mandársela al cliente).*

---

## 5. Selección de Imagen (`image_choice`)

La pregunta se responde seleccionando 1 foto entre 4 posibles.
**Regla OBLIGATORIA:** Todas las opciones deben incluir un string válido en **`imageUrl`**.

```json
{
  "questionText": "¿Cuál de estas es la bandera de Canadá?",
  "questionType": "image_choice",
  "orderNumber": 5,
  "options": [
    { 
      "content": "Opción Canadá", 
      "imageUrl": "https://url-imagen.com/bandera-canada.webp", 
      "isCorrect": true 
    },
    { 
      "content": "Opción Perú", 
      "imageUrl": "https://url-imagen.com/bandera-peru.jpg", 
      "isCorrect": false 
    },
    { 
      "content": "Opción México", 
      "imageUrl": "https://url-imagen.com/bandera-mexico.png", 
      "isCorrect": false 
    }
  ]
}
```
