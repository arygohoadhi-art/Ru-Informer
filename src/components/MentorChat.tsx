import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse, generateImage, generateSpeech } from '../services/geminiService';
import { 
  Send, Bot, User, Loader2, Sparkles, MessageCircle, X, 
  GraduationCap, Users, Zap, ChevronRight, Copy, Check,
  Image as ImageIcon, Mic, Paperclip, Play, Pause, 
  Trash2, Plus, Volume2, Maximize2, Minimize2, FileText,
  Sparkle, Terminal, Compass, Search, ChevronDown, CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Article, MediaResource, ClubEvent, ClubFeedItem, UserProfile } from '../types';

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
  type: 'image' | 'audio' | 'document';
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

// Custom Gemini multicolor gradient animated Star SVG
export function GeminiStar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("animate-pulse", className)}>
      <path 
        d="M12 2C12 2 12.5 8.5 15 11C17.5 13.5 24 14 24 14C24 14 17.5 14.5 15 17C12.5 19.5 12 26 12 26C12 26 11.5 19.5 9 17C6.5 14.5 0 14 0 14C0 14 6.5 13.5 9 11C11.5 8.5 12 2 12 2Z" 
        fill="url(#geminiGradient)"
      />
      <defs>
        <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="30%" stopColor="#9B72CB" />
          <stop offset="70%" stopColor="#D96570" />
          <stop offset="100%" stopColor="#F4B400" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Premium responsive Markdown Renderer with style elements matching Google Gemini output
function Markdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 font-sans text-gray-200 leading-relaxed text-sm md:text-[15px]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm md:text-base font-extrabold text-[#ffd700] mt-4 mb-2 tracking-tight flex items-center gap-1.5 pb-1 border-b border-gray-800/40">
              <Sparkles className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base md:text-lg font-black text-gray-100 mt-5 mb-2 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#ffd700] rounded-full shrink-0" />
              {trimmed.replace('## ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg md:text-xl font-black text-yellow-400 mt-6 mb-3 tracking-tighter">
              {trimmed.replace('# ', '')}
            </h2>
          );
        }
        
        // Bold/Key terms markers like **term**
        let renderedLine: React.ReactNode = line;
        if (line.includes('**')) {
          const parts = line.split('**');
          renderedLine = parts.map((part, pIdx) => pIdx % 2 === 1 ? (
            <strong key={pIdx} className="font-extrabold text-[#ffd700] bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded text-xs md:text-sm">
              {part}
            </strong>
          ) : part);
        }

        // Bullets
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 bg-[#ffd700] rounded-full mt-2.5 shrink-0" />
              <span className="flex-1 text-xs md:text-sm text-gray-300 font-medium">{trimmed.slice(2)}</span>
            </div>
          );
        }
        
        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="font-black text-[#ffd700] shrink-0 text-xs mt-1">{numMatch[1]}.</span>
              <span className="flex-1 text-xs md:text-sm text-gray-300 font-medium">{numMatch[2]}</span>
            </div>
          );
        }

        // Divider
        if (trimmed === '---') {
          return <hr key={idx} className="border-gray-800/60 my-4" />;
        }

        // Standard Paragraph
        if (trimmed === '') return <div key={idx} className="h-2" />;
        
        return <p key={idx} className="text-xs md:text-sm text-gray-300 font-normal leading-relaxed">{renderedLine}</p>;
      })}
    </div>
  );
}

