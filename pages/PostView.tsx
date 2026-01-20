
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, MessageSquare, ArrowLeft, Lock, Heart, Share2, 
  Bookmark, Play, Pause, Volume2, Sparkles, X, Send, StopCircle, Headphones,
  Linkedin, Twitter, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost, Comment } from '../types';
import { storageService } from '../services/storageService';
import { useStore } from '../store/useStore';
import { generateSpeech, chatWithGemini } from '../services/geminiService';
import { playPcmAudio } from '../utils/audio';

interface PostViewProps {
  postId: string;
}

const PostView: React.FC<PostViewProps> = ({ postId }) => {
  const { user } = useStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Reading State
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // AI Chat State
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    storageService.getPostById(postId).then(setPost);
    storageService.getComments(postId).then(setComments);
    
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
    };
  }, [postId]);

  // --- Handlers ---

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      postId,
      author: user,
      content: newComment,
      createdAt: new Date().toISOString()
    };
    
    await storageService.addComment(comment);
    setComments([...comments, comment]);
    setNewComment('');
  };

  const toggleAudio = async () => {
    // Resume/Pause existing context
    if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'running') {
            await audioCtxRef.current.suspend();
            setIsPlaying(false);
        } else if (audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
            setIsPlaying(true);
        } else {
            // If closed, reset and regenerate
            audioCtxRef.current = null;
            toggleAudio();
        }
        return;
    }

    // Generate new audio
    if (!post) return;
    setIsGeneratingAudio(true);
    
    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        
        // Sanitize and trim
        const cleanText = textContent.replace(/\s+/g, ' ').trim();

        // Limit to reasonable length for demo latency (Gemini has limits)
        const textToRead = `Title: ${post.title}. ${cleanText.substring(0, 1500)}`; 
        
        if (textToRead.length < 10) {
            alert("Content too short for audio generation.");
            return;
        }

        const audioBase64 = await generateSpeech(textToRead);
        
        // Use PCM Player utility
        const { ctx } = playPcmAudio(audioBase64, () => {
            setIsPlaying(false);
            audioCtxRef.current = null;
        });
        
        audioCtxRef.current = ctx;
        setIsPlaying(true);
    } catch (e) {
        console.error(e);
        alert("Unable to generate audio stream. Please check your API key or content length.");
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const handleAiChat = async () => {
    if (!chatInput.trim() || !post) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
        // Construct context-aware history
        const contextPrompt = `
            Context: You are an AI assistant helping a user read a blog post.
            Blog Title: "${post.title}"
            Blog Summary: "${post.summary}"
            
            Answer the user's question based on this context. Keep answers concise.
        `;
        
        const apiHistory = chatHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
        
        // If it's the first message, prepend context
        if (apiHistory.length === 0) {
            apiHistory.push({ role: 'user', parts: [{ text: contextPrompt }] });
            apiHistory.push({ role: 'model', parts: [{ text: "Understood. I am ready to answer questions about this article." }] });
        }

        const response = await chatWithGemini(apiHistory, userMsg);
        setChatHistory(prev => [...prev, { role: 'model', text: response || "I couldn't process that." }]);
    } catch (e) {
        setChatHistory(prev => [...prev, { role: 'model', text: "Connection error." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  const shareUrl = window.location.href;
  const shareText = post ? `Check out "${post.title}" on Nexis Intelligence` : '';

  if (!post) return <div className="flex justify-center p-20 min-h-screen items-center bg-neutral-50 dark:bg-[#050505]"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="bg-neutral-50 dark:bg-[#050505] min-h-screen text-neutral-900 dark:text-white relative selection:bg-orange-500/30 transition-colors duration-300">
      
      {/* Reading Progress Bar */}
      <div className="fixed top-20 left-0 w-full h-1 bg-neutral-200 dark:bg-white/5 z-40">
        <div 
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
            style={{ width: `${scrollProgress}%` }} 
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="mb-12 text-center relative">
          <div className="flex justify-center gap-2 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded border border-neutral-200 dark:border-white/10 text-orange-600 dark:text-orange-500 text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-white/5">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white mb-8 leading-tight tracking-tighter">
            {post.title}
          </h1>
          <div className="flex items-center justify-center space-x-4 text-neutral-500 dark:text-neutral-400 text-xs font-mono border-y border-neutral-200 dark:border-white/5 py-4 w-full md:w-auto inline-flex px-8">
             <div className="flex items-center">
               <div className="w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mr-2 border border-neutral-200 dark:border-white/10 overflow-hidden text-neutral-900 dark:text-white font-bold">
                 {post.authorName[0]}
               </div>
               <span className="font-bold text-neutral-900 dark:text-white uppercase">{post.authorName}</span>
             </div>
             <span>//</span>
             <span>{format(new Date(post.createdAt), 'MMMM dd, yyyy')}</span>
             <span>//</span>
             <span className="flex items-center gap-1"><Volume2 size={12} /> 5 MIN READ</span>
          </div>
        </div>

        {/* Cover Image with Parallax-ish feel */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-16 shadow-2xl border border-neutral-200 dark:border-white/10 relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
            <img src={post.coverImage} alt={post.title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-1000" />
            
            {/* Audio Player Overlay */}
            <button 
                onClick={toggleAudio}
                className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white pl-4 pr-5 py-3 rounded-full flex items-center gap-3 transition-all group/audio shadow-lg"
            >
                {isGeneratingAudio ? (
                    <Loader2 className="animate-spin text-orange-500" size={20} />
                ) : isPlaying ? (
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                        <Pause size={20} className="fill-current" />
                        <span className="text-xs font-bold uppercase tracking-wider">Pause Narration</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Play size={20} className="fill-current" />
                        <span className="text-xs font-bold uppercase tracking-wider">Listen to Article</span>
                    </div>
                )}
            </button>
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose prose-xl dark:prose-invert mx-auto mb-20 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-orange-600 dark:prose-a:text-orange-500 prose-img:rounded-xl prose-img:border prose-img:border-neutral-200 dark:prose-img:border-white/10 prose-blockquote:border-orange-500 prose-blockquote:bg-neutral-100 dark:prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:rounded-r-lg leading-loose text-neutral-700 dark:text-neutral-300 font-serif"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Floating Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-white/90 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-neutral-200 dark:border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-xl dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] relative">
                <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-full transition-all hover:bg-neutral-100 dark:hover:bg-white/10 ${isLiked ? 'text-red-500' : 'text-neutral-400'}`}
                    title="Like"
                >
                    <Heart size={20} className={isLiked ? "fill-current" : ""} />
                </button>
                <div className="w-px h-4 bg-neutral-200 dark:bg-white/10"></div>
                <button 
                    onClick={() => setShowAiChat(!showAiChat)}
                    className={`p-2 rounded-full transition-all hover:bg-neutral-100 dark:hover:bg-white/10 ${showAiChat ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-neutral-400'}`}
                    title="Ask AI"
                >
                    <Sparkles size={20} />
                </button>
                <div className="w-px h-4 bg-neutral-200 dark:bg-white/10"></div>
                <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-2 rounded-full transition-all hover:bg-neutral-100 dark:hover:bg-white/10 ${isBookmarked ? 'text-yellow-500' : 'text-neutral-400'}`}
                    title="Bookmark"
                >
                    <Bookmark size={20} className={isBookmarked ? "fill-current" : ""} />
                </button>
                <div className="w-px h-4 bg-neutral-200 dark:bg-white/10"></div>
                <div className="relative">
                    <button 
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={`p-2 rounded-full transition-all hover:bg-neutral-100 dark:hover:bg-white/10 ${showShareMenu ? 'text-black dark:text-white' : 'text-neutral-400'}`}
                        title="Share"
                    >
                        <Share2 size={20} />
                    </button>
                    {/* Share Menu */}
                    <AnimatePresence>
                        {showShareMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-white/10 rounded-xl p-2 flex flex-col gap-1 shadow-xl"
                            >
                                <a 
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white whitespace-nowrap"
                                >
                                    <Twitter size={16} /> Twitter
                                </a>
                                <a 
                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white whitespace-nowrap"
                                >
                                    <Linkedin size={16} /> LinkedIn
                                </a>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        setShowShareMenu(false);
                                        alert('Link copied!');
                                    }}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white whitespace-nowrap w-full text-left"
                                >
                                    <LinkIcon size={16} /> Copy Link
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>

        {/* AI Chat Drawer */}
        <AnimatePresence>
            {showAiChat && (
                <motion.div 
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="fixed top-24 right-4 bottom-24 w-80 md:w-96 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
                >
                    <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-neutral-50 dark:bg-[#111]">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-bold text-sm uppercase tracking-wider">
                            <Sparkles size={16} /> Contextual Chat
                        </div>
                        <button onClick={() => setShowAiChat(false)} className="text-neutral-500 hover:text-black dark:hover:text-white"><X size={16} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-[#0a0a0a]">
                        {chatHistory.length === 0 && (
                            <div className="text-center mt-10 space-y-3">
                                <div className="w-12 h-12 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-neutral-500">
                                    <MessageSquare size={24} />
                                </div>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">Ask me anything about this article.</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    <button onClick={() => setChatInput("Summarize this article")} className="text-xs border border-neutral-200 dark:border-white/10 rounded-full px-3 py-1 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-500">Summarize</button>
                                    <button onClick={() => setChatInput("Explain the key takeaways")} className="text-xs border border-neutral-200 dark:border-white/10 rounded-full px-3 py-1 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors text-neutral-500">Key Takeaways</button>
                                </div>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white rounded-tr-sm' 
                                        : 'bg-orange-50 dark:bg-orange-900/10 text-neutral-700 dark:text-neutral-200 border border-orange-200 dark:border-orange-500/20 rounded-tl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-neutral-100 dark:bg-white/5 p-3 rounded-xl rounded-tl-sm">
                                    <Loader2 className="animate-spin text-neutral-500" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#111]">
                        <div className="relative">
                            <input 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                                placeholder="Ask a question..."
                                className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg pl-4 pr-10 py-3 text-sm focus:border-orange-500 outline-none text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-600"
                            />
                            <button 
                                onClick={handleAiChat}
                                disabled={!chatInput.trim() || isChatLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 hover:text-orange-500 disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>


        {/* Comments Section */}
        <div className="max-w-2xl mx-auto border-t border-neutral-200 dark:border-white/10 pt-16">
          <h3 className="text-xl font-bold mb-8 flex items-center text-neutral-900 dark:text-white uppercase tracking-widest">
            <MessageSquare className="w-5 h-5 mr-3 text-orange-600 dark:text-orange-500" />
            Transmission Log ({comments.length})
          </h3>
          
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-10 relative">
              <div className="relative group">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 rounded-xl p-4 pr-12 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-neutral-900 dark:text-neutral-200 resize-none font-mono text-sm"
                  placeholder="INPUT_COMMENT..."
                  rows={3}
                />
                <button 
                  type="submit" 
                  className="absolute bottom-3 right-3 bg-orange-500 text-white dark:text-black p-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newComment.trim()}
                >
                  <ArrowLeft className="rotate-180 w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-10 p-8 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/5 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="bg-neutral-100 dark:bg-white/5 p-4 rounded-full mb-4">
                    <Lock size={24} className="text-neutral-500" />
                </div>
                <h4 className="text-neutral-900 dark:text-white font-bold mb-1">Authentication Required</h4>
                <p className="text-neutral-500 text-sm mb-4">You must be logged in to participate in this transmission.</p>
                <div className="text-xs text-orange-600 dark:text-orange-500 font-mono uppercase bg-orange-100 dark:bg-orange-500/10 px-3 py-1 rounded border border-orange-200 dark:border-orange-500/20">Secure Channel</div>
            </div>
          )}

          <div className="space-y-6">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-4 animate-in fade-in duration-300">
                <div className="h-10 w-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-bold border border-neutral-200 dark:border-white/10 overflow-hidden">
                  {comment.author.avatarUrl ? <img src={comment.author.avatarUrl} className="w-full h-full object-cover" /> : comment.author.name[0]}
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-xl border border-neutral-200 dark:border-white/5 flex-1 hover:border-neutral-300 dark:hover:border-white/10 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-bold text-neutral-900 dark:text-white text-sm uppercase tracking-wider">{comment.author.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{format(new Date(comment.createdAt), 'HH:mm dd.MM.yy')}</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;
