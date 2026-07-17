export type UserRole = 'student' | 'admin' | 'author';

export interface StudentDNA {
  dept: string;
  year: string;
  interests: string;
  experience: string;
  activities: string;
  goals: string;
  habits: string;
  previousInvolvement?: string;
  currentInvolvement?: string;
  goalStage?: string;
  motivation?: string;
  topStrengths?: string;
  improvementAreas?: string;
  marketPreference?: string;
  workStyle?: string;
  majorObstacle?: string;
  vision10Years?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  onboardingComplete: boolean;
  studentDNA?: StudentDNA;
  roadmap?: {
    recommendedClubs: string[];
    alumnusPath: string;
    year1: string;
    year2: string;
    year3: string;
    year4: string;
    keySkills: string[];
    conductionStrategy?: string;
    onlineGuidelineReference?: string;
  };
  matchedClubs?: { clubName: string; matchScore: number; reason: string }[];
  dnaVector?: number[];
  createdAt: any;
  updatedAt: any;
}

export interface CareerResource {
  id?: string;
  title: string;
  category: 'LinkedIn' | 'BCS' | 'Tech' | 'Skill' | 'RU Portal';
  url: string;
  description: string;
  icon?: string;
}

export interface Article {
  id?: string;
  title: string;
  content: string;
  category: string;
  readingTime: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Course' | 'Seminar' | 'Competition' | 'Festival';
  venue: string;
  mentors: string;
  paymentScale: string;
  paymentDetails: string;
  skillsTargeted: string;
  dateTime: string;
  date?: string;
  time?: string;
  duration?: string;
  fee?: string;
  contact: {
    whatsapp: string;
    email: string;
    joinLink: string;
  };
  adminId: string;
  adminName: string;
  eventVector?: number[];
  createdAt: any;
}

export interface ClubFeedItem {
  id?: string;
  clubId: string;
  type: 'news' | 'event' | 'history' | 'achievement' | 'ceremony' | 'update';
  title: string;
  content: string;
  date?: string;
  time?: string;
  link?: string;
  adminId: string;
  adminName: string;
  createdAt: any;
}

export interface MediaResource {
  id?: string;
  title: string;
  type: 'PDF' | 'Word' | 'Video' | 'Audio' | 'Website' | 'Other';
  url: string;
  description: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export interface EventFeedback {
  id?: string;
  eventId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  eventId: string;
  eventTitle: string;
  message: string;
  explanation: string;
  similarityScore: number;
  read: boolean;
  createdAt: any;
}