export default function MentorChat({ 
  initialMessage, 
  onClose,
  articles = [],
  mediaResources = [],
  events = [],
  clubFeedItems = [],
  profile
}: { 
  initialMessage?: string;
  onClose?: () => void;
  articles?: Article[];
  mediaResources?: MediaResource[];
  events?: ClubEvent[];
  clubFeedItems?: ClubFeedItem[];
  profile: UserProfile;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeModel, setActiveModel] = useState<'flash' | 'thinking'>('flash');
  
  // Track if chatbot is expanded to fullscreen Gemini layout
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('ru_chat_expanded') === 'true';
  });

  // Track copied message state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Grounded context of campus resources
  const groundingContext = `
STUDENT PROFILE:
- Name: ${profile?.displayName || 'RU Student'}
- Department: ${profile?.studentDNA?.dept || 'Not Specified'}
- Study Year: ${profile?.studentDNA?.year || 'Not Specified'}
- Career Goals: ${profile?.studentDNA?.goals || 'Not Specified'}
- Primary Motivation: ${profile?.studentDNA?.motivation || 'Not Specified'}
- Core Obstacles: ${profile?.studentDNA?.majorObstacle || 'Not Specified'}
- Key Strengths: ${profile?.studentDNA?.topStrengths || 'Not Specified'}
- Work Style: ${profile?.studentDNA?.workStyle || 'Not Specified'}

LIVE CAMPUS INSIGHT ARTICLES & GUIDES (Authorized Authors):
${articles.map((a, i) => `${i+1}. [Category: ${a.category}] Title: "${a.title}"\nContent Summary: "${a.content.slice(0, 300)}..."`).join('\n')}

LIVE MULTIMEDIA VAULT RESOURCES:
${mediaResources.map((m, i) => `${i+1}. [Format: ${m.type}] Title: "${m.title}"\nDescription: "${m.description}"\nAccess Link: ${m.url}`).join('\n')}

ACTIVE CLUB EVENTS:
${events.map((e, i) => `${i+1}. [Category: ${e.category}] Title: "${e.title}" at ${e.venue}\nTarget Skills: ${e.skillsTargeted}\nDate: ${e.dateTime}`).join('\n')}

LIVE CLUB POSTS & TSC FEEDS:
${clubFeedItems.map((f, i) => `${i+1}. [Club ID: ${f.clubId}] Title: "${f.title}"\nContent: "${f.content.slice(0, 300)}..."`).join('\n')}
`;

  // Sync expanded status to localStorage
  useEffect(() => {
    localStorage.setItem('ru_chat_expanded', isExpanded ? 'true' : 'false');
  }, [isExpanded]);

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
      // Image Generation flow
      if (textToSend.toLowerCase().includes('generate image') || textToSend.toLowerCase().includes('draw')) {
        const imageUrl = await generateImage(textToSend);
        if (imageUrl) {
          const modelMessage: Message = {
            role: 'model',
            parts: [
              { text: "I've synthesized this visualization for your query:" },
              { inlineData: { data: imageUrl.split(',')[1], mimeType: 'image/png' } }
            ]
          };
          setMessages(prev => [...prev, modelMessage]);
          setLoading(false);
          return;
        }
      }

      // Standard Gemini generation call
      const responseText = await getChatResponse(userParts, messages, groundingContext);
      
      // Auto text-to-speech if asked or voice capture was attached
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
        parts: [{ text: "Synchronization error. Please ensure your GEMINI_API_KEY is configured inside settings." }] 
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

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeModelLabel = activeModel === 'flash' 
    ? "Gemini 3.5 Flash (Grounded)"
    : "Gemini Pro Engine";

  return (
    <div 
      className={cn(
        "font-sans pointer-events-auto transition-all duration-500 ease-in-out text-white bg-[#131314]",
        isExpanded 
          ? "fixed inset-0 z-[100] flex overflow-hidden w-screen h-screen" 
          : "fixed bottom-6 right-6 w-[430px] h-[590px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] shadow-2xl rounded-3xl border border-gray-800/80 flex flex-col z-[100] overflow-hidden"
      )}
    >
      <audio ref={audioRef} className="hidden" />

      {/* Embedded CSS for custom Gemini shimmers and animations */}
      <style>{`
        @keyframes geminiShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-gemini-shimmer {
          background-size: 200% 100%;
          animation: geminiShimmer 1.5s infinite linear;
        }
      `}</style>

      {/* Expanded Sidebar View - ChatGPT/Gemini Recents List */}
      {isExpanded && (
        <motion.div 
          animate={{ width: isSidebarOpen ? 260 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full bg-[#1e1e20] hidden md:flex flex-col overflow-hidden relative shadow-xl shrink-0"
        >
          {/* Sidebar Header */}
          <div className="p-5 flex items-center justify-between border-b border-gray-800/30">
            <div className="flex items-center gap-2">
              <GeminiStar className="w-5 h-5" />
              <span className="font-display font-black text-xs uppercase tracking-widest text-[#ffd700]">Navigator Sessions</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Sidebar Chat Sessions list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-4">
             <button 
              onClick={() => startNewSession()}
              className="w-full text-left p-3.5 rounded-full bg-[#2a2b2d] hover:bg-[#333537] text-xs font-black text-[#ffd700] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer border border-gray-800"
             >
                <Plus className="w-4 h-4" /> New Chat
             </button>
             
             <div className="pt-2">
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2.5">Saved Conversations</p>
               <div className="space-y-1">
                  {sessions.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => loadSession(s)}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 rounded-full cursor-pointer transition-all border border-transparent",
                        activeSessionId === s.id 
                          ? "bg-gray-800 text-[#ffd700]" 
                          : "text-gray-300 hover:bg-gray-800/40 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <MessageCircle className={cn("w-3.5 h-3.5 shrink-0", activeSessionId === s.id ? "text-[#ffd700]" : "text-gray-500")} />
                        <span className="text-xs font-semibold truncate max-w-[130px]">{s.title}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(e, s.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-[10px] font-medium text-gray-500 italic p-2.5">No archived chats.</p>
                  )}
               </div>
             </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 bg-[#1a1a1c] border-t border-gray-800/40 space-y-2">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffd700] text-[#004d39] font-black text-[10px] flex items-center justify-center">
                  {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-extrabold text-white truncate leading-none">{profile?.displayName || 'RU Student'}</p>
                   <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mt-1">Grounded sync online</p>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#131314]">
        
        {/* Universal Header (Compact + Expanded) */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-800/30 bg-[#131314]/90 backdrop-blur z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            {isExpanded && !isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer hidden md:block"
                title="Open Sidebar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <GeminiStar className="w-5 h-5" />
              <div>
                <span className="font-display font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                  RU AI Chatbot
                  <span className="px-1.5 py-0.5 rounded bg-[#ffd700]/10 text-[#ffd700] text-[9px] font-black uppercase tracking-widest border border-[#ffd700]/20">Grounded</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Expanded / Minimize state Toggles */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-2 hover:bg-gray-800/80 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? "Minimize Chatbot" : "Maximize to Gemini Interface"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-800/80 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream History */}
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-6 space-y-6 scroll-smooth" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-xl mx-auto py-8">
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1e3c72] to-[#2a5298] flex items-center justify-center shadow-lg relative"
               >
                 <GeminiStar className="w-7 h-7" />
                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ffd700] rounded-full flex items-center justify-center shadow-md">
                   <Sparkles className="w-3 h-3 text-[#004d39]" />
                 </div>
               </motion.div>
               
               <div className="space-y-2">
                 <h1 className="text-xl md:text-3xl font-display font-bold text-white tracking-tight">
                   Hello, <span className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#ffd700] bg-clip-text text-transparent">{profile?.displayName || 'RU Student'}</span>
                 </h1>
                 <p className="text-sm text-gray-400 font-semibold max-w-sm mx-auto leading-relaxed">
                   How can I synthesize Rajshahi University guides, clubs, or events for you today?
                 </p>
               </div>
               
               {/* Suggestion Starter Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                  {[
                    { q: 'Summarize latest TSC Club announcements & events', icon: <Users className="w-4 h-4 text-blue-400" /> },
                    { q: 'Give me department success hacks for academic excellence', icon: <GraduationCap className="w-4 h-4 text-amber-400" /> }
                  ].map(item => (
                    <button
                      key={item.q}
                      onClick={() => handleSend(undefined, item.q)}
                      className="p-3.5 text-left bg-[#1e1e20] border border-gray-800/40 rounded-2xl hover:border-gray-700 hover:bg-[#2a2a2c] transition-all flex items-start gap-3.5 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-white transition-all">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-300 line-clamp-2 group-hover:text-white transition-colors leading-relaxed">{item.q}</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* Messages Loop with AUTHENTIC GEMINI STYLING (No boxes for bot replies, starts with Star) */}
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex gap-3 md:gap-4 max-w-3xl mx-auto items-start",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {/* Gemini response layout with star icon and no box outline */}
              {m.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-[#1e1e20] flex items-center justify-center shrink-0 border border-gray-800/60 mt-1">
                  <GeminiStar className="w-4.5 h-4.5" />
                </div>
              )}
              
              <div className={cn(
                "flex-1 min-w-0",
                m.role === 'user' 
                  ? "bg-[#1e1e20] text-gray-200 rounded-2xl px-4 py-2.5 max-w-[85%] self-end ml-auto border border-gray-800/30" 
                  : "pt-2 pb-6 text-gray-100"
              )}>
                {m.parts.map((p, idx) => (
                  <div key={idx} className="space-y-3">
                    {p.text && (
                      <div className="relative group">
                        <Markdown text={p.text} />
                        
                        {/* Gemini-style Quick action tools under responses */}
                        {m.role === 'model' && (
                          <div className="flex items-center gap-3 mt-4 text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => copyToClipboard(p.text!, i)}
                              className="p-1.5 hover:bg-gray-800/60 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                              title="Copy response text"
                            >
                              {copiedId === i ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedId === i ? "Copied" : "Copy"}
                            </button>

                            {p.audioUrl && (
                              <button 
                                onClick={() => playSpeech(p.audioUrl!)}
                                className="p-1.5 hover:bg-gray-800/60 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                                title="Listen to response"
                              >
                                <Volume2 className="w-3.5 h-3.5" /> Listen
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Media Inline Data Rendering */}
                    {p.inlineData && (
                      <div className="rounded-2xl overflow-hidden border border-gray-800/80 max-w-sm mt-2.5 bg-[#1e1e20]">
                        {p.inlineData.mimeType.startsWith('image/') ? (
                          <img 
                            src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} 
                            alt="Visual query" 
                            className="w-full h-auto object-cover max-h-64"
                          />
                        ) : p.inlineData.mimeType === 'application/pdf' ? (
                          <div className="p-4 flex items-center gap-3">
                            <FileText className="w-7 h-7 text-red-400" />
                            <div className="text-left">
                              <p className="text-xs font-black text-gray-100">PDF Document Attached</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Grounding index ready</p>
                            </div>
                          </div>
                        ) : p.inlineData.mimeType.startsWith('audio/') ? (
                          <div className="p-4 flex items-center gap-3">
                            <Mic className="w-7 h-7 text-blue-400 animate-pulse" />
                            <div className="text-left">
                              <p className="text-xs font-black text-gray-100">Voice Query Captured</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Audio Processed</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 flex items-center gap-3">
                            <Paperclip className="w-7 h-7 text-gray-500" />
                            <p className="text-xs font-black text-gray-300">Generic attachment</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Gemini Shimmer loader wave */}
          {loading && (
            <div className="flex gap-3 md:gap-4 max-w-3xl mx-auto items-start">
              <div className="w-8 h-8 rounded-full bg-[#1e1e20] flex items-center justify-center shrink-0 border border-gray-800/60 mt-1">
                <GeminiStar className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 space-y-3 pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider animate-pulse">Thinking & Synthesizing...</p>
                <div className="space-y-2.5 max-w-xl">
                  <div className="h-3 w-full bg-gradient-to-r from-[#1e1e20] via-[#2d2e30] to-[#1e1e20] rounded-full animate-gemini-shimmer" />
                  <div className="h-3 w-[85%] bg-gradient-to-r from-[#1e1e20] via-[#2d2e30] to-[#1e1e20] rounded-full animate-gemini-shimmer" />
                  <div className="h-3 w-[60%] bg-gradient-to-r from-[#1e1e20] via-[#2d2e30] to-[#1e1e20] rounded-full animate-gemini-shimmer" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-[#131314] border-t border-gray-800/30 z-20 shrink-0">
          <div className="max-w-3xl mx-auto space-y-3.5">
            {/* Staged file list preview */}
            <AnimatePresence>
              {stagedFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-wrap gap-2.5 pb-1"
                >
                  {stagedFiles.map((staged, idx) => (
                    <div key={idx} className="relative group">
                      <div className="w-14 h-14 rounded-xl border border-gray-800 bg-[#1e1e20] overflow-hidden flex items-center justify-center text-gray-500 shadow-inner">
                        {staged.type === 'image' ? (
                          <img src={staged.preview} className="w-full h-full object-cover" />
                        ) : staged.type === 'audio' ? (
                          <Mic className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <button 
                        onClick={() => removeStagedFile(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full shadow-md opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input pill form container */}
            <form onSubmit={handleSend} className="relative flex items-center gap-2.5">
               <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Gemini to study guides, BCS, RU events..."
                    disabled={loading}
                    className="w-full p-4 md:p-4.5 pr-24 bg-[#1e1e20] border border-gray-800/60 rounded-3xl focus:bg-[#1a1a1c] focus:border-gray-700 focus:ring-4 focus:ring-gray-800/50 transition-all outline-none font-medium text-gray-100 text-xs md:text-sm shadow-inner"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
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
                       className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
                       title="Attach files (PDF, images, audio)"
                     >
                        <Paperclip className="w-4 h-4" />
                     </button>
                     <button 
                       type="button"
                       className={cn(
                         "p-1.5 rounded-lg transition-all cursor-pointer",
                         isRecording ? "bg-red-500/20 text-red-400 scale-110 animate-pulse" : "hover:bg-gray-800 text-gray-400 hover:text-white"
                       )}
                       onClick={toggleRecording}
                       title="Voice Message"
                     >
                        <Mic className={cn("w-4 h-4", isRecording && "fill-current")} />
                     </button>
                  </div>
               </div>
               <button
                 type="submit"
                 disabled={(!input.trim() && stagedFiles.length === 0) || loading}
                 className="p-4 bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#ffd700] text-white font-extrabold rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:grayscale disabled:opacity-40 disabled:scale-100 shrink-0 cursor-pointer"
                 title="Send Message"
               >
                 <Send className="w-4.5 h-4.5" />
               </button>
            </form>
            
            <div className="flex items-center justify-between px-2 pt-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
               <div className="flex items-center gap-2">
                 <span className="flex items-center gap-1 text-[#ffd700]">
                   <Zap className="w-3 h-3 text-[#ffd700]" /> Gemini 3.5 Grounded
                 </span>
                 <span>•</span>
                 <span>Sourced from RU TSC & Academic guides</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
