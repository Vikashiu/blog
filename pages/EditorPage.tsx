
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Sparkles, Loader2, PanelRight, Maximize2, Minimize2, Wand2, Image as ImageIcon, X, Upload, Hash, Tag, Calendar, Clock } from 'lucide-react';
import RichEditor, { RichEditorHandle } from '../components/RichEditor';
import { AiSidebar } from '../components/AiSidebar';
import { storageService } from '../services/storageService';
import { generateBlogDraft, improveContent, generateMetadata, generateTitle } from '../services/geminiService';
import { BlogPost, BlogStatus } from '../types';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface EditorPageProps {
  onViewChange: (view: string) => void;
  postId?: string;
}

const EditorPage: React.FC<EditorPageProps> = ({ onViewChange, postId }) => {
  const { user, addNotification } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTitleGenerating, setIsTitleGenerating] = useState(false);
  const [isTagGenerating, setIsTagGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  
  // Scheduling State
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const richEditorRef = useRef<RichEditorHandle>(null);

  useEffect(() => {
    if (!user) {
        onViewChange('login');
        return;
    }
    if (postId) {
      storageService.getPostById(postId).then(post => {
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setTags(post.tags);
          setCoverImage(post.coverImage || '');
          if (post.status === 'SCHEDULED' && post.scheduledAt) {
             setScheduleDate(post.scheduledAt.slice(0, 16)); // Format for datetime-local
          }
        }
      });
    }
  }, [postId, user, onViewChange]);

  const handleAiDraft = async () => {
    if (!title) return alert('Please enter a title first');
    setIsAiLoading(true);
    try {
      const draft = await generateBlogDraft(title, "Make it informative and optimistic.");
      // For a draft, we replace content, but now the RichEditor will correctly sync
      setContent(draft); 
      addNotification('success', 'AI draft generated successfully');
    } catch (e) {
      addNotification('error', 'Failed to generate draft');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMagicTitle = async () => {
      if (!content || content.length < 50) return alert("Write some content first so I can generate a title.");
      setIsTitleGenerating(true);
      try {
          const textContent = content.replace(/<[^>]*>?/gm, '');
          const newTitle = await generateTitle(textContent);
          setTitle(newTitle);
          addNotification('success', 'New title generated');
      } catch (e) {
          console.error(e);
      } finally {
          setIsTitleGenerating(false);
      }
  };

  const handleAutoTags = async () => {
      if (!content || content.length < 50) return alert("Write some content first.");
      setIsTagGenerating(true);
      try {
          const textContent = content.replace(/<[^>]*>?/gm, '');
          const metadata = await generateMetadata(textContent);
          // Merge unique tags
          const newTags = Array.from(new Set([...tags, ...metadata.tags]));
          setTags(newTags);
          addNotification('success', `Added ${metadata.tags.length} new tags`);
      } catch (e) {
          console.error(e);
      } finally {
          setIsTagGenerating(false);
      }
  };

  const handleAiImprove = async (textToImprove: string, instruction?: string) => {
    return new Promise<void>(async (resolve) => {
        try {
            const improved = await improveContent(textToImprove, instruction);
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const div = document.createElement('div');
                div.innerHTML = improved;
                const frag = document.createDocumentFragment();
                let node;
                while ( (node = div.firstChild) ) {
                    frag.appendChild(node);
                }
                range.insertNode(frag);
            }
            addNotification('success', 'Content refined');
        } catch (e) {
            addNotification('error', 'Improvement failed');
        } finally {
            resolve();
        }
    });
  };
  
  const handleSidebarInsert = (textToInsert: string) => {
      // Use ref to insert HTML directly into the editor for accurate cursor placement and history
      if (richEditorRef.current) {
          richEditorRef.current.insertHtml(` ${textToInsert} `);
          addNotification('success', 'Content inserted');
      } else {
          // Fallback if ref not available (shouldn't happen)
          setContent(prev => prev + " " + textToInsert);
      }
  };

  // Image Upload Handlers
  const triggerImageUpload = () => {
      fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCoverImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // Tag Handlers
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
          e.preventDefault();
          if (!tags.includes(tagInput.trim())) {
              setTags([...tags, tagInput.trim()]);
          }
          setTagInput('');
      } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
          setTags(tags.slice(0, -1));
      }
  };

  const removeTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async (statusOverride?: BlogStatus) => {
    if (!user || !title) {
        addNotification('error', 'Title is required');
        return;
    }
    
    // Determine status: override > scheduled check > default to published/draft
    let finalStatus: BlogStatus = statusOverride || 'DRAFT';
    let scheduledTimeStr = undefined;

    if (statusOverride === 'SCHEDULED') {
        if (!scheduleDate) {
            addNotification('error', 'Please select a date/time to schedule');
            return;
        }
        scheduledTimeStr = new Date(scheduleDate).toISOString();
        if (new Date(scheduledTimeStr) <= new Date()) {
             addNotification('warning', 'Scheduled time is in the past. Publishing immediately.');
             finalStatus = 'PUBLISHED';
             scheduledTimeStr = undefined;
        }
    }

    setSaving(true);
    let finalTags = tags;
    let summary = '';
    
    try {
      if (content.length > 50) {
        const metadata = await generateMetadata(content);
        if (tags.length === 0) finalTags = metadata.tags;
        summary = metadata.summary;
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const post: BlogPost = {
        id: postId || Math.random().toString(36).substr(2, 9),
        title,
        slug,
        content,
        authorId: user.id,
        authorName: user.name,
        status: finalStatus,
        tags: finalTags,
        summary,
        createdAt: postId ? (await storageService.getPostById(postId))?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledAt: scheduledTimeStr,
        coverImage: coverImage 
      };

      await storageService.savePost(post);
      
      if (finalStatus === 'SCHEDULED') {
          addNotification('success', `Post scheduled for ${format(new Date(scheduledTimeStr!), 'PP p')}`);
      } else if (finalStatus === 'PUBLISHED') {
          addNotification('success', 'Post published successfully');
      } else {
          addNotification('info', 'Draft saved');
      }
      
      onViewChange('dashboard');
    } catch (e) {
      console.error(e);
      addNotification('error', 'Error saving post');
    } finally {
      setSaving(false);
      setShowScheduleDialog(false);
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
    <motion.div 
        layout
        className={`bg-white dark:bg-[#050505] min-h-screen transition-all duration-500 ${focusMode ? 'fixed inset-0 z-50 overflow-y-auto' : 'max-w-7xl mx-auto px-4 py-8 relative'}`}
    >
      
      {/* Top Bar */}
      <motion.div 
        className={`flex items-center justify-between mb-8 sticky top-0 z-40 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md py-4 border-b border-neutral-200 dark:border-white/5 transition-all duration-300 ${focusMode ? 'px-8' : '-mx-4 px-4 top-20'}`}
      >
        <div className="flex items-center gap-4">
            {!focusMode && (
                <button onClick={() => onViewChange('dashboard')} className="group flex items-center text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                <div className="p-2 rounded bg-neutral-100 dark:bg-white/5 group-hover:bg-neutral-200 dark:group-hover:bg-white/10 mr-2 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm hidden md:inline">DASHBOARD</span>
                </button>
            )}
            {focusMode && (
                <div className="text-orange-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Zen Mode
                </div>
            )}
        </div>

        <div className="flex items-center gap-3">
           {!focusMode && (
                <div className="text-xs text-neutral-500 mr-2 font-mono hidden md:block">
                    {saving ? 'SAVING_DATA...' : 'SYSTEM_SYNCED'}
                </div>
           )}
           
           <button 
             onClick={() => setFocusMode(!focusMode)}
             className={`p-2 rounded border transition-colors ${focusMode ? 'bg-neutral-100 dark:bg-white/10 text-black dark:text-white border-neutral-200 dark:border-white/20' : 'bg-transparent text-neutral-400 border-neutral-200 dark:border-white/10 hover:text-black dark:hover:text-white'}`}
             title={focusMode ? "Exit Zen Mode" : "Enter Zen Mode"}
           >
              {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
           </button>

           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className={`p-2 rounded border transition-colors ${isSidebarOpen ? 'bg-orange-500 text-black border-orange-500' : 'bg-transparent text-neutral-400 border-neutral-200 dark:border-white/10'}`}
           >
              <PanelRight size={18} />
           </button>
           
           <div className="w-px h-6 bg-neutral-200 dark:bg-white/10 mx-1"></div>

           <button 
             onClick={() => handleSave('DRAFT')}
             className="hidden md:block px-5 py-2 text-neutral-600 dark:text-neutral-300 bg-transparent border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 rounded text-xs font-bold uppercase tracking-wider transition-all"
           >
             Save Draft
           </button>
           
           <div className="relative">
                <div className="flex bg-orange-500 rounded text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-all overflow-hidden">
                    <button 
                        onClick={() => handleSave('PUBLISHED')}
                        className="px-5 py-2 hover:bg-orange-600 border-r border-black/10 flex items-center"
                    >
                        {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Publish
                    </button>
                    <button 
                        onClick={() => setShowScheduleDialog(!showScheduleDialog)}
                        className={`px-3 py-2 hover:bg-orange-600 transition-colors ${scheduleDate ? 'bg-orange-600 text-white' : ''}`}
                        title="Schedule Publish"
                    >
                        <Clock size={16} />
                    </button>
                </div>

                {/* Schedule Dialog Popover */}
                <AnimatePresence>
                    {showScheduleDialog && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowScheduleDialog(false)}></div>
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#111] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl z-50 p-4"
                            >
                                <div className="flex items-center gap-2 mb-4 text-neutral-900 dark:text-white font-bold text-sm">
                                    <Calendar size={16} className="text-orange-500" />
                                    Schedule Publication
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs text-neutral-500 uppercase font-bold block mb-2">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-2 text-sm focus:border-orange-500 outline-none text-neutral-900 dark:text-white"
                                    />
                                    <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
                                        Content will be automatically published at the selected time.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setShowScheduleDialog(false)}
                                        className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleSave('SCHEDULED')}
                                        disabled={!scheduleDate}
                                        className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded text-xs font-bold hover:opacity-90 disabled:opacity-50"
                                    >
                                        Confirm Schedule
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
           </div>
        </div>
      </motion.div>

      <div className={`flex items-start transition-all duration-500 ${focusMode ? 'px-4 lg:px-40' : ''}`}>
          {/* Main Editor Area */}
          <div className="flex-1 max-w-4xl mx-auto w-full group/editor-area">
              
              {/* Cover Image Control */}
              <input type="file" ref={fileInputRef} onChange={handleImageFileChange} className="hidden" accept="image/*" />
              <div className="mb-6 relative group/cover">
                  {coverImage ? (
                      <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-white/10">
                          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                              <button 
                                  onClick={triggerImageUpload} 
                                  className="bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/80 flex items-center gap-2 border border-white/10"
                              >
                                  <Upload size={14} /> Change
                              </button>
                              <button 
                                  onClick={() => setCoverImage('')} 
                                  className="bg-black/60 backdrop-blur text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black/80 hover:text-red-300 border border-white/10"
                              >
                                  <X size={14} /> Remove
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="h-10 opacity-0 group-hover/editor-area:opacity-100 transition-opacity duration-300 mb-2">
                         <button 
                             onClick={triggerImageUpload}
                             className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-white/5 text-sm font-medium"
                         >
                             <ImageIcon size={16} /> Add Cover
                         </button>
                      </div>
                  )}
              </div>

              <div className="mb-10 space-y-4">
                <div className="relative group">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Record..."
                        className="w-full text-5xl font-black text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 border-none focus:ring-0 px-0 bg-transparent tracking-tighter leading-tight"
                    />
                    {!title && content.length > 50 && (
                        <button 
                            onClick={handleMagicTitle}
                            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-500 hover:text-white dark:hover:text-black transition-all"
                        >
                            {isTitleGenerating ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                            Generate Title
                        </button>
                    )}
                </div>
                
                {/* Tags Input */}
                <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                    <button 
                        onClick={handleAutoTags}
                        disabled={isTagGenerating}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-500 hover:bg-orange-500/20 border border-orange-500/20 transition-colors text-xs font-bold uppercase tracking-wider mr-2"
                        title="Analyze content and generate tags"
                    >
                        {isTagGenerating ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                        <span>Suggest Tags</span>
                    </button>
                    
                    <div className="flex items-center gap-2 text-neutral-400 dark:text-neutral-600 mr-1">
                        <Hash size={14} />
                    </div>

                    {tags.map(tag => (
                        <span key={tag} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/5 px-2 py-0.5 rounded text-xs flex items-center gap-1 group/tag">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="text-neutral-400 hover:text-red-500"><X size={12}/></button>
                        </span>
                    ))}
                    <input 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder={tags.length === 0 ? "Add tags..." : ""}
                        className="bg-transparent text-sm text-neutral-500 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none min-w-[100px]"
                    />
                </div>

                {!focusMode && (
                    <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-white/5">
                        <button 
                            onClick={handleAiDraft}
                            disabled={isAiLoading || !title}
                            className="flex items-center px-4 py-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-orange-600 dark:text-orange-500 rounded text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-white/10 hover:border-orange-500/50 transition-all disabled:opacity-50"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isAiLoading ? 'GENERATING...' : 'AUTONOMOUS DRAFT'}
                        </button>
                    </div>
                )}
              </div>

              <RichEditor 
                ref={richEditorRef}
                content={content} 
                onChange={setContent} 
                onAiRequest={handleAiImprove}
                placeholder="Type '/' for commands or start writing..."
              />
          </div>

          {/* AI Sidebar */}
          {isSidebarOpen && (
              <div className={`${focusMode ? 'fixed right-4 top-24 h-[80vh] z-50' : ''}`}>
                  <AiSidebar 
                    isOpen={isSidebarOpen} 
                    onClose={() => setIsSidebarOpen(false)} 
                    onInsert={handleSidebarInsert}
                  />
              </div>
          )}
      </div>
    </motion.div>
    </AnimatePresence>
  );
};

export default EditorPage;
