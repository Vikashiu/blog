
import React from 'react';
import { ArrowLeft, TrendingUp, Users, Eye, Clock, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsPageProps {
  onViewChange: (view: string) => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onViewChange }) => {
  // Mock Data
  const stats = [
    { label: 'Total Views', value: '45.2K', change: '+12%', icon: Eye, color: 'text-blue-500' },
    { label: 'Unique Readers', value: '32.1K', change: '+8%', icon: Users, color: 'text-green-500' },
    { label: 'Avg. Read Time', value: '4m 12s', change: '+2%', icon: Clock, color: 'text-orange-500' },
    { label: 'Engagement Rate', value: '68%', change: '+5%', icon: TrendingUp, color: 'text-purple-500' },
  ];

  const chartData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button 
             onClick={() => onViewChange('dashboard')} 
             className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-transparent shadow-sm dark:shadow-none"
          >
             <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Analytics Dashboard</h1>
            <p className="text-neutral-500 mt-1">Performance metrics for your content portfolio.</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/5 p-6 rounded-xl hover:border-neutral-300 dark:hover:border-white/10 transition-colors group shadow-sm dark:shadow-none"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-lg bg-neutral-50 dark:bg-white/5 ${stat.color} group-hover:bg-neutral-100 dark:group-hover:bg-white/10 transition-colors`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-green-600 dark:text-green-500 text-xs font-bold bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded-full">{stat.change}</span>
               </div>
               <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">{stat.value}</div>
               <div className="text-xs text-neutral-500 uppercase tracking-wider font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Engagement Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/5 rounded-xl p-8 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-neutral-900 dark:text-white">
                        <BarChart2 size={18} className="text-neutral-500" />
                        Engagement Overview
                    </h3>
                    <select className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 rounded px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 outline-none">
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                        <option>Last 24 Hours</option>
                    </select>
                </div>
                
                {/* CSS Bar Chart Simulation */}
                <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
                    {chartData.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-t-sm relative overflow-hidden group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors h-full flex items-end">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.05 }}
                                    className="w-full bg-orange-500/20 border-t-2 border-orange-500 group-hover:bg-orange-500/40 transition-colors"
                                />
                            </div>
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-600 font-mono">Day {i+1}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Posts */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/5 rounded-xl p-8 shadow-sm dark:shadow-none">
                <h3 className="font-bold text-lg mb-6 text-neutral-900 dark:text-white">Top Performing</h3>
                <div className="space-y-6">
                    {[
                        { title: 'The Future of AI', views: '12.5K', trend: 'up' },
                        { title: 'Minimalist Design', views: '8.2K', trend: 'up' },
                        { title: 'React Performance', views: '5.1K', trend: 'stable' },
                        { title: 'System Architecture', views: '4.8K', trend: 'down' }
                    ].map((post, i) => (
                        <div key={i} className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0">
                            <div>
                                <div className="font-medium text-sm text-neutral-900 dark:text-white mb-1">{post.title}</div>
                                <div className="text-xs text-neutral-500">{post.views} Reads</div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded ${
                                post.trend === 'up' ? 'text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-500/10' : 
                                post.trend === 'down' ? 'text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-500/10' : 
                                'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                            }`}>
                                {post.trend.toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-8 py-3 bg-neutral-100 dark:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-neutral-600 dark:text-white">
                    View Full Report
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
