
import { create } from 'zustand';
import { User, BlogPost, Notification } from '../types';
import { MOCK_AUTHOR } from '../constants';
import { storageService } from '../services/storageService';

interface AppState {
  // Auth Slice
  user: User | null;
  isLoadingAuth: boolean;
  login: () => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Blog Slice
  posts: BlogPost[];
  isLoadingPosts: boolean;
  fetchPosts: () => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  
  // UI Slice
  activeView: string;
  setActiveView: (view: string, postId?: string) => void;
  currentPostId: string | undefined;

  // Notification Slice
  notifications: Notification[];
  addNotification: (type: Notification['type'], message: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Theme Slice
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // --- Auth ---
  user: null,
  isLoadingAuth: true,
  
  checkAuth: () => {
    const stored = localStorage.getItem('lumina_user');
    if (stored) {
        set({ user: JSON.parse(stored), isLoadingAuth: false });
    } else {
        set({ user: null, isLoadingAuth: false });
    }
    
    // Init theme state from DOM
    const isDark = document.documentElement.classList.contains('dark');
    set({ theme: isDark ? 'dark' : 'light' });
  },

  login: async () => {
    set({ isLoadingAuth: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = MOCK_AUTHOR;
    localStorage.setItem('lumina_user', JSON.stringify(mockUser));
    set({ user: mockUser, isLoadingAuth: false });
    get().addNotification('success', `Welcome back, ${mockUser.name}`);
  },

  logout: () => {
    localStorage.removeItem('lumina_user');
    set({ user: null, activeView: 'landing' });
    get().addNotification('info', 'You have been logged out');
  },

  updateUser: (updates: Partial<User>) => {
      const currentUser = get().user;
      if (!currentUser) return;
      
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });
      localStorage.setItem('lumina_user', JSON.stringify(updatedUser));
      get().addNotification('success', 'Profile updated successfully');
  },

  // --- Blog ---
  posts: [],
  isLoadingPosts: false,

  fetchPosts: async () => {
    // Always fetch fresh data to ensure new posts appear immediately
    set({ isLoadingPosts: true });
    const data = await storageService.getPosts();
    set({ posts: data, isLoadingPosts: false });
  },

  deletePost: async (id: string) => {
    await storageService.deletePost(id);
    set(state => ({
        posts: state.posts.filter(p => p.id !== id)
    }));
    get().addNotification('success', 'Post deleted successfully');
  },

  // --- UI ---
  activeView: 'landing',
  currentPostId: undefined,
  setActiveView: (view: string, postId?: string) => {
      set({ activeView: view, currentPostId: postId });
      window.scrollTo(0, 0);
  },

  // --- Notifications ---
  notifications: [],
  addNotification: (type, message) => {
      const newNotification: Notification = {
          id: Math.random().toString(36).substring(2),
          type,
          message,
          timestamp: Date.now(),
          read: false
      };
      set(state => ({ notifications: [newNotification, ...state.notifications] }));
      
      // Auto dismiss from toast view (handled by component), but keep in history
  },
  markNotificationRead: (id) => {
      set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
  },
  clearNotifications: () => {
      set({ notifications: [] });
  },

  // --- Theme ---
  theme: 'dark',
  toggleTheme: () => {
      const current = get().theme;
      const next = current === 'dark' ? 'light' : 'dark';
      
      if (next === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('nexis_theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('nexis_theme', 'light');
      }
      set({ theme: next });
  }
}));
