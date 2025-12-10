
// FIX: Add 'English' to the Subject enum.
export enum Subject {
  Math = 'Math',
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Biology = 'Biology',
  History = 'History',
  Geography = 'Geography',
  ComputerScience = 'Computer Science',
  English = 'English',
  Custom = 'Custom',
}

export type GameView = 'main-menu' | 'game' | 'end-screen';

export interface Player {
  id: string;
  name: string;
  score: number;
  isAI: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuestionToken {
    id: number;
    top: string;
    left: string;
}

// FIX: Export missing 'View' type.
export type View = 'home' | 'chat' | 'quiz' | 'todo' | 'profile' | 'videoAnalysis' | 'imageGenerator' | 'imageEditor' | 'video';

// FIX: Export missing 'Rank' and 'BadgeName' types.
export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Emerald' | 'Diamond';
export type BadgeName = 'Math Star' | 'Grammar Pro' | 'Quiz Champ' | 'Knowledge Seeker';

// FIX: Export missing 'User' type.
export interface User {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    className?: string;
    rank: Rank;
    totalPoints: number;
    badges: BadgeName[];
    progress: { date: number; points: number }[];
}

// FIX: Export missing 'QuizResult' type.
export interface QuizResult {
    subject: Subject;
    score: number;
    total: number;
    date: number;
}

// FIX: Export missing 'CustomTopic' type.
export interface CustomTopic {
    id: string;
    name: string;
    color: string;
    icon: string; // Icon component name as string
    createdAt: number;
}

export interface CustomQuiz {
    id: string;
    title: string;
    questions: QuizQuestion[];
    createdAt: number;
}

// FIX: Export missing 'ImageGenerationResult' type.
export interface ImageGenerationResult {
    id: string;
    prompt: string;
    aspectRatio: string;
    numImages: number;
    images: string[]; // base64 strings
    createdAt: number;
}

// FIX: Export missing 'ChatMessage' type.
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    isStreaming?: boolean;
    imageUrl?: string;
    modality?: 'text' | 'voice';
    thinkingMode?: boolean;
    feedback?: 'good' | 'bad';
    sources?: { title: string; uri: string }[];
}

// FIX: Export missing 'ChatSession' type.
export interface ChatSession {
    id: string;
    name: string;
    messages: ChatMessage[];
    createdAt: number;
}

// FIX: Export missing 'TaskPriority' and 'Task' types.
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    priority: TaskPriority;
    reminder?: number;
}