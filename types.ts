
export type UserRole = 'ADMIN' | 'AUTHOR' | 'READER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface Comment {
  id: string;
  postId: string;
  author: User; // Simplified for frontend mock
  content: string;
  parentId?: string | null; // For nested comments
  createdAt: string;
  replies?: Comment[];
}

export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML string from Tiptap
  summary: string;
  tags: string[];
  authorId: string;
  authorName: string;
  status: BlogStatus;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
  coverImage?: string;
}

export interface AIResponse {
  content?: string;
  summary?: string;
  tags?: string[];
  suggestions?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
  read: boolean;
}

export type TiptapContent = string;
