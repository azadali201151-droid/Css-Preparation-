export interface Subject {
  id: string;
  name: string;
  group: string | 'Compulsory';
  isCompulsory: boolean;
  description: string;
  syllabus?: string;
  resources?: string[];
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  tags: string[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  joinedAt: any;
}

export interface TestAttempt {
  id: string;
  userId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  feedback: string;
  createdAt: any;
}
