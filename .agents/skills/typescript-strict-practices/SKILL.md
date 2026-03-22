---
name: typescript-strict-practices
description: "How to enforce strict TypeScript best practices. Make sure to use this skill whenever the user mentions TypeScript, typing, refactoring TS code, strict mode, avoiding 'any', or asks for high-quality TypeScript code."
---

# TypeScript Strict Practices

Estás interactuando con un proyecto TypeScript. El usuario valora enormemente el código seguro, robusto y predecible. Tu principal directiva cuando escribas o refactorices código aquí es **evitar el uso de `any` a toda costa** y aplicar las mejores prácticas de la industria para TypeScript.

## Reglas de Oro

1. **PROHIBIDO el uso de `any`:** 
   - Nunca declares variables, argumentos de funciones, propiedades de objetos o tipos de retorno como `any`.
   - Si no conoces el tipo exacto de un dato entrante (por ejemplo, en un try/catch o un payload dinámico), utiliza `unknown` y luego aplica *"Type Narrowing"* (ej. `if (typeof data === 'string')`, `error instanceof Error`).

2. **Tipado Fuerte y Explícito:**
   - Define `Interfaces` o `Types` claros para todas las estructuras de datos (Especialmente los Payloads de las APIs, los estados de los Sockets y los objetos de configuración).
   - Usa los tipos generados automáticamente si usas ORMs (como Prisma) en lugar de intentar re-escribir tipos (ej. `Prisma.UserGetPayload<{}>`).

3. **Modo Estricto (Strict Mode):**
   - Asume que el proyecto corre con `"strict": true` en el `tsconfig.json`.
   - Revisa validaciones de nulabilidad. Evita forzar con el operador `!` (Non-null assertion operator) a menos que sea estrictamente necesario y estés 100% seguro de que el objeto existe; prefiere Optional Chaining (`?.`) y el operador Nullish Coalescing (`??`), o lanza errores/excepciones tempranos si una variable imperativa llega como `undefined`.

4. **Variables y Funciones:**
   - Siempre define el tipo de retorno de funciones complejas o asegúrate de que exista una inferencia impecable.
   - En las Arrow Functions usadas en métodos de arreglos (`.map`, `.filter`, `.reduce`), no tipes como `(item: any)`, confía en la inferencia del array original o tipalo explícitamente y correctamente.

5. **Manejo de Excepciones:**
   - En los bloques `try/catch`, el error siempre debe tiparse implícitamente como `unknown` (ej. `catch (error: unknown)`). 
   - Para leer su mensaje, haz un casting seguro: `const err = error as Error; console.log(err.message);`.

## Ejemplo de Transformación

**Mal Código (A EVITAR):**
```typescript
function processUser(user: any) {
  try {
    const name = user.name;
    const age = user.age;
    return { name, age };
  } catch (e: any) {
    console.log(e.message);
  }
}
```

**Buen Código (LO ESPERADO):**
```typescript
interface UserPayload {
  name: string;
  age: number;
}

function processUser(user: UserPayload): UserPayload {
  try {
    if (!user.name || !user.age) {
      throw new Error("Datos inválidos");
    }
    return { name: user.name, age: user.age };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err.message);
    throw err;
  }
}
```

## Instrucción de Ejecución
Cuando el usuario te pida modificar o crear un archivo, automáticamente haz un escaneo mental de tus variables para garantizar que no estás inyectando ningún `any`. Si encuentras linter errors o de compilación (`TS2532`, `TS18048`, etc.), soluciónalos manejando sus flujos de nulabilidad en vez de silenciarlos con `.ts-ignore` o `any`.
