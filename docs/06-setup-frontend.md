# 6. Configuración del Frontend (React + Vite)

Guía para configurar tu frontend React con Vite para conectarse correctamente al backend de Trivia API en red local.

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- Socket.IO client library: `socket.io-client`

## 🚀 Configuración Inicial

### 1. Instalar dependencias

```bash
npm install socket.io-client axios
```

### 2. Configurar variables de entorno

Crear archivos `.env` en la raíz del proyecto React:

#### `.env.development` (para desarrollo local en localhost)

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

#### `.env.local` (para red local - NO commits)

```
VITE_API_URL=http://192.168.X.X:3000
VITE_WS_URL=http://192.168.X.X:3000
```

**Sustituir `192.168.X.X` con la IP real de tu servidor backend.**

### 3. Configurar Vite (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Asegura que Vite escuche en 0.0.0.0 para red local
    host: '0.0.0.0',
    port: 5173,
  },
});
```

## 🔌 Configurar Socket.IO Client

Crear un archivo `src/services/socket.ts`:

```typescript
import io, { Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Crear una única instancia de socket (singleton)
let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('✅ Socket conectado:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket desconectado');
  });

  socket.on('error', (error) => {
    console.error('❌ Error de Socket:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

## 🎮 Usar Socket.IO en Componentes React

Ejemplo de componente para conectarse a un juego:

```typescript
import { useEffect, useState } from 'react'
import { getSocket, disconnectSocket } from '@/services/socket'

interface GameState {
  gamePin: string
  players: Array<{ userId: string; username: string; score: number }>
  isHost: boolean
}

export function GameLobby({ gamePin, token }: { gamePin: string; token: string }) {
  const [game, setGame] = useState<GameState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const socket = getSocket(token)

    // Emitir evento para unirse al juego
    socket.emit('join_game', { gamePin, token }, (response: any) => {
      if (response?.data?.success) {
        setGame({
          gamePin,
          players: [response.data],
          isHost: response.data.isHost || false,
        })
      }
    })

    // Escuchar cuando otros jugadores se unen
    socket.on('player_joined', (data) => {
      setGame((prev) => ({
        ...prev!,
        players: data.playersList,
      }))
    })

    // Escuchar errores
    socket.on('error', (data) => {
      setError(data.message)
    })

    return () => {
      // NO desconectar aquí si quieres mantener la sesión
      // socket.disconnect()
    }
  }, [gamePin, token])

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="game-lobby">
      <h2>Sala: {game?.gamePin}</h2>
      <p>Host: {game?.isHost ? 'Sí' : 'No'}</p>
      <ul>
        {game?.players.map((player) => (
          <li key={player.userId}>{player.username} - {player.score} pts</li>
        ))}
      </ul>
    </div>
  )
}
```

## 🔐 Configurar Axios para REST API

Crear `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const removeAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization'];
};
```

## 🌐 Verificar Conectividad

### Desde la línea de comandos:

```bash
# Verificar que el backend está corriendo
curl -X GET http://192.168.X.X:3000/api

# Probar conexión WebSocket
npx ws ws://192.168.X.X:3000
```

### Desde el navegador:

Abre la consola (F12) en tu frontend y verifica:

```javascript
// En la consola del navegador
fetch('http://192.168.X.X:3000/api')
  .then((r) => r.json())
  .then((d) => console.log('✅ Backend respondiendo:', d))
  .catch((e) => console.error('❌ Error de conexión:', e));
```

## 🚨 Problemas Comunes

### 1. "Failed to fetch" / CORS Error

**Causa:** El frontend no está en la lista CORS del backend.
**Solución:** Configurar `FRONT_URL=http://TU_IP:5173` en `.env` del backend.

### 2. WebSocket desconecta inmediatamente

**Causa:** Token inválido o servidor rechaza la conexión.
**Solución:** Verificar que el JWT es válido y que los eventos envíen `{ gamePin, token }`.

### 3. "Cannot GET /api"

**Causa:** El backend no está escuchando en `0.0.0.0`.
**Solución:** Reiniciar con `npm run start:dev` y verificar que `PORT=3000`.

### 4. Timeout en WebSocket

**Causa:** Firewall bloqueando conexiones.
**Solución:**

```bash
# En Windows, permitir puerto 3000
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow protocol=tcp localport=3000
```

## 📝 Checklist de Configuración

- [ ] Backend corriendo en `npm run start:dev`
- [ ] Variable `FRONT_URL` configurada en `.env`
- [ ] `.env.local` creado en el frontend con IP correcta
- [ ] `socket.io-client` instalado
- [ ] Componentes usando `getSocket(token)` correctamente
- [ ] Firewall permite puerto 3000 (Backend) y 5173 (Frontend)
- [ ] Ambas máquinas en la misma red local
- [ ] Verificadas IPs con `ipconfig` (Windows) o `ifconfig` (Linux/Mac)

## 🎯 Próximos Pasos

1. Crear servicio de autenticación que genere JWT
2. Almacenar JWT en localStorage/sessionStorage
3. Pasar JWT a todos los eventos WebSocket
4. Implementar reconexión automática en caso de desconexión
