import React from 'react';

export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  image?: string; // Base64 string
  isError?: boolean;
  relatedVideos?: VideoRecommendation[];
}

export interface VideoRecommendation {
  title: string;
  description: string;
  searchQuery: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export type GradeLevel = 'Grade 1-5' | 'Grade 6-9' | 'O/L' | 'A/L' | 'General' | 'Languages';

export type Language = 'sinhala' | 'tamil' | 'english';

export interface AppState {
  grade: GradeLevel;
  subject: string;
  language: Language;
  mode: 'chat' | 'quiz' | 'lesson' | 'settings' | 'profile';
}

export interface SubjectStat {
  xp: number;
  questionsAnswered: number; // Chat interactions
  quizAttempts: number;
  quizCorrect: number;
}

export interface UserStats {
  quizTotal: number;
  quizCorrect: number;
  questionsAsked: number;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  subjectStats: { [key: string]: SubjectStat };
  achievements: string[]; // IDs of unlocked achievements
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}