
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

const NotificationSystem: React.FC = () => {
  const { notifications, markNotificationRead } = useStore();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

  // Only show the last 3 notifications as toasts that haven't been dismissed manually from view
  // We use a local state to track "toast visibility" duration
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      // Only show if it's very recent (created in last 100ms) to avoid showing old ones on reload
      // But for this demo, we'll just track IDs we've seen or simply show the top one if not in list
      if (!visibleToasts.includes(latest.id) && Date.now() - latest.timestamp < 1000) {
        setVisibleToasts(prev => [...prev, latest.id]);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
           setVisibleToasts(prev => prev.filter(id => id !== latest.id));
        }, 5000);
      }
    }
  }, [notifications]);

  const removeToast = (id: string) => {
      setVisibleToasts(prev => prev.filter(tId => tId !== id));
      markNotificationRead(id);
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={20} className="text-green-500" />;
          case 'error': return <AlertCircle size={20} className="text-red-500" />;
          case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
          default: return <Info size={20} className="text-blue-500" />;
      }
  };

  const activeNotifications = notifications.filter(n => visibleToasts.includes(n.id));

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {activeNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            layout
            className="pointer-events-auto min-w-[320px] max-w-md bg-white dark:bg-[#111] border border-neutral-200 dark:border-white/10 shadow-2xl rounded-xl p-4 flex items-start gap-3 backdrop-blur-xl"
          >
            <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
            <div className="flex-1 mr-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white capitalize">{notification.type}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{notification.message}</p>
            </div>
            <button 
                onClick={() => removeToast(notification.id)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
            >
                <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
