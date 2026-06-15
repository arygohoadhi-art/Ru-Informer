import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse, generateImage, generateSpeech } from '../services/geminiService';
import { 
  Send, Bot, User, Loader2, Sparkles, MessageCircle, X, 
  GraduationCap, Users, Zap, DollarSign, ChevronRight, 
  Image as ImageIcon, Mic, Paperclip, Play, Pause, 
  Trash2, Plus, Volume2, Maximize2, Minimize2, FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MessagePart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
  audioUrl?: string; // Client side only for playback
}

interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}

interface StagedFile {
  file: File;
  preview: string;
  type: 'image' | 'audio';
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function MentorChat({ initialMessage, onClose }: { initialMessage?: string, onClose?: () => void }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem('ru_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Handle initial message or existing session
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      startNewSession(initialMessage);
    }
  }, [initialMessage]);

  // Sync current active session to local storage
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      const updatedSessions = sessions.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages, timestamp: Date.now() } 
          : s
      );
      
      // If active session doesn't exist yet (first message), create it
      if (!sessions.find(s => s.id === activeSessionId)) {
        const firstMessage = messages.find(m => m.role === 'user')?.parts[0].text || "New Intelligence";
        const newSession: ChatSession = {
          id: activeSessionId,
          title: firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : ''),
          messages,
          timestamp: Date.now()
        };
        const finalSessions = [newSession, ...sessions];
        setSessions(finalSessions);
        localStorage.setItem('ru_chat_sessions', JSON.stringify(finalSessions));
      } else {
        setSessions(updatedSessions);
        localStorage.setItem('ru_chat_sessions', JSON.stringify(updatedSessions));
      }
    }
  }, [messages, activeSessionId]);

  const startNewSession = (msg?: string) => {
    const newId = crypto.randomUUID();
    setActiveSessionId(newId);
    setMessages([]);
    if (msg) {
      handleSend(undefined, msg, newId);
    }
  };

  const loadSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('ru_chat_sessions', JSON.stringify(updated));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      let type: 'image' | 'audio' | 'document' | null = null;
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type === 'application/pdf' || file.type === 'text/plain') type = 'document';

      if (type) {
        setStagedFiles(prev => [...prev, {
          file,
          preview: type === 'image' ? URL.createObjectURL(file) : '',
          type: type as any
        }]);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
          setStagedFiles(prev => [...prev, {
            file: audioFile,
            preview: '',
            type: 'audio'
          }]);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Audio recording failed:", err);
        alert("Please enable microphone access to record voice queries.");
      }
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string, targetSessionId?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && stagedFiles.length === 0) || loading) return;

    if (!activeSessionId && !targetSessionId) {
      const newId = crypto.randomUUID();
      setActiveSessionId(newId);
    }

    setLoading(true);
    setInput('');
    
    // Prepare User Message Parts
    const userParts: MessagePart[] = [];
    if (textToSend.trim()) userParts.push({ text: textToSend });
    
    for (const staged of stagedFiles) {
      const base64 = await fileToBase64(staged.file);
      userParts.push({
        inlineData: {
          data: base64,
          mimeType: staged.file.type
        }
      });
    }

    const newUserMessage: Message = { role: 'user', parts: userParts };
    setMessages(prev => [...prev, newUserMessage]);
    setStagedFiles([]);

    try {
      // Logic for special commands (e.g. "generate image")
      if (textToSend.toLowerCase().includes('generate image') || textToSend.toLowerCase().includes('draw')) {
        const imageUrl = await generateImage(textToSend);
        if (imageUrl) {
          const modelMessage: Message = {
            role: 'model',
            parts: [
              { text: "I've generated this visualization for you:" },
              { inlineData: { data: imageUrl.split(',')[1], mimeType: 'image/png' } }
            ]
          };
          setMessages(prev => [...prev, modelMessage]);
          setLoading(false);
          return;
        }
      }

      const responseText = await getChatResponse(userParts, messages);
      
      // Auto-TTS if audio was involved or explicitly asked
      let audioUrl = undefined;
      if (textToSend.toLowerCase().includes('talk') || textToSend.toLowerCase().includes('listen') || stagedFiles.some(f => f.type === 'audio')) {
        audioUrl = await generateSpeech(responseText || "");
      }

      const modelMessage: Message = { 
        role: 'model', 
        parts: [{ text: responseText, audioUrl }] 
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        parts: [{ text: "Synchronizaton error in RU Node. Please try again." }] 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const playSpeech = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#fcfcfc] flex overflow-hidden font-sans">
      <audio ref={audioRef} className="hidden" />
      
      {/* Sidebar - Chat History Feel */}
      <motion.div 
        animate={{ width: isSidebarOpen ? 280 : 0 }}
        className="h-full bg-white border-r border-gray-100 hidden md:flex flex-col overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-[#004d39] text-white">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#ffd700]" />
             </div>
             <span className="font-display font-black text-xs uppercase tracking-widest">Navigator v2</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-white/10 p-1 rounded">
             <Minimize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
           <button 
            onClick={() => startNewSession()}
            className="w-full text-left p-4 rounded-2xl bg-gray-50 border border-[#006a4e]/10 text-xs font-bold text-[#006a4e] flex items-center gap-3 hover:bg-white transition-all shadow-sm"
           >
              <Plus className="w-4 h-4" /> New Session
           </button>
           <div className="pt-6 px-2">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Past Intelligence</p>
             <div className="space-y-1">
                {sessions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => loadSession(s)}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                      activeSessionId === s.id ? "bg-emerald-50 text-[#006a4e]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageCircle className={cn("w-3.5 h-3.5 shrink-0", activeSessionId === s.id ? "text-[#006a4e]" : "text-gray-300")} />
                      <span className="text-xs font-bold truncate">{s.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-[10px] font-medium text-gray-400 italic p-2">No archived nodes yet.</p>
                )}
             </div>
           </div>
        </div>
        <div className="p-6 bg-gray-50 space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffd700] flex items-center justify-center text-[#004d39] font-black text-[10px]">AD</div>
              <div className="flex-1">
                 <p className="text-[10px] font-black text-gray-900 truncate">Academic Node</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase">Synchronized</p>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Header */}
        <div className="h-16 md:h-20 px-6 flex items-center justify-between border-b border-gray-50 glassmorphism z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg md:block hidden">
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-sm md:text-lg font-display font-black text-gray-900 tracking-tight">RU Informer AI</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Multimodal Node</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <Sparkles className="w-5 h-5" />
             </button>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12 space-y-10 scroll-smooth" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 max-w-2xl mx-auto py-12">
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-[#006a4e] to-emerald-800 flex items-center justify-center shadow-2xl relative"
               >
                 <Bot className="w-10 h-10 md:w-12 md:h-12 text-[#ffd700]" />
                 <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ffd700] rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-[#006a4e]" />
                 </div>
               </motion.div>
               <div className="space-y-6">
                 <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 tracking-tight">How can I assist your RU journey?</h1>
                 <p className="text-sm md:text-base text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                   Upload documents, share photos of your syllabus, or record voice queries for advanced academic analysis.
                 </p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {[
                    { q: 'Analyze my RU marksheet', icon: <ImageIcon className="w-4 h-4 text-emerald-500" /> },
                    { q: 'Summary of TSC club events', icon: <Users className="w-4 h-4 text-blue-500" /> },
                    { q: 'Spoken guide for BCS', icon: <Mic className="w-4 h-4 text-purple-500" /> },
                    { q: 'Roadmap for Pharma Tech', icon: <Zap className="w-4 h-4 text-amber-500" /> }
                  ].map(item => (
                    <button
                      key={item.q}
                      onClick={() => handleSend(undefined, item.q)}
                      className="p-6 text-xs md:text-sm bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-[#006a4e] hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 text-left font-bold text-gray-700">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                        {item.q}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-[#006a4e]" />
                    </button>
                  ))}
               </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex gap-4 md:gap-8 max-w-5xl mx-auto",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                m.role === 'user' ? "bg-gray-100 text-gray-400" : "bg-[#004d39] text-[#ffd700]"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4 md:w-6 md:h-6" /> : <Bot className="w-4 h-4 md:w-6 md:h-6" />}
              </div>
              
              <div className="flex-1 space-y-4 max-w-[85%] md:max-w-[70%]">
                 <div className={cn(
                   "p-5 md:p-8 rounded-[2rem] shadow-sm text-sm md:text-base leading-relaxed font-medium",
                   m.role === 'user' 
                    ? "bg-gray-50 text-gray-800 rounded-tr-none border border-gray-100" 
                    : "bg-white text-gray-900 rounded-tl-none border border-emerald-50"
                 )}>
                   {m.parts.map((p, idx) => (
                     <div key={idx} className="space-y-4">
                       {p.text && <p className="whitespace-pre-wrap">{p.text}</p>}
                       {p.inlineData && (
                         <div className="rounded-2xl overflow-hidden border border-gray-100 max-w-sm mt-4">
                           {p.inlineData.mimeType.startsWith('image/') ? (
                             <img 
                               src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} 
                               alt="AI Content" 
                               className="w-full h-auto object-cover"
                             />
                           ) : p.inlineData.mimeType === 'application/pdf' ? (
                             <div className="p-6 bg-blue-50 flex items-center gap-4">
                               <FileText className="w-8 h-8 text-blue-500" />
                               <div className="text-left">
                                 <p className="text-sm font-black text-blue-900">Document Uploaded</p>
                                 <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">PDF Data Node</p>
                               </div>
                             </div>
                           ) : p.inlineData.mimeType.startsWith('audio/') ? (
                             <div className="p-6 bg-red-50 flex items-center gap-4">
                               <Mic className="w-8 h-8 text-red-500" />
                               <div className="text-left">
                                 <p className="text-sm font-black text-red-900">Audio Node</p>
                                 <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Voice Processing</p>
                               </div>
                             </div>
                           ) : (
                             <div className="p-6 bg-gray-50 flex items-center gap-4">
                               <Paperclip className="w-8 h-8 text-gray-500" />
                               <p className="text-sm font-black text-gray-900">Generic Data attachment</p>
                             </div>
                           )}
                         </div>
                       )}
                       {p.audioUrl && (
                         <button 
                           onClick={() => playSpeech(p.audioUrl!)}
                           className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-[#006a4e] rounded-xl hover:bg-emerald-100 transition-colors mt-4 font-black text-xs uppercase"
                         >
                           <Volume2 className="w-4 h-4" /> Listen to Audio
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex gap-4 md:gap-8 max-w-5xl mx-auto items-start">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-2xl bg-[#004d39] flex items-center justify-center animate-pulse shrink-0">
                <Bot className="w-4 h-4 md:w-6 md:h-6 text-[#ffd700]" />
              </div>
              <div className="p-6 md:p-8 bg-gray-50 rounded-[2rem] rounded-tl-none border border-gray-100 flex items-center gap-3">
                 <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-[#006a4e] rounded-full animate-bounce"></div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-white border-t border-gray-50 z-20">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Staged Files Preview */}
            <AnimatePresence>
              {stagedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-3 pb-2"
                >
                  {stagedFiles.map((staged, idx) => (
                    <div key={idx} className="relative group">
                      <div className="w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center text-gray-400">
                        {staged.type === 'image' ? (
                          <img src={staged.preview} className="w-full h-full object-cover" />
                        ) : staged.type === 'audio' ? (
                          <Mic className="w-6 h-6 text-red-500" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                      <button 
                        onClick={() => removeStagedFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="relative flex items-center gap-3">
               <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe, upload images, or record voice..."
                    disabled={loading}
                    className="w-full p-5 md:p-7 pr-32 md:pr-40 bg-gray-50 border border-gray-200 rounded-[2rem] focus:bg-white focus:border-[#006a4e] focus:ring-4 focus:ring-[#006a4e]/5 transition-all outline-none font-bold text-gray-800 shadow-sm"
                  />
                  <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-4">
                     <input 
                       type="file" 
                       ref={fileInputRef} 
                       className="hidden" 
                       multiple 
                       accept="image/*,audio/*,application/pdf,text/plain" 
                       onChange={handleFileChange} 
                     />
                     <button 
                       type="button"
                       onClick={() => fileInputRef.current?.click()}
                       className="p-2 md:p-3 hover:bg-emerald-50 text-gray-400 hover:text-[#006a4e] rounded-xl transition-all"
                     >
                        <Paperclip className="w-5 h-5" />
                     </button>
                     <button 
                       type="button"
                       className={cn(
                         "p-2 md:p-3 rounded-xl transition-all",
                         isRecording ? "bg-red-50 text-red-500 scale-110 animate-pulse" : "hover:bg-emerald-50 text-gray-400 hover:text-[#006a4e]"
                       )}
                       onClick={toggleRecording}
                     >
                        <Mic className={cn("w-5 h-5", isRecording && "fill-current")} />
                     </button>
                  </div>
               </div>
               <button
                 type="submit"
                 disabled={(!input.trim() && stagedFiles.length === 0) || loading}
                 className="p-5 md:p-7 bg-[#006a4e] text-white rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#006a4e]/20 disabled:grayscale disabled:opacity-50 shrink-0"
               >
                 <Send className="w-6 h-6" />
               </button>
            </form>
            
            <div className="flex items-center justify-between px-6 py-2">
               <div className="flex items-center gap-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">
                 <span className="flex items-center gap-2 decoration-emerald-500/30 underline underline-offset-4 decoration-2">
                   <Zap className="w-3 h-3" /> Real-time Pro Node
                 </span>
                 <span>•</span>
                 <span>Multimodal Engine</span>
               </div>
               <div className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest hidden md:block">
                  Secure Peer-to-Peer Encryption
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
