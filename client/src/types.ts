// Types partagés entre les composants, alignés sur les réponses de l'API.

export type Role = 'user' | 'admin';

export type AppView = 'board' | 'admin';

export type DashboardPeriod = 7 | 14 | 30 | 90;

export interface DailyActivity {
  date: string;
  users: number;
  events: number;
  feedbacks: number;
}

export interface RatingBucket {
  note: number;
  count: number;
}

export interface TopEvent {
  id: string;
  titre: string;
  feedbacks: number;
  note: number | null;
  date: string;
}

export interface AdminStats {
  users: number;
  admins: number;
  events: number;
  feedbacks: number;
  periodDays: DashboardPeriod;
  newUsers: number;
  newEvents: number;
  newFeedbacks: number;
  averageNote: number | null;
  upcomingEvents: number;
  series: DailyActivity[];
  ratings: RatingBucket[];
  topEvents: TopEvent[];
}

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
}

// Auteur "populate" par le serveur : seuls _id et nom sont renvoyés.
export interface Author {
  _id: string;
  nom: string;
}

export interface Event {
  _id: string;
  titre: string;
  description: string;
  lieu: string;
  date: string;
  auteur: Author | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  _id: string;
  texte: string;
  note: number;
  evenement: string;
  auteur: Author | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDraft {
  titre: string;
  description: string;
  lieu: string;
  date: string;
}

export interface FeedbackDraft {
  texte: string;
  note: number;
  evenement: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Corps des réponses d'erreur renvoyées par l'API Express.
export interface ApiMessage {
  message: string;
}
