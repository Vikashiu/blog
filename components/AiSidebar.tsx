
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Image as ImageIcon, Mic, Eye, Send, Play, Square, Download, 
  Sparkles, Loader2, StopCircle, Upload, X, Maximize2, Minimize2 
} from 'lucide-react';
import { chatWithGemini, generateImage, transcribeAudio, generateSpeech, analyzeImage } from '../services/geminiService';
import { playPcmAudio } from '../utils/audio';

interface AiSidebarProps {
  onInsert: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'chat' | 'media' | 'audio' | 'vision';

export const AiSidebar: React.FC<AiSidebarProps> = ({ onInsert, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);

  // Image Gen State
  const [imgPrompt, setImgPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);

  // Audio State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [ttsText, setTtsText] = useState('');

  // Vision State
  const [visionImg, setVisionImg] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Utility ---
  
  // Clean AI response: remove markdown code blocks and normalize whitespace
  const cleanAiResponse = (text: string): string => {
      // Remove ```html, ```markdown, or just ``` wrappers
      let cleaned = text.replace(/^```(html|xml|markdown)?/gi, '').replace(/```$/gi, '');
      
      // Remove excessive newlines (more than 2 becomes 2)
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      
      return cleaned.trim();
  };

  // --- Handlers ---

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', text: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setLoading(true);

    try {
      const historyForApi = newHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
      
      // Pass history to maintain context
      const reply = await chatWithGemini(historyForApi.slice(0, -1) as any, newHistory[newHistory.length-1].text);
      
      // Clean the response before setting it in state
      const cleanedReply = cleanAiResponse(reply || "No response.");
      
      setChatHistory(prev => [...prev, { role: 'model', text: cleanedReply }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Error connecting to Gemini." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageGen = async () => {
    if (!imgPrompt) return;
    setLoading(true);
    try {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
           // Proactively prompt if we suspect no key
           try {
             await generateImage(imgPrompt, aspectRatio);
           } catch(e: any) {
             if (e.message.includes('API_KEY_REQUIRED') || e.message.includes('403')) {
                await window.aistudio.openSelectKey();
                // Retry once
                const img = await generateImage(imgPrompt, aspectRatio);
                setGeneratedImg(img);
                return;
             }
             throw e;
           }
        }
        const img = await generateImage(imgPrompt, aspectRatio);
        setGeneratedImg(img);
    } catch (e: any) {
        alert("Generation failed. " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecordingAndTranscribe = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          // Extract base64 part
          const base64Audio = base64String.split(',')[1];
          
          setLoading(true);
          try {
            const text = await transcribeAudio(base64Audio, mimeType);
            onInsert(text);
          } catch (e) {
            console.error(e);
            alert("Transcription failed. Please try again.");
          } finally {
            setLoading(false);
          }
        };
      };
    }
  };

  const handleTTS = async () => {
    if (!ttsText) return;
    setLoading(true);
    try {
      const audioBase64 = await generateSpeech(ttsText);
      playPcmAudio(audioBase64);
    } catch (e) {
      console.error(e);
      alert("TTS failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisionImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!visionImg) return;
    setLoading(true);
    try {
      const base64 = visionImg.split(',')[1];
      const result = await analyzeImage(base64, visionPrompt);
      setAnalysis(result);
    } catch (e) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${isExpanded ? 'w-[600px]' : 'w-80'} h-[calc(100vh-100px)] sticky top-24 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl ml-4 transition-all duration-300 z-30`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center bg-neutral-50 dark:bg-[#0f0f0f]">
        <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-orange-600 dark:text-orange-500" size={16} /> AI Assistant
        </h3>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-neutral-500 hover:text-black dark:hover:text-white transition-colors p-1"
                title={isExpanded ? "Collapse" : "Expand"}
            >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={onClose} className="text-neutral-500 hover:text-black dark:hover:text-white p-1"><X size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-white/5">
        {[
            { id: 'chat', icon: MessageSquare },
            { id: 'media', icon: ImageIcon },
            { id: 'audio', icon: Mic },
            { id: 'vision', icon: Eye }
        ].map(t => (
            <button 
                key={t.id}
                onClick={() => setActiveTab(t.id as Tab)}
                className={`flex-1 p-3 flex justify-center transition-colors ${activeTab === t.id ? 'bg-neutral-100 dark:bg-white/5 text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
            >
                <t.icon size={18} />
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {/* Chat Tab */}
        {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-neutral-100 dark:bg-white/10 ml-4' : 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 mr-4'}`}>
                            {/* Display normalized whitespace and handle long text blocks */}
                            <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            
                            {msg.role === 'model' && (
                                <button onClick={() => onInsert(msg.text)} className="mt-2 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-500 hover:text-orange-500 dark:hover:text-orange-400 flex items-center gap-1">
                                    <Download size={10} /> Insert
                                </button>
                            )}
                        </div>
                    ))}
                    {chatHistory.length === 0 && <div className="text-center text-neutral-500 text-sm mt-10">Ask me to help draft, research, or refine your content.</div>}
                </div>
                <div className="relative">
                    <input 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleChat()}
                        placeholder="Ask Gemini..."
                        className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg py-3 pl-3 pr-10 text-sm focus:border-orange-500 outline-none text-neutral-900 dark:text-white"
                    />
                    <button onClick={handleChat} disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-orange-500">
                        {loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16} />}
                    </button>
                </div>
            </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Prompt</label>
                    <textarea 
                        value={imgPrompt}
                        onChange={e => setImgPrompt(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none resize-none h-24 text-neutral-900 dark:text-white"
                        placeholder="Describe the image..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Aspect Ratio</label>
                    <select 
                        value={aspectRatio}
                        onChange={e => setAspectRatio(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-2 text-sm outline-none text-neutral-900 dark:text-white"
                    >
                        {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleImageGen} 
                    disabled={loading || !imgPrompt}
                    className="w-full py-2 bg-orange-500 text-white dark:text-black font-bold rounded-lg text-sm hover:bg-orange-600 transition-colors flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <ImageIcon size={16} />} Generate
                </button>
                {generatedImg && (
                    <div className="mt-4 group relative">
                        <img src={generatedImg} alt="Generated" className="w-full rounded-lg border border-neutral-200 dark:border-white/10" />
                        <button 
                            onClick={() => onInsert(`<img src="${generatedImg}" alt="${imgPrompt}" class="w-full rounded-lg my-4" />`)}
                            className="absolute bottom-2 right-2 bg-black/80 text-white px-3 py-1 rounded text-xs font-bold hover:bg-orange-500 hover:text-black transition-colors"
                        >
                            Insert
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
            <div className="space-y-6">
                <div className="p-4 bg-neutral-100 dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/5 text-center">
                    <div className="mb-4 text-neutral-500 dark:text-neutral-400 text-sm">Voice Transcription</div>
                    {!isRecording ? (
                        <button 
                            onClick={startRecording}
                            className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50 flex items-center justify-center transition-all mx-auto"
                        >
                            <Mic size={24} />
                        </button>
                    ) : (
                        <button 
                            onClick={stopRecordingAndTranscribe}
                            className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white animate-pulse flex items-center justify-center transition-all mx-auto border border-neutral-300 dark:border-white/20"
                        >
                            <Square size={24} fill="currentColor" />
                        </button>
                    )}
                    <p className="text-xs text-neutral-500 mt-4">{isRecording ? 'Recording... Tap to transcribe' : 'Tap to record'}</p>
                </div>

                <div className="border-t border-neutral-200 dark:border-white/5 pt-6">
                    <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Text to Speech</label>
                    <textarea 
                        value={ttsText}
                        onChange={e => setTtsText(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none resize-none h-20 mb-2 text-neutral-900 dark:text-white"
                        placeholder="Enter text to read aloud..."
                    />
                    <button 
                        onClick={handleTTS} 
                        disabled={loading || !ttsText}
                        className="w-full py-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold rounded-lg text-sm hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors flex justify-center items-center gap-2"
                    >
                         {loading ? <Loader2 className="animate-spin" size={16}/> : <Play size={16} />} Speak
                    </button>
                </div>
            </div>
        )}

        {/* Vision Tab */}
        {activeTab === 'vision' && (
            <div className="space-y-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/50 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all"
                >
                    {visionImg ? (
                        <img src={visionImg} className="max-h-32 mx-auto rounded" />
                    ) : (
                        <>
                            <Upload className="mx-auto text-neutral-500 mb-2" />
                            <p className="text-xs text-neutral-400">Click to upload image</p>
                        </>
                    )}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
                </div>
                
                <textarea 
                    value={visionPrompt}
                    onChange={e => setVisionPrompt(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none resize-none h-20 text-neutral-900 dark:text-white"
                    placeholder="What should I look for?"
                />
                
                <button 
                    onClick={handleAnalyze} 
                    disabled={loading || !visionImg}
                    className="w-full py-2 bg-orange-500 text-white dark:text-black font-bold rounded-lg text-sm hover:bg-orange-600 transition-colors flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <Eye size={16} />} Analyze
                </button>

                {analysis && (
                    <div className="p-3 bg-neutral-100 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/10 text-sm text-neutral-700 dark:text-neutral-300 mt-4">
                        {analysis}
                        <button onClick={() => onInsert(analysis)} className="mt-2 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-500 hover:text-orange-500 dark:hover:text-orange-400 flex items-center gap-1">
                             <Download size={10} /> Insert Result
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
