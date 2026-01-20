
import React, { useState } from 'react';
import { PenTool, Layout, LogOut, Plus, Compass, Settings, Bell, ChevronDown, User as UserIcon, BarChart2, Sun, Moon, CheckCircle, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';

interface NavbarProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

const Navbar: React.FC<NavbarProps> = ({ onViewChange, currentView }) => {
  const { user, logout, theme, toggleTheme, notifications, clearNotifications, markNotificationRead } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    onViewChange('home');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (currentView === 'login') {
      return null;
  }

  const getNotifIcon = (type: string) => {
    switch(type) {
        case 'success': return <CheckCircle size={14} className="text-green-500" />;
        case 'error': return <AlertCircle size={14} className="text-red-500" />;
        default: return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => onViewChange('landing')}>
            <div className="bg-gradient-to-tr from-orange-600 to-orange-400 p-2.5 rounded-lg text-white mr-3 shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] transition-all duration-300 transform group-hover:scale-105">
              <PenTool size={20} className="fill-current" />
            </div>
            <div>
                <span className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight block leading-none">
                Nexis
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono tracking-widest uppercase">Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => onViewChange('home')}
              className={`hidden md:flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full border ${
                currentView === 'home' 
                  ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/10 border-neutral-200 dark:border-white/10' 
                  : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
              }`}
            >
              <Compass className="mr-2 h-4 w-4" />
              Explore
            </button>

            {user ? (
              <>
                 <div className="h-6 w-px bg-neutral-200 dark:bg-white/10 mx-2 hidden md:block"></div>

                 {/* Notifications */}
                 <div className="relative">
                     <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full transition-all relative group"
                     >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white dark:border-black animate-pulse"></span>
                        )}
                     </button>

                     {showNotifications && (
                         <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0f0f0f] rounded-xl border border-neutral-200 dark:border-white/10 shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                                <div className="p-3 border-b border-neutral-200 dark:border-white/5 flex justify-between items-center bg-neutral-50 dark:bg-white/5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Notifications</h4>
                                    {notifications.length > 0 && (
                                        <button onClick={clearNotifications} className="text-[10px] text-neutral-400 hover:text-red-500 flex items-center gap-1">
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-neutral-500 text-sm">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                className={`p-4 border-b border-neutral-100 dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors relative group ${!n.read ? 'bg-orange-50/50 dark:bg-orange-500/5' : ''}`}
                                                onMouseEnter={() => markNotificationRead(n.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm ${!n.read ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-400 mt-1">
                                                            {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                         </>
                     )}
                 </div>
                
                <button 
                  onClick={() => onViewChange('create')}
                  className="hidden md:flex items-center px-5 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Write</span>
                </button>

                <div className="ml-2 relative group">
                  <button className="flex items-center gap-2 focus:outline-none p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-white/5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 p-0.5 border border-white/20 overflow-hidden relative">
                         {user.avatarUrl ? (
                             <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover rounded-full" />
                         ) : (
                             <div className="h-full w-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-white font-bold">{user.name[0]}</div>
                         )}
                    </div>
                    <ChevronDown size={14} className="text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                  </button>
                  
                  <div className="absolute top-full right-0 pt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-white dark:bg-[#0f0f0f] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
                        
                        <div 
                          className="px-5 py-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-50/50 dark:bg-white/5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                          onClick={() => onViewChange('profile')}
                        >
                            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-neutral-500 truncate font-mono mt-0.5">{user.email}</p>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 uppercase tracking-wider">
                                    {user.role} Account
                                </span>
                            </div>
                        </div>

                        <div className="p-2 space-y-1">
                            <button 
                                onClick={() => onViewChange('dashboard')} 
                                className="w-full text-left px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg flex items-center transition-all group/item"
                            >
                                <Layout size={16} className="mr-3 text-neutral-400 dark:text-neutral-500 group-hover/item:text-orange-500 transition-colors" /> 
                                Dashboard
                            </button>
                            
                            <button 
                                onClick={() => onViewChange('analytics')} 
                                className="w-full text-left px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg flex items-center transition-all group/item"
                            >
                                <BarChart2 size={16} className="mr-3 text-neutral-400 dark:text-neutral-500 group-hover/item:text-orange-500 transition-colors" /> 
                                Analytics
                            </button>

                            <button 
                                onClick={() => onViewChange('settings')} 
                                className="w-full text-left px-3 py-2.5 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg flex items-center transition-all group/item"
                            >
                                <Settings size={16} className="mr-3 text-neutral-400 dark:text-neutral-500 group-hover/item:text-orange-500 transition-colors" /> 
                                Settings
                            </button>
                        </div>

                        <div className="h-px bg-neutral-200 dark:bg-white/5 mx-2"></div>

                        <div className="p-2">
                            <button 
                                onClick={handleLogout} 
                                className="w-full text-left px-3 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center transition-all"
                            >
                                <LogOut size={16} className="mr-3" /> 
                                Sign Out
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button 
                onClick={() => onViewChange('login')}
                className="flex items-center px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-lg transform hover:-translate-y-0.5"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
