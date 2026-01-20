
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, PenTool, Edit3, ShieldAlert, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { BlogPost } from '../types';

interface DashboardProps {
  onViewChange: (view: string, id?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user, posts, fetchPosts, deletePost } = useStore();
  const [userPosts, setUserPosts] = useState(posts);

  useEffect(() => {
    if (!user) {
        onViewChange('login');
        return;
    }
    fetchPosts();
  }, [user, fetchPosts, onViewChange]);

  useEffect(() => {
      if (user) {
          setUserPosts(posts.filter(p => p.authorId === user.id));
      }
  }, [posts, user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Confirm deletion of this intelligence record?')) {
      await deletePost(id);
    }
  };

  const getStatusBadge = (status: BlogPost['status'], scheduledAt?: string) => {
    if (status === 'PUBLISHED') {
      return (
        <span className="px-2 py-1 inline-flex text-[10px] leading-5 font-bold rounded uppercase tracking-wider border bg-green-500/10 text-green-500 border-green-500/20">
          Active
        </span>
      );
    } else if (status === 'SCHEDULED') {
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-[10px] leading-5 font-bold rounded uppercase tracking-wider border bg-blue-500/10 text-blue-500 border-blue-500/20">
          <Clock size={10} />
          {scheduledAt ? format(new Date(scheduledAt), 'MM/dd HH:mm') : 'Scheduled'}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-[10px] leading-5 font-bold rounded uppercase tracking-wider border bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Staged
        </span>
      );
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 bg-neutral-50 dark:bg-[#050505] min-h-screen text-neutral-900 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 border-b border-neutral-200 dark:border-white/10 pb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Command Center</h2>
          <p className="text-neutral-500 font-mono text-sm">USER: {user.name.toUpperCase()} // ROLE: {user.role}</p>
        </div>
        <button 
          onClick={() => onViewChange('create')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded font-bold text-sm flex items-center transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
        >
          <Plus className="mr-2 h-5 w-5" /> Initialize New Draft
        </button>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] rounded border border-neutral-200 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-white/5">
            <thead className="bg-neutral-50 dark:bg-black/50">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">Entity</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">State</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">Timestamp</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-neutral-500 uppercase tracking-widest font-mono">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {userPosts.map(post => (
                <tr 
                  key={post.id} 
                  className="hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                  onClick={() => onViewChange('edit', post.id)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 bg-neutral-200 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-white/10 overflow-hidden mr-4">
                        {post.coverImage ? (
                          <img src={post.coverImage} alt="" className="h-full w-full object-cover opacity-80" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                            <PenTool size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors">{post.title}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-xs mt-1 font-mono">{post.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                    {getStatusBadge(post.status, post.scheduledAt)}
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-sm text-neutral-400 font-mono">
                    {format(new Date(post.updatedAt), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewChange('edit', post.id); }}
                        className="text-neutral-400 hover:text-orange-500 p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, post.id)}
                        className="text-neutral-400 hover:text-red-500 p-2 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {userPosts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center">
                    <div className="mx-auto h-16 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center text-neutral-400 dark:text-neutral-700 mb-4 border border-neutral-200 dark:border-white/5">
                      <ShieldAlert size={32} />
                    </div>
                    <p className="text-neutral-900 dark:text-white font-bold text-lg">System Empty</p>
                    <p className="text-neutral-500 text-sm mb-6 mt-1">No intelligence records found in database.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
