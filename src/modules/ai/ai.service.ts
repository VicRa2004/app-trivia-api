import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { ChatRequestDto } from './dto/chat-request.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { PrismaService } from '../../prisma.service';

const SYSTEM_INSTRUCTION = `Eres Trivia AI, el asistente virtual inteligente oficial de TriviaApp. Tu propósito es resolver dudas sobre el funcionamiento de la aplicación, su arquitectura, sus características y cómo jugar.

Información sobre TriviaApp:
- TriviaApp es un juego interactivo de preguntas y respuestas en tiempo real (similar a Kahoot!).
- Arquitectura y Stack Tecnológico:
  * Backend: NestJS (Node.js framework), base de datos PostgreSQL, Prisma ORM para interactuar con la base de datos, y Socket.IO para la comunicación en tiempo real (WebSockets).
  * Frontend: React 19, Vite como empaquetador, y Tailwind CSS v4 para los estilos. Para el manejo del estado global se utiliza Zustand, y para consumir la API REST se utiliza Axios envuelto con TanStack React Query.
- Funcionalidades principales:
  * Registro y Autenticación: Los usuarios se registran e inician sesión usando JWT. Pueden personalizar su perfil eligiendo un avatar de la lista.
  * Quizzes: Los usuarios creadores pueden diseñar cuestionarios (quizzes) con un título, descripción, categoría, miniatura y visibilidad (público o privado). Cada quiz puede contener preguntas de varios tipos: opción múltiple (standard), verdadero o falso, imagen o texto corto.
  * Categorías: Los quizzes se organizan en categorías (por ejemplo, Ciencia, Tecnología, Historia, etc.).
  * Salas multijugador en tiempo real:
    - Flujo del Host: El host crea una sesión de juego basada en un Quiz usando la ruta HTTP POST /game/create/:quizId. Esto devuelve un código PIN de 6 dígitos único. Luego, el host se conecta por WebSockets (Socket.IO) y emite 'join_game'. Una vez se unen los jugadores, el host inicia la partida emitiendo 'start_game'. Después de cada pregunta, el host avanza emitiendo 'next_question'. Para revelar las respuestas correctas y posiciones parciales, emite 'show_correct_answer'. Finalmente, emite 'finish_game' para terminar la partida y guardar los resultados.
    - Flujo del Jugador: Los jugadores se unen a la sala desde la interfaz ingresando el PIN de 6 dígitos de la partida. Emiten 'join_game' con el PIN y su JWT token. Reciben las preguntas a través del evento 'new_question', envían sus respuestas con el evento 'submit_answer' (que incluye el payload de la respuesta y el tiempo transcurrido en milisegundos), y ven el podio final con 'game_finished'.
    - Motor de Puntos: Los puntos se asignan en función del tiempo de respuesta. Si respondes rápido, obtienes más puntos. Si la trivia es privada, se premia a los primeros en contestar correctamente (cupo de ganadores limitado).
- Modo de Uso / Comandos del Desarrollador:
  * Para desarrollo del backend: 'npm run start:dev' inicia el servidor NestJS con hot-reload en el puerto 3000.
  * Base de datos: Al modificar el esquema Prisma, se ejecuta 'npx prisma migrate dev --name <nombre>' y luego 'npx prisma generate'. El cliente autogenerado reside en 'src/generated/prisma/'.
  * Documentación Swagger: Está disponible en http://localhost:3000/api al iniciar el servidor.

Reglas de respuesta:
1. Responde de forma clara, amigable y concisa en español.
2. Si te preguntan sobre el código o flujos, puedes proveer ejemplos de eventos de websockets o peticiones REST basándote en la información anterior.
3. No inventes funcionalidades que no existen en la aplicación. Si el usuario pregunta algo no relacionado con TriviaApp o conceptos generales de desarrollo relacionados con su stack, trata de responder de forma breve orientándolo a la aplicación.`;

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.API_KEY_GEMINI;
    if (!apiKey) {
      this.ai = new GoogleGenAI({});
    } else {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async getChatResponse(chatRequestDto: ChatRequestDto) {
    try {
      const history = chatRequestDto.history || [];
      const chat = this.ai.chats.create({
        model: 'gemini-3.5-flash',
        history: history as any,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const response = await chat.sendMessage({
        message: chatRequestDto.message,
      });

      return {
        text: response.text,
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new InternalServerErrorException('Error al comunicarse con la Inteligencia Artificial.');
    }
  }

  async generateQuiz(dto: GenerateQuizDto, userId: string) {
    try {
      let categoryName = '';
      if (dto.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        });
        if (category) {
          categoryName = category.name;
        }
      }

      const prompt = `Genera un quiz completo sobre el tema: "${dto.theme}".
El quiz debe estar en español y tener exactamente ${dto.numQuestions} preguntas.
${categoryName ? `El quiz pertenece a la categoría: "${categoryName}".` : ''}

Requisitos para las preguntas:
- Distribuye las preguntas utilizando una mezcla de los siguientes tipos si es posible:
  1. "multiple_choice": Pregunta de opción múltiple clásica con exactamente 4 opciones de respuesta, donde exactamente una de ellas tiene isCorrect=true.
  2. "true_false": Pregunta de Verdadero o Falso. Debe tener exactamente 2 opciones de respuesta (cuyos contenidos deben ser exactamente "Verdadero" y "Falso"), y exactamente una de ellas tiene isCorrect=true.
  3. "short_answer": Pregunta con respuesta corta de texto libre. Debe tener exactamente 1 opción que contiene la respuesta exacta correcta en minúsculas, con isCorrect=true.
  4. "ordering": Pregunta de ordenar elementos. Debe tener entre 3 y 4 opciones, cada una con un campo "position" indicando su orden correcto (comenzando en 1, ej. 1, 2, 3). Todas las opciones deben tener isCorrect=true ya que todas forman parte del orden correcto.
- Los puntos de cada pregunta deben ser entre 1000 y 1500 (ej. 1000 por defecto).
- El límite de tiempo (timeLimit) debe ser de 20 o 30 segundos según la dificultad.
- Incluye una breve explicación en cada pregunta explicando por qué la respuesta es correcta.`;

      const responseSchema = {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Título creativo y corto para el quiz.' },
          description: { type: 'string', description: 'Descripción general del quiz de qué trata.' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionText: { type: 'string', description: 'Texto de la pregunta.' },
                questionType: {
                  type: 'string',
                  enum: ['multiple_choice', 'true_false', 'short_answer', 'ordering'],
                  description: 'El tipo de pregunta.'
                },
                points: { type: 'integer' },
                timeLimit: { type: 'integer' },
                explanation: { type: 'string' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      content: { type: 'string', description: 'Texto de la respuesta o elemento a ordenar.' },
                      isCorrect: { type: 'boolean', description: 'Si es correcta.' },
                      position: { type: 'integer', description: 'Posición lógica obligatoria si es de tipo ordering, comenzando en 1.' }
                    },
                    required: ['content', 'isCorrect']
                  }
                }
              },
              required: ['questionText', 'questionType', 'points', 'timeLimit', 'options']
            }
          }
        },
        required: ['title', 'description', 'questions']
      };

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new InternalServerErrorException('No se recibió texto de respuesta de la IA.');
      }

      const parsedQuiz = JSON.parse(responseText);

      // Guardar el quiz en base de datos usando transacciones anidadas en un solo paso
      const createdQuiz = await this.prisma.quiz.create({
        data: {
          title: parsedQuiz.title || dto.theme,
          description: parsedQuiz.description || `Trivia generada por IA sobre ${dto.theme}`,
          categoryId: dto.categoryId || null,
          creatorId: userId,
          questions: {
            create: parsedQuiz.questions.map((q: any, qIdx: number) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              points: q.points ?? 1000,
              timeLimit: q.timeLimit ?? 20,
              explanation: q.explanation || null,
              orderNumber: qIdx + 1,
              options: {
                create: q.options.map((o: any) => ({
                  content: o.content,
                  isCorrect: o.isCorrect,
                  position: q.questionType === 'ordering' ? (o.position ?? null) : null,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });

      return createdQuiz;
    } catch (error) {
      console.error('Error generating quiz with AI:', error);
      throw new InternalServerErrorException('Error al generar el Quiz utilizando Inteligencia Artificial.');
    }
  }
}
