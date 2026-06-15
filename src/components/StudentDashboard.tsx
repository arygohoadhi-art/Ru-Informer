import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, auth } from '../lib/firebase';
import { UserProfile, ClubEvent, Notification, EventFeedback } from '../types';
import { cn, cosineSimilarity } from '../lib/utils';
import { Calendar, MapPin, Target, MessageSquare, Loader2, LogOut, Heart, Briefcase, Bell, X, ExternalLink, ChevronRight, MessageCircle, Sparkles, User, GraduationCap, DollarSign, Users, LayoutDashboard, Rocket, Search, Star, Edit3, Save, TrendingUp, Compass, Menu, Book, Linkedin, Globe, Cpu, Bot, Zap } from 'lucide-react';
import Onboarding from './Onboarding';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import MentorChat from './MentorChat';
import { CareerResource } from '../types';

export default function StudentDashboard({ profile }: { profile: UserProfile }) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState<ClubEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'clubs' | 'career' | 'profile' | 'manual' | 'settings'>('overview');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const handleSwitchTab = (e: any) => setActiveTab(e.detail);
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClubEvent)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'events'));

    const careerQuery = query(collection(db, 'careerResources'), orderBy('title', 'asc'));
    let isSeeding = false;
    const unsubCareer = onSnapshot(careerQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CareerResource));
      setCareerResources(data);
      
      // Seed BD-specific resources if empty
      if (data.length === 0 && !isSeeding) {
        isSeeding = true;
        const seeds = [
          { title: 'BCS 24/7 Foundation Prep', category: 'BCS', url: 'https://bcs247.com', description: 'Retrieved Online Intel: Comprehensive guide for RU students starting BCS journey.' },
          { title: 'Tech Career BD: Roadmap', category: 'Tech', url: 'https://linkedin.com/groups/local-tech-bd', description: 'Retrieved Online Intel: How to transition into software roles in Dhaka.' },
          { title: 'Bank Job Mastery: BD', category: 'Skill', url: 'https://facebook.com/groups/bd-bank-prep', description: 'Retrieved Online Intel: Strategy for private and govt bank jobs.' },
          { title: 'RU Alumnus: Higher Study (USA/UK)', category: 'RU Portal', url: 'https://ru.ac.bd', description: 'Retrieved Online Intel: Resource for GRE/IELTS paths from Rajshahi.' },
          { title: 'BD Govt Job Circulars', category: 'BCS', url: 'https://teletalk.com.bd', description: 'Retrieved Online Intel: Live tracking of government recruitment nodes.' },
        ];
        seeds.forEach(s => addDoc(collection(db, 'careerResources'), s));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'careerResources'));

    const notifsQuery = query(
      collection(db, 'notifications'), 
      where('userId', '==', profile.uid)
    );
    const unsubNotifs = onSnapshot(notifsQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => { unsubEvents(); unsubCareer(); unsubNotifs(); };
  }, [profile.uid]);

  const competitionEvents = events.filter(e => e.category === 'Competition');
  const professionalEvents = events.filter(e => e.category === 'Seminar' || e.category === 'Course' || e.category === 'Competition');
  const festivalEvents = events.filter(e => e.category === 'Festival');

  const ruClubs = [
    "Rajshahi University Career Club (RUCC)",
    "RU Debating Organization (RUDO)",
    "Rajshahi University IT Society (RUITS)",
    "Language Club, RU",
    "Pharmacy Association, RU",
    "Science Club, RU",
    "Tourist Club, RU"
  ];

  if (!profile.onboardingComplete) return <Onboarding profile={profile} onComplete={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-[#f8fbfa] flex flex-col md:flex-row shadow-inner selection:bg-[#ffd700] selection:text-[#004d39] pb-24 md:pb-0">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#006a4e] rounded-lg flex items-center justify-center shadow-sm">
            <GraduationCap className="text-[#ffd700] w-5 h-5" />
          </div>
          <span className="font-display font-black text-lg text-[#004d39] tracking-tighter">RU Informer</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center relative border border-gray-100"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[70]">
        <div className="bg-[#004d39]/90 backdrop-blur-xl rounded-[2rem] p-2 flex items-center justify-between shadow-2xl border border-white/10">
          {[
            { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Hub' },
            { id: 'roadmap', icon: <Rocket className="w-5 h-5" />, label: 'Path' },
            { id: 'career', icon: <Book className="w-5 h-5" />, label: 'Guides' },
            { id: 'settings', icon: <Cpu className="w-5 h-5" />, label: 'System' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 transition-all rounded-2xl",
                activeTab === item.id ? "bg-[#ffd700] text-[#004d39] shadow-lg shadow-[#ffd700]/20 scale-110" : "text-white/40"
              )}
            >
              {item.icon}
              <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-0 z-50 bg-white md:bg-white md:static md:w-72 md:flex flex-col md:h-screen h-full transition-transform duration-300 md:translate-x-0 border-r border-[#006a4e]/5",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-[#006a4e] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
              <GraduationCap className="text-[#ffd700] w-6 h-6" />
            </div>
            <span className="font-display font-black text-xl text-[#004d39] tracking-tighter">RU Informer</span>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
              { id: 'roadmap', icon: <Rocket className="w-5 h-5" />, label: 'Roadmap' },
              { id: 'clubs', icon: <Users className="w-5 h-5" />, label: 'Clubs' },
              { id: 'career', icon: <Book className="w-5 h-5" />, label: 'Career DB' },
              { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile DNA' },
              { id: 'manual', icon: <Compass className="w-5 h-5" />, label: 'Manual' },
              { id: 'settings', icon: <Cpu className="w-5 h-5" />, label: 'System Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm transition-all group",
                  activeTab === item.id 
                    ? "bg-[#006a4e] text-white shadow-md shadow-[#006a4e]/20" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-[#006a4e]"
                )}
              >
                <span className={cn(activeTab === item.id ? "text-[#ffd700]" : "")}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-50 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-9 h-9 bg-[#ffd700] rounded-lg flex items-center justify-center text-[#004d39] font-black shrink-0">
                {profile.displayName?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{profile.displayName || 'Student'}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{profile.studentDNA?.dept || 'RU'}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-12 py-6 md:py-10 overflow-y-auto">
        <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-[#004d39]">
              {activeTab === 'overview' && "Campus Intelligence"}
              {activeTab === 'roadmap' && "Career Synthesis"}
              {activeTab === 'clubs' && "Club Matching Agency"}
              {activeTab === 'career' && "Career Database"}
              {activeTab === 'manual' && "Operation Manual"}
              {activeTab === 'profile' && "Academic DNA Studio"}
            </h2>
            <p className="text-sm md:text-base text-gray-400 font-medium mt-1">
              Welcome back, {profile.displayName?.split(' ')[0] || 'Junior'}.
            </p>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <button 
              onClick={() => setShowAIChat(true)}
              className="px-6 py-3 bg-[#006a4e] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-3"
            >
              <Sparkles className="w-4 h-4 text-[#ffd700]" />
              Expert AI
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 md:w-14 md:h-14 bg-white border border-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm relative hover:shadow-md transition-all"
              >
                <Bell className="w-6 h-6 text-gray-400" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-4 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                      <h4 className="font-black text-gray-900">Notifications</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 font-black" onClick={() => setShowNotifications(false)} />
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-sm font-medium italic">No matches detected.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={cn("p-6 hover:bg-gray-50 transition-colors border border-gray-50 rounded-2xl", !n.read && "bg-emerald-50/50 border-emerald-100")}>
                            <p className="text-sm text-gray-800 font-medium leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{new Date(n.createdAt?.toDate()).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="space-y-8 md:space-y-12">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
               {/* Mentor AI Search Interface - THE NAVIGATOR */}
               <div className="lg:col-span-3 space-y-6">
                 <div className="bg-[#004d39] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6 md:space-y-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <Bot className="w-3 h-3 text-[#ffd700]" />
                            RU Intelligence
                          </div>
                          <h3 className="text-2xl md:text-4xl font-display font-black leading-tight">Your Campus Navigator</h3>
                          <p className="text-sm md:text-base text-white/60 font-medium">Ask about BCS, Bank Jobs, Tech in BD, or RU TSC Clubs.</p>
                        </div>
                      </div>

                      <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#ffd700] transition-colors" />
                        <input 
                          type="text"
                          value={aiSearchQuery}
                          onChange={(e) => setAiSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setShowAIChat(true);
                            }
                          }}
                        placeholder="Search for 'How to start BCS prep?' or 'Tech clubs at TSC'..."
                        className="w-full pl-16 pr-6 md:pr-32 py-5 bg-white/5 border border-white/10 rounded-2xl focus:bg-white/10 focus:border-[#ffd700] outline-none font-bold text-white transition-all placeholder:text-white/30 text-lg shadow-inner"
                      />
                      <button 
                        onClick={() => setShowAIChat(true)}
                        className="absolute right-3 top-2 bottom-2 px-6 bg-[#ffd700] text-[#004d39] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all hidden md:block"
                      >
                        Ask AI
                      </button>
                    </div>
                  </div>
                 </div>
               </div>

               {/* Featured Event Stream - MOVED UP */}
               <div className="lg:col-span-3 space-y-6 md:space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6 md:pb-8">
                    <div className="space-y-3 md:space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd700] text-[#004d39] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Node Feed
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-3xl md:text-5xl font-display font-black text-gray-900 tracking-tighter">Event Stream</h2>
                        <p className="text-sm md:text-lg font-medium text-gray-400 uppercase tracking-widest">Personalized activities for your <span className="text-[#004d39] font-bold italic">Career Node</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Global Status</p>
                        <p className="text-sm font-bold text-[#006a4e]">Synchronized in BD</p>
                      </div>
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {professionalEvents.slice(0, 6).map(event => (
                      <EventCard key={event.id} event={event} type="pro" onFeedbackClick={() => setSelectedEventForFeedback(event)} />
                    ))}
                    {professionalEvents.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Zap className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold italic">No active nodes detected in your department yet.</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Intelligence Hub */}
               <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  <HubCard 
                    title="Club Network" 
                    subtitle="Semantic Matches" 
                    icon={<Users className="w-5 h-5" />} 
                    items={profile.roadmap?.recommendedClubs.slice(0, 3) || []}
                    onAction={() => setActiveTab('clubs')}
                    actionText="View Clubs"
                    color="purple"
                  />
                  <HubCard 
                   title="Knowledge DB" 
                   subtitle="Online Guidelines" 
                   icon={<Book className="w-5 h-5" />} 
                   items={careerResources.slice(0, 2).map(r => r.title)}
                   onAction={() => setActiveTab('career')}
                   actionText="Explore DB"
                   color="blue"
                  />
                  <HubCard 
                    title="Path Strategy" 
                    subtitle="Actionable Node" 
                    icon={<Compass className="w-5 h-5" />} 
                    summary={profile.roadmap?.conductionStrategy}
                    onAction={() => setActiveTab('roadmap')}
                    actionText="Read Roadmap"
                    color="orange"
                  />
                  <HubCard 
                    title="Platform Manual" 
                    subtitle="System Protocol" 
                    icon={<Cpu className="w-5 h-5" />} 
                    summary="Understand how RU Informer synthesizes your DNA with campus nodes and global intel."
                    onAction={() => setActiveTab('manual')}
                    actionText="Open Manual"
                    color="green"
                  />
               </div>

               {/* Alumni Node Spotlight - MOVED DOWN */}
               <div className="lg:col-span-2 bg-[#004d39] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp className="w-24 md:w-36 h-24 md:h-36" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      <Users className="w-3 h-3 text-[#ffd700]" />
                      Alumni Path
                    </div>
                    <h4 className="text-xl md:text-3xl font-display font-black leading-tight italic max-w-2xl">
                      "{profile.roadmap?.alumnusPath}"
                    </h4>
                  </div>
               </div>

               {/* DNA Health Check */}
               <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006a4e]">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">DNA Sync</p>
                           <p className="text-sm font-bold text-[#006a4e]">High Resonance</p>
                        </div>
                     </div>
                     <h4 className="text-xl font-display font-black text-gray-900 tracking-tighter">Campus Synthesis</h4>
                     <p className="text-xs font-medium text-gray-400 italic">
                        "{profile.studentDNA?.dept} profile matched with {profile.roadmap?.keySkills[0]} nodes."
                     </p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'career' && (
            <CareerDatabase resources={careerResources} />
          )}

          {activeTab === 'roadmap' && profile.roadmap && (
            <div className="space-y-6 md:space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {[
                  { year: 'Year 1', desc: profile.roadmap.year1, color: 'bg-blue-500' },
                  { year: 'Year 2', desc: profile.roadmap.year2, color: 'bg-emerald-500' },
                  { year: 'Year 3', desc: profile.roadmap.year3, color: 'bg-[#ffd700]' },
                  { year: 'Year 4', desc: profile.roadmap.year4, color: 'bg-red-500' },
                ].map((step, i) => (
                  <div key={i} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative group overflow-hidden">
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-black mb-4 md:mb-6 shadow-lg", step.color)}>
                      {i + 1}
                    </div>
                    <h4 className="text-xl md:text-2xl font-display font-black text-gray-900 mb-1 md:mb-2">{step.year}</h4>
                    <p className="text-[13px] md:text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                  </div>
                ))}
              </div>

               <div className="bg-[#004d39] rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
                  <div className="relative z-10 max-w-2xl">
                    <h4 className="text-xl md:text-3xl font-display font-black italic leading-tight mb-8">
                      "{profile.roadmap.alumnusPath}"
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-10">
                      {profile.roadmap.keySkills.map(skill => (
                        <span key={skill} className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/10 text-[#ffd700]">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                      {profile.roadmap.conductionStrategy && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.2em]">How to Conduct (via Clubs)</p>
                          <p className="text-sm font-medium leading-relaxed text-white/80 italic">{profile.roadmap.conductionStrategy}</p>
                        </div>
                      )}
                      {profile.roadmap.onlineGuidelineReference && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-[#ffd700] uppercase tracking-[0.2em]">Target Guidelines</p>
                          <p className="text-sm font-medium leading-relaxed text-white/80 italic">{profile.roadmap.onlineGuidelineReference}</p>
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'clubs' && (
            <div className="space-y-8 md:space-y-12">
              <div className="bg-emerald-50 rounded-3xl p-8 md:p-12 text-[#006a4e] border border-emerald-100">
                  <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-4">Matches linked to your DNA.</h3>
                  <p className="text-base md:text-xl font-medium opacity-80 leading-relaxed">
                    Societies chosen based on your department and goals.
                  </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {profile.roadmap?.recommendedClubs.map((club, i) => (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all group">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#006a4e] mb-6 group-hover:bg-[#006a4e] group-hover:text-white transition-all">
                      <Target className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-display font-black text-gray-900 mb-2">{club}</h4>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">
                      Recommended for your {profile.roadmap?.keySkills[i % profile.roadmap.keySkills.length]} growth.
                    </p>
                    <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#006a4e] hover:text-white transition-all">
                      View Info
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <DNAStudio profile={profile} />
          )}

          {activeTab === 'settings' && (
            <SystemSettings />
          )}

          {activeTab === 'manual' && (
            <PlatformManual />
          )}
        </div>

        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
            >
              <MentorChat initialMessage={aiSearchQuery} onClose={() => setShowAIChat(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedEventForFeedback && (
            <FeedbackModal 
              event={selectedEventForFeedback} 
              userId={profile.uid} 
              userName={profile.displayName || 'RU Student'}
              onClose={() => setSelectedEventForFeedback(null)} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function PlatformManual() {
  const protocols = [
    {
      title: "DNA Synthesis",
      icon: <Target className="w-8 h-8" />,
      desc: "The system analyzes your department, interests, and career goals to create a semantic career node.",
      steps: ["Recalibrate DNA in Profile", "Sync with Campus Milestones", "Integrate Global Tech Intel"]
    },
    {
      title: "Club Resonance",
      icon: <Users className="w-8 h-8" />,
      desc: "Matches you with Rajshahi University clubs based on the skills required for your specific path.",
      steps: ["Semantic Club Mapping", "Alumni Trail Integration", "Departmental Node Alignment"]
    },
    {
      title: "Intelligence Feed",
      icon: <Zap className="w-8 h-8" />,
      desc: "Real-time stream of campus events and uprising career opportunities in Bangladesh.",
      steps: ["Live Event Tracking", "Resonance Feedback Loop", "Resource Retrieval"]
    },
    {
      title: "Mobile Sync (PWA)",
      icon: <Globe className="w-8 h-8" />,
      desc: "Install the dashboard as a native mobile app for offline access to your DNA and Roadmap.",
      steps: ["'Add to Home Screen' via Browser", "Offline Cache Protocol Enabled", "Minimal Data Latency"]
    },
    {
      title: "API & Infrastructure",
      icon: <Cpu className="w-8 h-8" />,
      desc: "Manage your AI node credentials via the platform settings menu.",
      steps: ["Visit Settings > Environment Variables", "Bind 'GEMINI_API_KEY'", "Secure Node Deployment"]
    }
  ];

  return (
    <div className="space-y-12 max-w-5xl">
      <div className="bg-[#004d39] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Book className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd700] text-[#004d39] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Operational Guide
          </div>
          <h3 className="text-4xl md:text-6xl font-display font-black leading-tight tracking-tighter">System Protocol</h3>
          <p className="text-xl text-white/70 max-w-xl font-medium leading-relaxed italic">
            "Your manual for navigating the RU Intelligence ecosystem. From DNA calibration to node synchronization."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {protocols.map((p, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-[#006a4e] mb-8">
              {p.icon}
            </div>
            <h4 className="text-2xl font-display font-black text-gray-900 mb-4">{p.title}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">{p.desc}</p>
            <div className="space-y-3">
              {p.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-[10px] font-black text-[#006a4e] uppercase tracking-widest">
                  <span className="w-1 h-1 bg-[#ffd700] rounded-full" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 text-center">
        <p className="text-gray-400 font-bold italic mb-6">"Still confused about your career path?"</p>
        <button 
          onClick={() => {
            const chatSection = document.getElementById('mentor-chat-section');
            chatSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-10 py-5 bg-[#004d39] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#004d39]/20"
        >
          Speak with Navigator AI
        </button>
      </div>
    </div>
  );
}

function DNAStudio({ profile }: { profile: UserProfile }) {
  const [dna, setDna] = useState(profile.studentDNA || { 
    dept: '', 
    year: '', 
    interests: '', 
    experience: '', 
    habits: '', 
    goals: '', 
    activities: '',
    previousInvolvement: '',
    currentInvolvement: '',
    goalStage: 'Exploring',
    motivation: '',
    topStrengths: '',
    improvementAreas: '',
    marketPreference: '',
    workStyle: '',
    majorObstacle: '',
    vision10Years: ''
  });
  const [saving, setSaving] = useState(false);

  const deptOptions = [
    'Computer Science & Engineering', 'Information & Communication Engineering', 
    'Electrical & Electronic Engineering', 'Applied Chemistry & Chemical Engineering',
    'Physics', 'Mathematics', 'Statistics', 'Chemistry',
    'Economics', 'Public Administration', 'Political Science', 'Sociology',
    'English', 'Bengali', 'History', 'Philosophy',
    'Law', 'Accounting & Information Systems', 'Management Studies', 'Marketing', 'Finance'
  ];

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'Alumnus'];
  const goalStageOptions = ['Exploring', 'Foundation Building', 'Skills Refining', 'Job Hunting', 'Final Preparation'];
  const involvementOptions = [
    'Technical (Coding/Hardware)', 'Social (Community Service)', 
    'Leadership (Events/Society)', 'Cultural (Music/Art)', 
    'Research (Academic)', 'Sports & Athletics'
  ];

  const motivationOptions = ['Financial Stability', 'Passion for Subject', 'Parental Expectation', 'Social Impact', 'Power/Status', 'Creative Freedom'];
  const strengthOptions = ['Analytical Thinking', 'Creative Problem Solving', 'Communication', 'Technical Coding', 'Public Speaking', 'Team Leadership'];
  const improvementOptions = ['Communication Skills', 'Technical Depth', 'Time Management', 'Networking', 'Confidence', 'Academic Consistency'];
  const marketOptions = ['BCS / Government Sector', 'Multinational Corporate (MNC)', 'Local Private Sector (Tech/Non-Tech)', 'Higher Studies (Local/Global)', 'Entrepreneurship / Startup'];
  const styleOptions = ['Individual Contributor', 'Collaborative Team Player', 'Project Leader', 'Behind-the-scenes Strategist'];
  const obstacleOptions = ['Financial Constraints', 'Lack of Proper Guidance', 'Skills Gap (Practical vs Academic)', 'Limited Resources (Laptop/Internet)', 'Mental Health / Motivation'];
  const visionOptions = ['Senior Industry Expert', 'High-ranking Govt Official', 'Successful Business Owner', 'Academician / Researcher'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const docRef = doc(db, 'users', profile.uid);
      await updateDoc(docRef, { studentDNA: dna, updatedAt: serverTimestamp() });
      window.location.reload(); 
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8 md:mb-16">
          <div className="space-y-1">
            <h3 className="text-2xl md:text-4xl font-display font-black text-gray-900 tracking-tight">DNA Studio.</h3>
            <p className="text-xs md:text-sm text-gray-400 font-medium italic">Update parameters to recalibrate synthesis.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8 md:space-y-12">
          {/* Section 1: Academic & Career Identity */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Academic & Career Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Department Node</label>
                <select 
                  value={dna.dept} 
                  onChange={e => setDna({...dna, dept: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {deptOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Temporal Stage (Year)</label>
                <select 
                  value={dna.year} 
                  onChange={e => setDna({...dna, year: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select Year</option>
                  {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Primary Ambition</label>
                <input value={dna.goals} onChange={e => setDna({...dna, goals: e.target.value})} className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner" placeholder="e.g. Software Engineer at Therap" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['BCS / Civil Service', 'Software Engineer', 'Bank Job', 'Higher Studies', 'Entrepreneur'].map(s => (
                    <button key={s} type="button" onClick={() => setDna({...dna, goals: s})} className="text-[8px] font-black uppercase bg-[#ffd700]/10 hover:bg-[#ffd700]/30 px-2.5 py-1 rounded-full text-[#006a4e] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Development Stage</label>
                <select 
                  value={dna.goalStage} 
                  onChange={e => setDna({...dna, goalStage: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  {goalStageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Psychographic Research */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Psychographic & Motivation Research</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Primary Motivation</label>
                <select 
                  value={dna.motivation} 
                  onChange={e => setDna({...dna, motivation: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">What drives you?</option>
                  {motivationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Market Preference</label>
                <select 
                  value={dna.marketPreference} 
                  onChange={e => setDna({...dna, marketPreference: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Target Market</option>
                  {marketOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Work Style Node</label>
                <select 
                  value={dna.workStyle} 
                  onChange={e => setDna({...dna, workStyle: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">How do you work best?</option>
                  {styleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">10-Year Vision</label>
                <select 
                  value={dna.vision10Years} 
                  onChange={e => setDna({...dna, vision10Years: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Where do you see yourself?</option>
                  {visionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Skill Synthesis */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Skill & Resource Synthesis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Top Strength Node</label>
                <select 
                  value={dna.topStrengths} 
                  onChange={e => setDna({...dna, topStrengths: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Your strongest asset</option>
                  {strengthOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Improvement Focus</label>
                <select 
                  value={dna.improvementAreas} 
                  onChange={e => setDna({...dna, improvementAreas: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Area for growth</option>
                  {improvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Primary Obstacle</label>
              <select 
                value={dna.majorObstacle} 
                onChange={e => setDna({...dna, majorObstacle: e.target.value})} 
                className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
              >
                <option value="">What slows you down?</option>
                {obstacleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* Section 4: Activities History */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Societal & Community Involvement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Previous Club/Society DNA</label>
                <select 
                  value={dna.previousInvolvement} 
                  onChange={e => setDna({...dna, previousInvolvement: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select Previous Primary Area</option>
                  {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Current Active Nodes</label>
                <select 
                  value={dna.currentInvolvement} 
                  onChange={e => setDna({...dna, currentInvolvement: e.target.value})} 
                  className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-bold text-gray-900 shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Select Current Primary Area</option>
                  {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Technical habits & Detailed Experiences</label>
            <textarea 
              value={dna.habits} 
              onChange={e => setDna({...dna, habits: e.target.value})} 
              placeholder="What specific tools or methods do you use daily?"
              className="w-full p-4 md:p-6 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none transition-all font-medium text-gray-600 h-32 md:h-40 shadow-inner leading-relaxed" 
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-4 md:py-6 bg-[#006a4e] text-white rounded-xl md:rounded-2xl font-black text-lg shadow-xl shadow-[#006a4e]/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-4"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6 text-[#ffd700]" /> Calibrate DNA Node</>}
          </button>
        </form>

        <div className="mt-16 pt-16 border-t border-gray-100 space-y-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006a4e]">
                <Cpu className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-display font-black text-gray-900">AI Infrastructure</h4>
                <p className="text-sm font-medium text-gray-400">Manage your Gemini processing key</p>
              </div>
           </div>
           <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
             To power the expert multimodal navigation features, you can provide your own Gemini API key. 
             This key is stored locally in your browser and used only for your sessions.
           </p>
           <button 
             onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'settings' }))}
             className="px-8 py-4 bg-gray-50 text-[#006a4e] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#006a4e] hover:text-white transition-all border border-[#006a4e]/10"
           >
             Configure API Node
           </button>
        </div>
      </div>
    </div>
  );
}

function CareerDatabase({ resources }: { resources: CareerResource[] }) {
  const categories = ['LinkedIn', 'BCS', 'Tech', 'Skill', 'RU Portal'];
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
            No resources added by admins yet.
          </div>
        ) : (
          resources.map(res => (
            <a 
              key={res.id} 
              href={res.url} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#006a4e] group-hover:bg-[#006a4e] group-hover:text-white transition-all">
                  {res.category === 'LinkedIn' && <Linkedin className="w-6 h-6" />}
                  {res.category === 'BCS' && <GraduationCap className="w-6 h-6" />}
                  {res.category === 'Tech' && <Cpu className="w-6 h-6" />}
                  {res.category === 'RU Portal' && <Globe className="w-6 h-6" />}
                  {res.category === 'Skill' && <Target className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 line-clamp-1">{res.title}</h4>
                  <span className="text-[10px] font-black text-[#006a4e] uppercase tracking-widest">{res.category}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 italic mb-4">"{res.description}"</p>
              <div className="flex items-center gap-2 text-xs font-black text-[#006a4e] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                Visit Resource <ChevronRight className="w-4 h-4" />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

function HubCard({ title, subtitle, icon, items, summary, onAction, actionText, color }: any) {
  const colorStyles: any = {
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-emerald-50 text-[#006a4e]'
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm group hover:border-[#006a4e] transition-all flex flex-col">
      <div className="flex items-center gap-4 mb-4 md:mb-6">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#006a4e] group-hover:text-white shrink-0", colorStyles[color])}>
          {icon}
        </div>
        <div>
          <h4 className="text-base md:text-lg font-display font-black text-gray-900 tracking-tight">{title}</h4>
          <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      
      {items && (
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-grow">
          {items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2.5 md:p-3 bg-gray-50 rounded-xl">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0" />
              <span className="text-[11px] md:text-sm font-bold text-gray-700 truncate">{item}</span>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-gray-400 italic">Gathering nodes...</p>}
        </div>
      )}

      {summary && (
        <p className="text-[11px] md:text-xs font-medium text-gray-500 leading-relaxed italic mb-4 md:mb-6 line-clamp-2 md:line-clamp-none flex-grow">
          "{summary}"
        </p>
      )}

      <button onClick={onAction} className="w-full py-3 md:py-4 text-[9px] md:text-[10px] font-black text-[#006a4e] uppercase tracking-widest bg-[#006a4e]/5 rounded-xl hover:bg-[#006a4e] hover:text-white transition-all">
        {actionText}
      </button>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon, theme }: { title: string, subtitle: string, icon: React.ReactNode, theme: 'green' | 'gold' }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-md",
        theme === 'green' ? "bg-[#006a4e] text-white" : "bg-[#ffd700] text-[#006a4e]"
      )}>
        {icon}
      </div>
      <div>
        <h4 className="text-xl md:text-2xl font-display font-black text-gray-900 tracking-tight">{title}</h4>
        <p className="text-xs md:text-sm font-medium text-gray-400 italic">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-12 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 italic text-gray-400 text-sm font-medium leading-relaxed">
      "{message}"
    </div>
  );
}

interface EventCardProps {
  event: ClubEvent;
  type: 'pro' | 'life';
  onFeedbackClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, type, onFeedbackClick }) => {
  const [isInterested, setIsInterested] = useState(false);
  const [interestCount, setInterestCount] = useState(Math.floor(Math.random() * 50) + 10);

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:border-[#006a4e] hover:shadow-2xl transition-all flex flex-col relative overflow-hidden"
    >
      {/* Club Name Highlight Badge */}
      <div className="absolute top-0 right-0 px-4 md:px-6 py-1.5 md:py-2 bg-[#006a4e] text-[#ffd700] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-2xl md:rounded-bl-3xl shadow-sm z-10">
        {event.organizer || event.adminName || 'RU Society'}
      </div>

      {interestCount > 40 && (
        <div className="absolute top-8 md:top-10 right-4 px-2 py-1 bg-orange-100 text-orange-600 text-[7px] md:text-[8px] font-black uppercase tracking-tighter rounded-full border border-orange-200">
          Uprising Node
        </div>
      )}

      <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
        <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-md shrink-0", type === 'pro' ? "bg-emerald-50 text-[#006a4e]" : "bg-yellow-50 text-yellow-700")}>
          {type === 'pro' ? <Briefcase className="w-5 h-5 md:w-6 md:h-6" /> : <Heart className="w-5 h-5 md:w-6 md:h-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg md:text-xl font-display font-black text-gray-900 leading-tight group-hover:text-[#006a4e] transition-colors line-clamp-1">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-[#ffd700] rounded-full animate-pulse" />
            <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Live Node Activity</p>
          </div>
        </div>
      </div>

      {/* DATA & LOCATION HUD */}
      <div className="relative mb-6 md:mb-8">
        <div className="absolute inset-0 bg-[#006a4e]/5 rounded-2xl md:rounded-3xl -rotate-1 skew-x-1 transition-transform group-hover:rotate-0 group-hover:skew-x-0" />
        <div className="relative p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#006a4e] shadow-sm border border-gray-100 shrink-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Deployment Date</p>
              <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.dateTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#ffd700] shadow-sm border border-gray-100 shrink-0">
              <MapPin className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Node Location</p>
              <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.venue || event.location}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 line-clamp-2 italic font-medium leading-relaxed flex-grow">"{event.description}"</p>

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex gap-2">
              {event.contact.whatsapp && <a href={`https://wa.me/${event.contact.whatsapp}`} target="_blank" rel="noreferrer" className="p-2.5 md:p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"><MessageCircle className="w-4 h-4 md:w-5 md:h-5" /></a>}
              {event.contact.joinLink && <a href={event.contact.joinLink} target="_blank" rel="noreferrer" className="p-2.5 md:p-3 bg-[#006a4e]/5 text-[#006a4e] rounded-xl hover:bg-[#006a4e] hover:text-white transition-all shadow-sm"><ExternalLink className="w-4 h-4 md:w-5 md:h-5" /></a>}
            </div>
            
            <button 
              onClick={() => {
                setIsInterested(!isInterested);
                setInterestCount(prev => isInterested ? prev - 1 : prev + 1);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 md:py-3 rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest transition-all",
                isInterested ? "bg-red-50 text-red-600 border border-red-100" : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isInterested && "fill-current")} />
              {interestCount} 
            </button>
        </div>
        <button onClick={onFeedbackClick} className="w-full py-3.5 md:py-4 bg-gray-900 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#006a4e] shadow-lg flex items-center justify-center gap-2 md:gap-3">
          Resonate <Rocket className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </motion.div>
  );
};

function SystemSettings() {
  const [key, setKey] = useState(localStorage.getItem('user_gemini_api_key') || '');
  const [knowledge, setKnowledge] = useState(localStorage.getItem('user_knowledge_feed') || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isKnowledgeSaved, setIsKnowledgeSaved] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_gemini_api_key', key);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload();
    }, 1200);
  };

  const handleSaveKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_knowledge_feed', knowledge);
    setIsKnowledgeSaved(true);
    setTimeout(() => setIsKnowledgeSaved(false), 2000);
  };

  return (
    <div className="space-y-12 max-w-4xl pb-32">
      <div className="bg-[#004d39] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Cpu className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd700] text-[#004d39] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Infrastructure Node
          </div>
          <h3 className="text-4xl md:text-6xl font-display font-black leading-tight tracking-tighter">System Settings</h3>
          <p className="text-xl text-white/70 max-w-xl font-medium leading-relaxed italic">
            "Configure your AI processing nodes and calibrate your manual knowledge feed."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Knowledge Node - FEED THE AI */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-2xl font-display font-black text-gray-900">Knowledge Hub</h4>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">Feed your AI Manual Context</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveKnowledge} className="space-y-6 text-left">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manual AI Context Feed</label>
              <textarea 
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
                placeholder="Paste exam schedules, club bylaws, specific formulas, or any data you want the AI to always remember..."
                className="w-full h-64 p-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all font-medium text-gray-600 shadow-inner leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 font-medium italic mt-2">
                This data is stored in your browser and injected into every AI session. You can "feed" it large amounts of text here.
              </p>
            </div>
            <button 
              type="submit" 
              className={cn(
                "px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                isKnowledgeSaved ? "bg-blue-500 text-white" : "bg-gray-900 text-white hover:scale-[1.02] shadow-lg"
              )}
            >
              {isKnowledgeSaved ? <Edit3 className="w-4 h-4" /> : <Zap className="w-4 h-4 text-[#ffd700]" />}
              {isKnowledgeSaved ? "Knowledge Synchronized" : "Calibrate AI Brain"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006a4e]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-display font-black text-gray-900">AI Core</h4>
                <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">Protocol Node</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveKey} className="space-y-6 text-left">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gemini API Key</label>
                <input 
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter your API Key..."
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <button 
                type="submit" 
                className={cn(
                  "w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                  isSaved ? "bg-green-500 text-white" : "bg-[#006a4e] text-white hover:scale-[1.02] shadow-lg"
                )}
              >
                {isSaved ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4 text-[#ffd700]" />}
                {isSaved ? "Node Sync Complete" : "Update API Node"}
              </button>
            </form>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Compass className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-2xl font-display font-black text-gray-900">Mobile Hub</h4>
                <p className="text-sm font-medium text-gray-300 uppercase tracking-widest">PWA Protocol</p>
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
                Install as a native application for high-frequency access to your career nodes.
              </p>
              <div className="space-y-3">
                {["Open in Mobile Browser", "Select 'Add to Home Screen'", "Launch App Mode"].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs font-black text-[#006a4e] uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-[#ffd700] rounded-full" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ event, userId, userName, onClose }: { event: ClubEvent, userId: string, userName: string, onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'eventFeedback'), {
        eventId: event.id,
        userId,
        userName,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'eventFeedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#004d39]/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="bg-[#004d39] p-10 text-white relative">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-5 h-5 text-white" /></button>
          <Sparkles className="w-10 h-10 text-[#ffd700] mb-6" />
          <h3 className="text-3xl font-display font-black leading-tight">Synergy Feedback.</h3>
          <p className="text-white/60 text-sm font-medium italic truncate mb-0">{event.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-300 uppercase tracking-widest">Experience Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1 hover:scale-110 transition-transform">
                  <Star className={cn("w-10 h-10", star <= rating ? "fill-[#ffd700] text-[#ffd700]" : "text-gray-100")} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-300 uppercase tracking-widest">Semantic Review</label>
            <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did this event affect your roadmap?" className="w-full h-40 p-6 bg-gray-50 border-2 border-transparent rounded-[2.5rem] focus:border-[#006a4e] focus:bg-white outline-none transition-all text-sm font-medium leading-relaxed shadow-inner" />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-6 bg-[#006a4e] text-white rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
            {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Inform RU Mentors'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
