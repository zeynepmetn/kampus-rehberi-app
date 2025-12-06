// Student Types
export interface Student {
  id: string;
  name: string;
  studentNumber: string;
  department: string;
  email: string;
  avatar?: string;
  year: number;
}

// Course Types
export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

// Schedule Types
export interface DaySchedule {
  day: string;
  courses: Course[];
}

// Notification Types
export type NotificationType = 'event' | 'reminder' | 'cafeteria' | 'announcement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

// Cafeteria Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'main' | 'side' | 'dessert' | 'drink';
  image?: string;
  available: boolean;
}

export interface CafeteriaPost {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: Date;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

// Event Types
export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  image?: string;
  organizer: string;
}

// Map Location Types
export interface MapLocation {
  id: string;
  name: string;
  type: 'building' | 'cafeteria' | 'library' | 'parking' | 'sports' | 'other';
  description: string;
  coordinates?: { lat: number; lng: number };
}

// Settings Types
export interface UserSettings {
  notifications: {
    events: boolean;
    classReminders: boolean;
    cafeteriaUpdates: boolean;
    announcements: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: 'tr' | 'en';
}

