
import React, { useEffect, useState, useRef } from 'react';
import { User, Mail, Calendar, Shield, Edit2, LogOut, FileText, MessageSquare, TrendingUp, Camera } from 'lucide-react';
import { useStore } from '../store/useStore';
import { storageService } from '../services/storageService';
import { BlogPost } from '../types';

interface ProfilePageProps {
  onViewChange: (view: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onViewChange }) => {
  const { user, logout, updateUser } = useStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 12450 // Mocked data
  });

  useEffect(() => {
    if (!user) {
        onViewChange('login');
        return;
    }

    storageService.getPosts().then(data => {
      const userPosts = data.filter(p => p.authorId === user.id);
      setPosts(userPosts);
      setStats({
        totalPosts: userPosts.length,
        publishedPosts: userPosts.filter(p => p.status === 'PUBLISHED').length,
        draftPosts: userPosts.filter(p => p.status === 'DRAFT').length,
        totalViews: 12450 + (userPosts.length * 120) // Mock calculation
      });
    });
  }, [user, onViewChange]);

  const handleLogout = () => {
    logout();
    onViewChange('home');
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateUser({ avatarUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white py-12 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200 dark:border-white/5 overflow-hidden mb-8 relative group shadow-sm dark:shadow-none">
          <div className="h-32 bg-gradient-to-r from-orange-500/10 to-neutral-200 dark:from-orange-900/20 dark:to-neutral-900/50"></div>
          <div className="px-8 pb-8 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 relative z-10">
            <div className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                />
                <div className="w-32 h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-4 border-white dark:border-[#0a0a0a] overflow-hidden shadow-2xl relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-white text-4xl font-bold">
                            {user.name[0]}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                    </div>
                </div>
                <button className="absolute bottom-2 right-2 p-2 bg-orange-500 rounded-lg text-black hover:bg-orange-400 transition-colors shadow-lg z-20">
                    <Edit2 size={16} />
                </button>
            </div>
            
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">{user.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                        <Mail size={14} />
                        {user.email}
                    </div>
                    <div className="flex items-center gap-1">
                        <Shield size={14} />
                        {user.role}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        Joined Dec 2023
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={() => onViewChange('dashboard')}
                    className="px-4 py-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-neutral-700 dark:text-white"
                >
                    Manage Content
                </button>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-2"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
                { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-blue-500' },
                { label: 'Published', value: stats.publishedPosts, icon: TrendingUp, color: 'text-green-500' },
                { label: 'Drafts', value: stats.draftPosts, icon: Edit2, color: 'text-orange-500' },
                { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: MessageSquare, color: 'text-purple-500' },
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-[#0a0a0a] p-6 rounded-xl border border-neutral-200 dark:border-white/5 hover:border-orange-500/30 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg bg-neutral-50 dark:bg-white/5 ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Metric</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
                </div>
            ))}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity / Posts */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-neutral-200 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none">
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white">Recent Intelligence</h3>
                        <button 
                            onClick={() => onViewChange('create')}
                            className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase hover:text-orange-500 dark:hover:text-orange-400"
                        >
                            + New Entry
                        </button>
                    </div>
                    <div className="divide-y divide-neutral-200 dark:divide-white/5">
                        {posts.slice(0, 5).map(post => (
                            <div 
                                key={post.id} 
                                className="p-6 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => onViewChange('edit', post.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">{post.title}</h4>
                                    <span className={`px-2 py-0.5 text-[10px] rounded border uppercase tracking-wider ${
                                        post.status === 'PUBLISHED' 
                                            ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20' 
                                            : 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20'
                                    }`}>
                                        {post.status}
                                    </span>
                                </div>
                                <p className="text-sm text-neutral-500 line-clamp-1 mb-3">{post.summary || 'No summary available.'}</p>
                                <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-600 font-mono gap-3">
                                    <span>UPDATED: {new Date(post.updatedAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{post.tags[0] || 'GENERAL'}</span>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && (
                            <div className="p-8 text-center text-neutral-500">
                                No activity recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar (Settings Preview) */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-neutral-200 dark:border-white/5 p-6 shadow-sm dark:shadow-none">
                    <h3 className="font-bold text-lg mb-4 text-neutral-900 dark:text-white">Account Security</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">Two-Factor Auth</span>
                            <span className="text-green-600 dark:text-green-500 font-mono text-xs">ENABLED</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">Recovery Email</span>
                            <span className="text-neutral-700 dark:text-neutral-300">al***@lumina.ai</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-500 dark:text-neutral-400">Password</span>
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs">Last changed 30d ago</span>
                        </div>
                        <button className="w-full py-2 mt-2 border border-neutral-200 dark:border-white/10 rounded hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition-colors text-neutral-700 dark:text-white">
                            Manage Security
                        </button>
                    </div>
                </div>
                
                <div className="bg-orange-50 dark:bg-gradient-to-br dark:from-orange-600/20 dark:to-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-500/20 p-6">
                    <h3 className="font-bold text-lg mb-2 text-orange-600 dark:text-orange-500">Pro Features</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">You are using the preview build of Lumina Intelligence v2.0.</p>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-900 h-2 rounded-full overflow-hidden mb-2">
                        <div className="bg-orange-500 w-3/4 h-full"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
                        <span>Usage</span>
                        <span>75%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
