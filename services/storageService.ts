
import { BlogPost, Comment, User } from "../types";
import { MOCK_AUTHOR } from "../constants";

const POSTS_KEY = 'lumina_posts';
const COMMENTS_KEY = 'lumina_comments';

// Seed data helper
const seedData = () => {
  if (!localStorage.getItem(POSTS_KEY)) {
    const initialPosts: BlogPost[] = [
      {
        id: '1',
        title: 'The Future of AI in Web Development',
        slug: 'future-of-ai-web-dev',
        content: '<p>Artificial Intelligence is rapidly transforming how we build web applications. From code generation to automated testing, the landscape is shifting...</p><h2>The Rise of Large Language Models</h2><p>Tools like Gemini are enabling developers to prototype faster than ever before.</p>',
        summary: 'An exploration of how AI tools like Gemini are changing the developer landscape.',
        tags: ['AI', 'Web Development', 'Future'],
        authorId: MOCK_AUTHOR.id,
        authorName: MOCK_AUTHOR.name,
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString(),
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: '2',
        title: 'Mastering Minimalist Design',
        slug: 'mastering-minimalist-design',
        content: '<p>Minimalism is not just about having less; it is about making room for more of what matters. In UI design, this translates to cleaner interfaces and better user journeys.</p>',
        summary: 'How to apply minimalist principles to your UI/UX workflows for better conversion.',
        tags: ['Design', 'UX', 'Minimalism'],
        authorId: 'user-2',
        authorName: 'Sarah Jenkins',
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date().toISOString(),
        coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: '3',
        title: 'The Guide to React Performance',
        slug: 'react-performance-guide',
        content: '<p>Performance is a feature. In this guide, we deep dive into React.memo, useMemo, and virtualization techniques to keep your apps 60fps.</p>',
        summary: 'Optimization techniques for large scale React applications.',
        tags: ['Web Development', 'React', 'Performance'],
        authorId: 'user-3',
        authorName: 'David Chen',
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt: new Date().toISOString(),
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800'
      }
    ];
    localStorage.setItem(POSTS_KEY, JSON.stringify(initialPosts));
  }
  if (!localStorage.getItem(COMMENTS_KEY)) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify([]));
  }
};

// Initialize
seedData();

export const storageService = {
  getPosts: async (): Promise<BlogPost[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = localStorage.getItem(POSTS_KEY);
    let posts: BlogPost[] = data ? JSON.parse(data) : [];

    // --- "Backend" Job: Check for Scheduled Posts ---
    let hasUpdates = false;
    const now = new Date();
    
    posts = posts.map(post => {
      if (post.status === 'SCHEDULED' && post.scheduledAt) {
        const scheduleTime = new Date(post.scheduledAt);
        if (now >= scheduleTime) {
          hasUpdates = true;
          return { ...post, status: 'PUBLISHED', updatedAt: now.toISOString() };
        }
      }
      return post;
    });

    if (hasUpdates) {
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    }
    // ------------------------------------------------

    return posts;
  },

  getPostById: async (id: string): Promise<BlogPost | undefined> => {
    const posts = await storageService.getPosts();
    return posts.find(p => p.id === id);
  },

  savePost: async (post: BlogPost): Promise<BlogPost> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const posts = await storageService.getPosts();
    const index = posts.findIndex(p => p.id === post.id);
    
    if (index >= 0) {
      posts[index] = { ...post, updatedAt: new Date().toISOString() };
    } else {
      posts.unshift(post);
    }
    
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    return post;
  },

  deletePost: async (id: string): Promise<void> => {
    const posts = await storageService.getPosts();
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(filtered));
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const data = localStorage.getItem(COMMENTS_KEY);
    const allComments: Comment[] = data ? JSON.parse(data) : [];
    return allComments.filter(c => c.postId === postId);
  },

  addComment: async (comment: Comment): Promise<Comment> => {
    const data = localStorage.getItem(COMMENTS_KEY);
    const allComments: Comment[] = data ? JSON.parse(data) : [];
    allComments.push(comment);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    return comment;
  }
};
