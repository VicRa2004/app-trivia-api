-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TIPOS ENUM (Para asegurar integridad de datos)
CREATE TYPE question_type_enum AS ENUM (
    'multiple_choice', 
    'true_false', 
    'short_answer', 
    'ordering', 
    'image_choice'
);

CREATE TYPE session_status_enum AS ENUM (
    'waiting', -- Jugadores uniéndose
    'in_progress', -- Respondiendo preguntas
    'finished' -- Juego terminado, mostrando podio
);

-- 2. CATEGORÍAS
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    icon_url TEXT -- Icono para la interfaz (ej. un libro, un átomo)
);

-- 3. USUARIOS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    age INT CHECK (age > 0),
    profile_picture_url TEXT,
    preferred_language VARCHAR(5) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRIVIAS (QUIZZES)
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT, -- Imagen de portada
    is_public BOOLEAN DEFAULT TRUE,
    total_plays INT DEFAULT 0, -- Contador de popularidad
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PREGUNTAS
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type_enum NOT NULL,
    explanation TEXT, -- Feedback post-respuesta
    points INT DEFAULT 1000,
    time_limit INT DEFAULT 20, -- segundos
    order_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. OPCIONES
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- Texto o URL de imagen
    is_correct BOOLEAN DEFAULT FALSE,
    position INT -- Para ordenamiento o visualización
);

-- 7. SALAS (SESSIONS) - Esto permite el juego en vivo
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    host_id UUID REFERENCES users(id), -- Quien proyecta la pantalla
    game_pin VARCHAR(6) UNIQUE NOT NULL, -- Código de acceso (ej: 552103)
    status session_status_enum DEFAULT 'waiting',
    current_question_index INT DEFAULT 0,
    max_players INT DEFAULT 5, -- Aquí controlas el límite de las privadas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. INTENTOS (RESULTADOS FINALES)
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    total_score INT DEFAULT 0,
    final_rank INT, -- Posición en el podio (1, 2, 3...)
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. RESPUESTAS DETALLADAS (ANALÍTICAS)
CREATE TABLE user_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    given_answer TEXT,
    is_correct BOOLEAN,
    response_time_ms INT -- Importante para el cálculo de puntos
);