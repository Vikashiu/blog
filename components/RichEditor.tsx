
import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, 
  Image as ImageIcon, Sparkles, Plus, Code, Table as TableIcon, 
  Youtube, Minus, AlertCircle, GripVertical, Trash2, Copy, ArrowUp, ArrowDown, Type,
  CheckSquare, Palette, Highlighter, AlertTriangle, X, ChevronRight, Wand2, Scissors, MoveHorizontal, Briefcase, FileText,
  Loader2, Clock, AlignLeft, AlignCenter, AlignRight, MoreHorizontal, Grid, Play, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImage } from '../services/geminiService';
import { useStore } from '../store/useStore';

export interface RichEditorHandle {
  insertHtml: (html: string) => void;
  getHtml: () => string;
}

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAiRequest?: (text: string, instruction?: string) => Promise<void>;
}

const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(({ content, onChange, placeholder, onAiRequest }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useStore();
  
  // Menu States
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  
  // Side Handle States
  const [activeBlock, setActiveBlock] = useState<HTMLElement | null>(null);
  const [activeBlockTop, setActiveBlockTop] = useState<number>(0);
  const [showSideControls, setShowSideControls] = useState(false);
  const [showBlockOptions, setShowBlockOptions] = useState(false);

  // Drag & Drop States
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<{top: number, left: number, width: number} | null>(null);
  const [dropTargetInfo, setDropTargetInfo] = useState<{el: HTMLElement, pos: 'before'|'after'} | null>(null);

  // Bubble Menu & AI
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPos, setBubbleMenuPos] = useState({ top: 0, left: 0 });
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [aiMode, setAiMode] = useState<'none' | 'prompt' | 'loading'>('none');
  const [aiPrompt, setAiPrompt] = useState('');

  // Image Lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Editor Config
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono'>('sans');

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // --- External Control via Ref ---
  useImperativeHandle(ref, () => ({
    insertHtml: (html: string) => {
      insertHtml(html);
    },
    getHtml: () => editorRef.current?.innerHTML || ''
  }));

  // --- Synchronization Logic ---
  useEffect(() => {
    if (editorRef.current) {
        // Only update innerHTML if it's significantly different from the prop content
        // This prevents cursor jumping during normal typing (where onChange updates content, coming back as prop)
        // But allows external updates (like AI Draft) to fully replace content.
        
        const currentHTML = editorRef.current.innerHTML;
        if (content !== currentHTML) {
             // If the editor is focused, we assume the user is typing and the prop update is just the echo.
             // We only force update if the difference is large (suggesting an external replace/paste) or if not focused.
             const isFocused = document.activeElement === editorRef.current;
             
             // Check if content is empty (reset) or length diff is significant (> 10 chars)
             // or if not focused (e.g. initial load or sidebar insert while blurred)
             if (!isFocused || Math.abs(content.length - currentHTML.length) > 10 || content === '') {
                  editorRef.current.innerHTML = content;
             }
        }
    }
  }, [content]);

  // Update Stats
  useEffect(() => {
      const text = editorRef.current?.innerText || "";
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      setWordCount(words);
      setReadingTime(Math.ceil(words / 200));
  }, [content]);

  // --- Core Logic ---

  const updateActiveBlock = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) {
        if (!isDragging) setShowSideControls(false); 
        return;
    }
    
    let node = selection.anchorNode;
    while (node && node !== editorRef.current && node.parentNode !== editorRef.current) {
        node = node.parentNode;
    }

    if (node && node.parentNode === editorRef.current) {
       const el = node as HTMLElement;
       const editorRect = editorRef.current.getBoundingClientRect();
       const blockRect = el.getBoundingClientRect();
       
       setActiveBlock(el);
       setActiveBlockTop(blockRect.top - editorRect.top + editorRef.current.scrollTop);
       setShowSideControls(true);
    } else {
       if (!isDragging) setShowSideControls(false);
    }
  }, [isDragging]);

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
    updateActiveBlock();
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.focusNode) {
      const text = selection.focusNode.textContent || '';
      if (text.endsWith('/') && !showMenu) {
         const range = selection.getRangeAt(0);
         const rect = range.getBoundingClientRect();
         const editorRect = editorRef.current.getBoundingClientRect();
         setMenuPos({ 
             top: rect.bottom - editorRect.top + editorRef.current.scrollTop + 5, 
             left: rect.left - editorRect.left 
         });
         setShowMenu(true);
      } else if (!text.includes('/')) {
         setShowMenu(false);
      }
    }
  };

  // --- Drag & Drop Handlers ---

  const handleDragStart = (e: React.DragEvent) => {
    if (!activeBlock) return;
    setIsDragging(true);
    setShowBlockOptions(false);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', activeBlock.innerText || '');
    requestAnimationFrame(() => {
        if (activeBlock) activeBlock.classList.add('opacity-40');
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropIndicator(null);
    setDropTargetInfo(null);
    if (activeBlock) activeBlock.classList.remove('opacity-40');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging || !editorRef.current || !activeBlock) return;
    
    const clientY = e.clientY;
    const children = Array.from(editorRef.current.children) as HTMLElement[];
    
    let closest: HTMLElement | null = null;
    let minDiff = Infinity;
    
    children.forEach(child => {
        if (child === activeBlock) return;
        const rect = child.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const diff = Math.abs(clientY - center);
        
        if (diff < minDiff && diff < 150) {
            minDiff = diff;
            closest = child;
        }
    });
    
    if (closest) {
        const rect = (closest as HTMLElement).getBoundingClientRect();
        const isBefore = clientY < (rect.top + rect.height / 2);
        
        setDropIndicator({
            top: isBefore ? rect.top : rect.bottom,
            left: rect.left,
            width: rect.width
        });
        setDropTargetInfo({ el: closest, pos: isBefore ? 'before' : 'after' });
    } else {
        setDropIndicator(null);
        setDropTargetInfo(null);
    }
  }, [isDragging, activeBlock]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging || !activeBlock || !dropTargetInfo || !editorRef.current) {
        handleDragEnd();
        return;
    }
    
    if (dropTargetInfo.pos === 'before') {
        editorRef.current.insertBefore(activeBlock, dropTargetInfo.el);
    } else {
        editorRef.current.insertBefore(activeBlock, dropTargetInfo.el.nextSibling);
    }
    
    onChange(editorRef.current.innerHTML);
    handleDragEnd();
    setTimeout(updateActiveBlock, 50);
  }, [isDragging, activeBlock, dropTargetInfo, onChange, updateActiveBlock]);

  const toggleInlineCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    let node = selection.anchorNode;
    if (node && node.nodeType === 3) node = node.parentElement;
    const el = node as HTMLElement;
    
    if (el && el.tagName === 'CODE') {
        const text = document.createTextNode(el.innerText);
        el.replaceWith(text);
        onChange(editorRef.current?.innerHTML || '');
    } else {
        const text = selection.toString();
        if (text) {
             document.execCommand('insertHTML', false, `<code class="bg-neutral-200 dark:bg-[#2a2a2a] text-red-500 dark:text-[#EB5757] px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-neutral-300 dark:border-white/5 mx-0.5">${text}</code>`);
             setShowBubbleMenu(false);
        }
    }
    onChange(editorRef.current?.innerHTML || '');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggleInlineCode();
        return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;
        
        let node = selection.anchorNode;
        if (node?.nodeType === 3) node = node.parentElement;
        const el = node as HTMLElement;
        
        if (el.closest('pre')) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode('\n');
            range.insertNode(textNode);
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
            onChange(editorRef.current?.innerHTML || '');
            return;
        }

        if (el.closest('blockquote')) {
            e.preventDefault();
            const range = selection.getRangeAt(0);
            const br = document.createElement('br');
            range.deleteContents();
            range.insertNode(br);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            onChange(editorRef.current?.innerHTML || '');
            return;
        }
    }
    setTimeout(updateActiveBlock, 0);
  };

  const checkSelection = useCallback(() => {
    requestAnimationFrame(() => {
        updateActiveBlock();
        const selection = window.getSelection();
        
        if (selection && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode)) {
            const text = selection.toString().trim();
            if (text.length > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const editorRect = editorRef.current!.getBoundingClientRect();
                
                setSelectionRange(range);
                setBubbleMenuPos({
                    top: rect.top - editorRect.top + editorRef.current!.scrollTop - 60,
                    left: rect.left - editorRect.left + (rect.width / 2) - 220 
                });
                setShowBubbleMenu(true);
                return;
            }
        }
        
        if (aiMode === 'none') {
            setShowBubbleMenu(false);
        }
    });
  }, [aiMode, updateActiveBlock]);

  const handleEditorClick = (e: React.MouseEvent) => {
      checkSelection();
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
          setLightboxSrc((target as HTMLImageElement).src);
      }
  };

  // --- Commands ---

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
    if (command !== 'hiliteColor' && command !== 'backColor' && !command.startsWith('justify')) {
        setShowMenu(false);
    }
  };

  const insertHtml = (html: string) => {
    if (!editorRef.current) return;
    
    // Ensure editor has focus or restore it
    editorRef.current.focus();
    
    // Check if we have a valid selection inside the editor
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current.contains(selection.anchorNode)) {
        // If lost focus (e.g. clicking sidebar button), append to end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false); // End
        selection?.removeAllRanges();
        selection?.addRange(range);
    }

    if (selection && selection.focusNode && selection.focusNode.textContent?.endsWith('/')) {
         const range = document.createRange();
         const node = selection.focusNode;
         range.setStart(node, node.textContent.length - 1);
         range.setEnd(node, node.textContent.length);
         selection.removeAllRanges();
         selection.addRange(range);
         document.execCommand('delete');
    }
    
    document.execCommand('insertHTML', false, html);
    
    // Append a break if needed to continue typing easily
    if (!html.includes('grid-cols') && !html.includes('iframe')) {
         // document.execCommand('insertHTML', false, '<br>'); 
         // Removed auto-break as it can duplicate lines in some contexts
    }

    onChange(editorRef.current.innerHTML);
    setShowMenu(false);
  };

  const handleAddNextLine = () => {
      if (!activeBlock || !editorRef.current) return;
      const newBlock = document.createElement('p');
      newBlock.innerHTML = '<br>'; 
      if (activeBlock.nextSibling) {
          editorRef.current.insertBefore(newBlock, activeBlock.nextSibling);
      } else {
          editorRef.current.appendChild(newBlock);
      }
      const range = document.createRange();
      range.setStart(newBlock, 0);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      updateActiveBlock();
      // Menu
      const rect = newBlock.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      setMenuPos({ 
          top: rect.bottom - editorRect.top + editorRef.current.scrollTop + 5, 
          left: 0 
      });
      setShowMenu(true);
  };

  const handleAiAction = async (instruction: string, customPrompt?: string) => {
    if (!selectionRange || !onAiRequest) return;
    setAiMode('loading');
    await onAiRequest(selectionRange.toString(), customPrompt || instruction);
    setAiMode('none');
    setShowBubbleMenu(false);
    setAiPrompt('');
  };

  const handleVideoEmbed = () => {
     const url = prompt('Enter YouTube Video URL:');
     if(!url) {
         setShowMenu(false);
         return;
     }
     const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*).*/)?.[1];
     if(videoId) {
        insertHtml(`
            <div class="relative w-full aspect-video my-6 rounded-xl overflow-hidden bg-neutral-900 shadow-xl group" contenteditable="false">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}" 
                    class="absolute inset-0 w-full h-full" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                ></iframe>
                <div class="absolute inset-0 pointer-events-none border border-white/5 rounded-xl"></div>
            </div>
        `);
     } else {
         alert("Invalid YouTube URL");
         setShowMenu(false);
     }
  };
  
  const handleGenerateAiImage = async () => {
      const promptText = prompt("Describe the image:");
      if (!promptText) {
          setShowMenu(false);
          return;
      }
      
      const id = `loading-${Date.now()}`;
      insertHtml(`
          <div id="${id}" class="my-8 p-12 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-800 flex flex-col items-center justify-center text-neutral-500 gap-4 animate-pulse select-none" contenteditable="false">
              <span class="text-3xl animate-spin">✨</span> 
              <span className="font-medium">Generating "${promptText}"...</span>
          </div>
      `);
      
      const doGenerate = async () => {
        const imageUrl = await generateImage(promptText);
        const placeholder = editorRef.current?.querySelector(`#${id}`);
        if (placeholder) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = "w-full rounded-lg my-8 shadow-2xl cursor-pointer hover:opacity-90 transition-opacity";
            img.alt = promptText;
            placeholder.replaceWith(img);
            onChange(editorRef.current?.innerHTML || '');
        }
      };

      try {
          await doGenerate();
      } catch (e: any) {
          if (e.message.includes('API_KEY_REQUIRED') || e.message.includes('403')) {
             if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
                 await (window as any).aistudio.openSelectKey();
                 try {
                     await doGenerate();
                     return;
                 } catch (retryError) {
                 }
             }
          }
          const placeholder = editorRef.current?.querySelector(`#${id}`);
          if (placeholder) {
             placeholder.innerHTML = `<span class="text-red-500 flex items-center gap-2 text-sm"><AlertCircle size={16}/> Failed: ${e.message}</span>`;
             placeholder.className = "my-6 p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-center";
          }
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const src = e.target?.result as string;
        insertHtml(`
            <div class="my-6 select-none group relative" contenteditable="false">
                <img src="${src}" class="w-full rounded-xl shadow-lg" />
            </div>
        `);
    };
    reader.readAsDataURL(file);
    
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const promises: Promise<string>[] = [];
    Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        promises.push(new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        }));
    });

    Promise.all(promises).then((images: string[]) => {
        const imagesHtml = images.map(src => 
            `<div class="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 dark:border-white/10 group cursor-pointer">
                <img src="${src}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>`
        ).join('');

        const galleryHtml = `
            <div class="my-2 select-none" contenteditable="false">
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    ${imagesHtml}
                </div>
            </div>
        `;
        insertHtml(galleryHtml);
    });
    
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleBlockAction = (action: 'delete' | 'duplicate' | 'up' | 'down') => {
      if (!activeBlock || !editorRef.current) return;
      switch(action) {
          case 'delete': activeBlock.remove(); break;
          case 'duplicate': 
              const clone = activeBlock.cloneNode(true);
              editorRef.current.insertBefore(clone, activeBlock.nextSibling);
              break;
          case 'up': 
              if (activeBlock.previousSibling) editorRef.current.insertBefore(activeBlock, activeBlock.previousSibling);
              break;
          case 'down': 
              if (activeBlock.nextSibling) editorRef.current.insertBefore(activeBlock.nextSibling, activeBlock);
              break;
      }
      onChange(editorRef.current.innerHTML);
      setShowBlockOptions(false);
      setTimeout(updateActiveBlock, 0);
  };

  const blockTypes = [
    { label: 'Text', icon: Type, desc: 'Just start writing.', action: () => execCommand('formatBlock', 'P') },
    { label: 'Heading 1', icon: Heading1, desc: 'Big section heading.', action: () => execCommand('formatBlock', 'H1') },
    { label: 'Heading 2', icon: Heading2, desc: 'Medium section heading.', action: () => execCommand('formatBlock', 'H2') },
    { label: 'Heading 3', icon: Heading3, desc: 'Small section heading.', action: () => execCommand('formatBlock', 'H3') },
    { label: 'Bulleted List', icon: List, desc: 'Create a list.', action: () => execCommand('insertUnorderedList') },
    { label: 'Numbered List', icon: ListOrdered, desc: 'Create a numbered list.', action: () => execCommand('insertOrderedList') },
    { label: 'Quote', icon: Quote, desc: 'Capture a quote.', action: () => insertHtml('<blockquote class="border-l-4 border-neutral-900 dark:border-white pl-5 py-1 text-xl italic text-neutral-800 dark:text-white my-6">Empty quote</blockquote>') },
    { label: 'Callout', icon: AlertCircle, desc: 'Highlight information.', action: () => insertHtml('<div class="flex items-start gap-4 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg my-6 border border-neutral-200 dark:border-neutral-800"><span class="text-xl">💡</span><div class="flex-1"><strong class="text-neutral-900 dark:text-white block mb-0.5">Idea</strong><p class="m-0 text-neutral-600 dark:text-neutral-400 text-sm">Enter content...</p></div></div>') },
    { label: 'Code Block', icon: Code, desc: 'Capture code.', action: () => insertHtml('<pre class="bg-neutral-900 p-4 rounded-lg text-sm font-mono text-neutral-200 my-6 overflow-x-auto border border-white/5"><code>// Code</code></pre>') },
    { label: 'Divider', icon: Minus, desc: 'Divide blocks.', action: () => insertHtml('<hr class="border-neutral-200 dark:border-neutral-800 my-8" />') },
    { label: 'Image', icon: ImageIcon, desc: 'Upload single image.', action: () => imageInputRef.current?.click() },
    { label: 'AI Image', icon: Sparkles, desc: 'Generate visual.', action: handleGenerateAiImage },
    { label: 'Gallery', icon: Grid, desc: 'Upload grid.', action: () => galleryInputRef.current?.click() },
    { label: 'Video', icon: Youtube, desc: 'Embed YouTube.', action: handleVideoEmbed },
  ];

  const getFontClass = () => {
      switch(fontStyle) {
          case 'serif': return 'font-serif';
          case 'mono': return 'font-mono';
          default: return 'font-sans';
      }
  };

  return (
    <>
    {dropIndicator && (
        <div 
            className="fixed h-1 bg-orange-500 z-50 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(249,115,22,0.5)] rounded-full"
            style={{ 
                top: dropIndicator.top, 
                left: dropIndicator.left, 
                width: dropIndicator.width 
            }} 
        />
    )}

    <div className={`relative min-h-[60vh] group pl-24 pr-12 pb-40 ${getFontClass()}`}>
      {/* Hidden Inputs */}
      <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" multiple accept="image/*" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

      {/* Side Controls */}
      <AnimatePresence>
         {showSideControls && activeBlock && (
             <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ top: activeBlockTop }}
                className="absolute left-8 z-30 flex items-center gap-1 h-7 select-none"
             >
                 <button onClick={handleAddNextLine} className="p-1 text-neutral-400 hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-white transition-colors"><Plus size={18} /></button>
                 <div className="relative">
                    <button 
                        draggable
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={() => setShowBlockOptions(!showBlockOptions)} 
                        className="p-1 text-neutral-400 hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-white transition-colors cursor-grab active:cursor-grabbing hover:bg-neutral-100 dark:hover:bg-white/5 rounded"
                    >
                        <GripVertical size={18} />
                    </button>
                    {showBlockOptions && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowBlockOptions(false)}></div>
                            <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-white/5 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                                <button onClick={() => handleBlockAction('delete')} className="w-full text-left px-3 py-1.5 text-xs text-red-500 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                                <button onClick={() => handleBlockAction('duplicate')} className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-2"><Copy size={14} /> Duplicate</button>
                            </div>
                        </>
                    )}
                 </div>
             </motion.div>
         )}
      </AnimatePresence>

      {/* Slash Menu */}
      <AnimatePresence>
        {showMenu && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    style={{ top: menuPos.top, left: menuPos.left }}
                    className="absolute z-50 w-72 bg-white dark:bg-[#1f1f1f] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar border border-neutral-200 dark:border-white/5"
                >
                    <div className="px-3 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 dark:bg-[#252525] sticky top-0 z-10 border-b border-neutral-200 dark:border-white/5">Blocks</div>
                    <div className="p-1 space-y-0.5">
                        {blockTypes.map((item, i) => (
                            <button key={i} onClick={item.action} className="w-full text-left px-2 py-2 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded transition-colors group/btn">
                                <div className="w-10 h-10 rounded border border-neutral-200 dark:border-white/10 flex items-center justify-center bg-neutral-100 dark:bg-black/40 text-neutral-500 dark:text-neutral-400 group-hover/btn:text-neutral-900 dark:group-hover/btn:text-white transition-colors flex-shrink-0"><item.icon size={18} /></div>
                                <div className="overflow-hidden"><div className="font-medium text-sm text-neutral-900 dark:text-neutral-200 group-hover/btn:text-black dark:group-hover/btn:text-white">{item.label}</div><div className="text-[10px] text-neutral-500 truncate">{item.desc}</div></div>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* Bubble Menu */}
      <AnimatePresence>
        {showBubbleMenu && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            style={{ top: bubbleMenuPos.top, left: Math.max(0, bubbleMenuPos.left) }}
            className="absolute z-50 bg-white dark:bg-[#1f1f1f] rounded-md shadow-xl flex flex-col p-1 gap-1 min-w-[440px] border border-neutral-200 dark:border-white/10"
            onMouseDown={(e) => e.preventDefault()} 
          >
             {aiMode === 'loading' ? (
                 <div className="flex items-center justify-center p-2 gap-2 text-orange-500">
                     <Loader2 className="animate-spin" size={14} />
                     <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Thinking...</span>
                 </div>
             ) : aiMode === 'prompt' ? (
                 <div className="flex items-center p-1 w-full">
                    <Sparkles size={14} className="text-purple-500 ml-2 mr-2" />
                    <input 
                        autoFocus
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAiAction('custom', aiPrompt);
                            if (e.key === 'Escape') setAiMode('none');
                        }}
                        placeholder="Ask AI to change this..."
                        className="bg-transparent border-none text-neutral-900 dark:text-white text-xs focus:ring-0 p-1 flex-1 placeholder:text-neutral-400 outline-none"
                    />
                    <button onClick={() => handleAiAction('custom', aiPrompt)} className="p-1 hover:text-neutral-900 dark:hover:text-white text-neutral-400"><ArrowUp size={14} /></button>
                 </div>
             ) : (
                 <div className="flex items-center gap-0.5">
                    <div className="flex gap-0.5 pr-2 border-r border-neutral-200 dark:border-white/10">
                        <button onClick={() => { setFontStyle(prev => prev === 'sans' ? 'serif' : prev === 'serif' ? 'mono' : 'sans') }} className="px-2 py-1 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded transition-colors w-12 text-center" title="Toggle Font">
                            {fontStyle === 'sans' ? 'Sans' : fontStyle === 'serif' ? 'Serif' : 'Mono'}
                        </button>
                    </div>

                    <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Bold size={14}/></button>
                    <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Italic size={14}/></button>
                    <button onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Minus size={14}/></button>
                    <button onClick={toggleInlineCode} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Code size={14}/></button>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-white/10 mx-1"></div>

                    <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><AlignLeft size={14}/></button>
                    <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><AlignCenter size={14}/></button>
                    <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><AlignRight size={14}/></button>
                    
                    <button onClick={() => execCommand('backColor', '#fde047')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"><Highlighter size={14}/></button>

                    <div className="w-px h-4 bg-neutral-200 dark:bg-white/10 mx-1"></div>
                    
                    <button onClick={() => handleAiAction('improve', 'Improve the writing quality.')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex gap-1 items-center font-medium text-xs px-2">
                        <Wand2 size={12} /> Improve
                    </button>
                    <button onClick={() => handleAiAction('shorten', 'Make this shorter.')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"><Scissors size={14} /></button>
                    
                    <div className="w-px h-4 bg-neutral-200 dark:bg-white/10 mx-1"></div>

                    <button 
                        onClick={() => setAiMode('prompt')}
                        className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded transition-colors text-xs font-medium"
                    >
                        Ask AI...
                    </button>
                 </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer Stats */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-neutral-200 dark:border-white/5 rounded-full px-4 py-1.5 flex items-center gap-4 text-[10px] font-mono text-neutral-500 shadow-xl pointer-events-none select-none tracking-widest uppercase">
          <div className="flex items-center gap-2">
              <AlignLeft size={10} />
              <span>{wordCount} words</span>
          </div>
          <div className="w-px h-2 bg-neutral-300 dark:bg-white/10"></div>
          <div className="flex items-center gap-2">
              <Clock size={10} />
              <span>{readingTime} min</span>
          </div>
          <div className="w-px h-2 bg-neutral-300 dark:bg-white/10 mx-1"></div>
          <button 
            onClick={toggleTheme} 
            className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors cursor-pointer pointer-events-auto"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
             {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          </button>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={checkSelection}
        onMouseUp={checkSelection}
        onClick={handleEditorClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="prose prose-xl dark:prose-invert max-w-none outline-none min-h-[60vh] cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400 dark:empty:before:text-neutral-600 focus:before:content-none leading-[1.8] tracking-wider text-neutral-900 dark:text-neutral-200 prose-headings:font-bold prose-headings:text-neutral-900 dark:prose-headings:text-white prose-p:text-neutral-700 dark:prose-p:text-neutral-300"
        data-placeholder={placeholder || "Type '/' for commands..."}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>

    <AnimatePresence>
      {lightboxSrc && (
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
           onClick={() => setLightboxSrc(null)}
        >
           <img src={lightboxSrc} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
           <button 
             className="absolute top-6 right-6 text-neutral-500 hover:text-black dark:text-white/50 dark:hover:text-white p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
             onClick={(e) => { e.stopPropagation(); setLightboxSrc(null); }}
           >
               <X size={32}/>
           </button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
});

export default RichEditor;
