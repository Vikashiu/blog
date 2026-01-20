
import React from 'react';
import { Sparkles, Shield, Globe, Zap, ArrowRight, Brain, Terminal, Cpu, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

interface LandingPageProps {
  onViewChange: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onViewChange }) => {
  const { user } = useStore();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white overflow-hidden transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center">
        {/* Abstract Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-orange-500/10 dark:bg-orange-600/10 rounded-[100%] blur-[120px]"
          />
          <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-neutral-50 dark:from-[#050505] to-transparent z-10"></div>
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-white/50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-full px-3 py-1 mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Lumina Intelligence v2.0 Live</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1] text-neutral-900 dark:text-white"
          >
            Content Creation that <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-400 dark:from-white dark:via-white dark:to-neutral-500">Sees Through the Noise</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-12 font-light leading-relaxed"
          >
            Our autonomous AI engine detects trends and generates production-ready content before the competition even wakes up.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={() => user ? onViewChange('create') : onViewChange('login')}
              className="px-8 py-4 bg-orange-500 text-white text-lg font-bold rounded hover:bg-orange-600 transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_50px_rgba(249,115,22,0.5)] w-full md:w-auto"
            >
              Deploy the Engine
            </button>
            <button 
              onClick={() => onViewChange('home')}
              className="px-8 py-4 bg-transparent border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white text-lg font-medium rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-all w-full md:w-auto"
            >
              Explore Library
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Feature Section 1 */}
      <div className="py-24 bg-white dark:bg-[#0a0a0a] relative border-t border-neutral-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeIn} className="inline-block px-3 py-1 mb-6 text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded text-sm font-bold uppercase tracking-widest">
              The Core
            </motion.div>
            <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white">Introducing Lumina Core™</motion.h2>
            <motion.p variants={fadeIn} className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              The world's first generative creative engine. Unlike static templates, Lumina learns the "voice" of your brand. It autonomously distinguishes between noise and insight, creating engaging narratives that allow creativity to flow while optimizing for engagement instantly.
            </motion.p>
            
            <div className="space-y-6">
              {[
                { title: 'Learn', desc: 'Analyzes millions of data points to understand style.' },
                { title: 'Detect', desc: 'Identifies viral topics before they trend.' },
                { title: 'Generate', desc: 'Produces high-fidelity content in milliseconds.', active: true }
              ].map((item, i) => (
                <motion.div variants={fadeIn} key={i} className={`p-6 border rounded-lg transition-all ${item.active ? 'bg-orange-500/10 border-orange-500/50' : 'bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/10'}`}>
                   <div className="flex items-center">
                     <div className={`p-2 rounded ${item.active ? 'bg-orange-500 text-white' : 'bg-neutral-200 dark:bg-white/10 text-neutral-500 dark:text-neutral-400'} mr-4`}>
                        {i === 0 && <Brain size={20} />}
                        {i === 1 && <Shield size={20} />}
                        {i === 2 && <Zap size={20} />}
                     </div>
                     <div>
                       <h3 className={`text-lg font-bold ${item.active ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'}`}>{i+1} — {item.title}</h3>
                       {item.active && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{item.desc}</p>}
                     </div>
                   </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 dark:border-white/10"
          >
            <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 dark:opacity-60 hover:scale-105 transition-transform duration-[2s]" alt="AI Visual" />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8">
               <div className="h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: "0%" }}
                   whileInView={{ width: "67%" }}
                   viewport={{ once: true }}
                   transition={{ duration: 1.5, delay: 0.5 }}
                   className="h-full bg-orange-500"
                 />
               </div>
               <div className="flex justify-between mt-2 text-xs font-mono text-orange-600 dark:text-orange-500">
                 <span>PROCESSING</span>
                 <span>67% COMPLETE</span>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Testimonials */}
      <div className="py-24 bg-neutral-50 dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-16 flex justify-between items-end">
             <div>
                <div className="inline-block px-3 py-1 mb-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  Testimonials
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white">What Leaders Say <br/>About Lumina.</h2>
             </div>
             <div className="hidden md:flex gap-2">
               <button className="p-3 border border-neutral-200 dark:border-white/10 rounded hover:bg-neutral-200 dark:hover:bg-white/5 text-neutral-900 dark:text-white"><ArrowLeft className="rotate-180" size={20} /></button>
               <button className="p-3 border border-neutral-200 dark:border-white/10 rounded hover:bg-neutral-200 dark:hover:bg-white/5 text-neutral-900 dark:text-white"><ArrowRight size={20} /></button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                text: "Lumina's AI sentinel detected a viral trend in our niche before any traditional tool even flagged it. The autonomous drafting feature saved us from missing a massive opportunity.",
                name: "Sarah Chen", role: "CHIEF CONTENT OFFICER", company: "TECHCORP"
              },
              { 
                text: "We were drowning in writer's block. Lumina cut through the noise with surgical precision, reducing our draft time by 90% while actually improving our engagement rate.",
                name: "Marcus Rodriguez", role: "VP OF MARKETING", company: "FINTECH GLOBAL"
              },
              { 
                text: "The deep context reconnaissance feature alerted us to shifting user sentiment hours before it hit the news. That early warning gave us time to pivot our strategy completely.",
                name: "Emily Thompson", role: "DIRECTOR OF STRATEGY", company: "MEDIA UNITED"
              }
            ].map((t, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-neutral-900/50 p-8 rounded-lg border border-neutral-200 dark:border-white/5 hover:border-orange-500/30 transition-colors shadow-sm dark:shadow-none"
              >
                <div className="text-orange-500 text-4xl font-serif mb-6">"</div>
                <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed h-32">{t.text}</p>
                <div className="flex items-center gap-4 border-t border-neutral-100 dark:border-white/5 pt-6">
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded flex-shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} className="w-full h-full rounded" />
                  </div>
                  <div>
                    <div className="text-neutral-900 dark:text-white font-bold text-sm">{t.name}</div>
                    <div className="text-[10px] text-neutral-500 font-bold tracking-wider">{t.role} <span className="text-orange-600 dark:text-orange-500">AT {t.company}</span></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
