import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, auth } from '../lib/firebase';
import { UserProfile, ClubEvent, Notification, EventFeedback, ClubFeedItem, Article, MediaResource } from '../types';
import { cn, cosineSimilarity } from '../lib/utils';
import { Calendar, MapPin, Target, MessageSquare, Loader2, LogOut, Heart, Briefcase, Bell, X, ExternalLink, ChevronRight, MessageCircle, Sparkles, User, GraduationCap, DollarSign, Users, LayoutDashboard, Rocket, Search, Star, Edit3, Save, TrendingUp, Compass, Menu, Book, BookOpen, Linkedin, Globe, Cpu, Bot, Zap, FileUp, Video, Music, File } from 'lucide-react';
import Onboarding from './Onboarding';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import MentorChat from './MentorChat';
import AICampusSynthesizer from './AICampusSynthesizer';
import { CareerResource } from '../types';
import { CLUBS_DATA, UniversityClub } from '../lib/clubs';
import { generateRoadmap } from '../services/geminiService';
import RecommendationSandbox from './RecommendationSandbox';
import ClubDetailView from './ClubDetailView';
import EventCalendar from './EventCalendar';
import CareerResourcesDirectory from './CareerResourcesDirectory';



const ruBackgroundImages: Record<string, string> = {
  overview: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Administrative_Building_of_Rajshahi_University.jpg",
  sandbox: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Shabash_Bangladesh%2C_Rajshahi_University.jpg",
  calendar: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Shaheed_Minar_at_Rajshahi_University.jpg",
  roadmap: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Shabash_Bangladesh%2C_Rajshahi_University.jpg",
  clubs: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Shaheed_Minar_at_Rajshahi_University.jpg",
  career: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Paris_Road%2C_Rajshahi_University.jpg",
  insights: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Paris_Road%2C_Rajshahi_University_03.jpg",
  profile: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Paris_Road%2C_Rajshahi_University.jpg",
  manual: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Administrative_Building_of_Rajshahi_University.jpg",
  settings: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Shaheed_Minar_at_Rajshahi_University.jpg",
};

interface StudentDashboardProps {
  profile: UserProfile;
  activeRoleView?: 'student' | 'admin' | 'author';
  onRoleChange?: (role: 'student' | 'admin' | 'author') => void;
}

export default function StudentDashboard({ profile, activeRoleView, onRoleChange }: StudentDashboardProps) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clubFeedItems, setClubFeedItems] = useState<ClubFeedItem[]>([]);
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState<ClubEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'clubs' | 'career' | 'profile' | 'manual' | 'settings' | 'sandbox' | 'insights' | 'calendar' | 'chat'>('overview');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [selectedClubCategory, setSelectedClubCategory] = useState<string>('All');
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<string>('All');
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [insightsSubTab, setInsightsSubTab] = useState<'articles' | 'media' | 'synthesis'>('articles');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [prevNotifications, setPrevNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (notifications.length > 0 && prevNotifications.length > 0) {
      const newUnread = notifications.find(n => !n.read && !prevNotifications.some(prev => prev.id === n.id));
      if (newUnread) {
        setActiveToast(newUnread);
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 7000);
        return () => clearTimeout(timer);
      }
    }
    setPrevNotifications(notifications);
  }, [notifications]);

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

    const feedsQuery = query(collection(db, 'clubFeeds'), orderBy('createdAt', 'desc'));
    const unsubFeeds = onSnapshot(feedsQuery, (snapshot) => {
      setClubFeedItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClubFeedItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clubFeeds'));

    const articlesQuery = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubArticles = onSnapshot(articlesQuery, (snapshot) => {
      setArticles(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Article)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'articles'));

    const mediaQuery = query(collection(db, 'mediaResources'), orderBy('createdAt', 'desc'));
    const unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
      setMediaResources(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MediaResource)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'mediaResources'));

    return () => { unsubEvents(); unsubCareer(); unsubNotifs(); unsubFeeds(); unsubArticles(); unsubMedia(); };
  }, [profile.uid]);

  const competitionEvents = events.filter(e => e.category === 'Competition');
  const professionalEvents = events.filter(e => e.category === 'Seminar' || e.category === 'Course' || e.category === 'Competition');
  const festivalEvents = events.filter(e => e.category === 'Festival');

  if (!profile.onboardingComplete) return <Onboarding profile={profile} onComplete={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-[#f8fbfa] flex flex-col md:flex-row shadow-inner selection:bg-[#ef4444] selection:text-[#1e3a8a] pb-24 md:pb-0 relative">
      {/* Dynamic Rajshahi University Page-Specific Background Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.08, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
            style={{
              backgroundImage: `url(${ruBackgroundImages[activeTab] || ruBackgroundImages.overview})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="absolute inset-0"
          />
        </AnimatePresence>
        {/* Subtle off-white & emerald tint gradient overlay to ensure perfect accessibility & contrast */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#f8fbfa]/95 via-[#f8fbfa]/70 to-[#f8fbfa]/95" />
      </div>

      {/* Real-time Toast Notifications */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[200] max-w-sm w-full bg-[#1e3a8a] text-white p-6 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-3 shadow-[#1e3a8a]/10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#ef4444] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ef4444]">Live Match Alert!</span>
              </div>
              <button onClick={() => setActiveToast(null)} className="text-white/60 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold leading-relaxed">{activeToast.message}</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setActiveToast(null);
                }}
                className="px-3.5 py-1.5 bg-[#ef4444] text-[#1e3a8a] rounded-xl text-[10px] font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                View Calendar
              </button>
              <button
                onClick={async () => {
                  try {
                    const ref = doc(db, 'notifications', activeToast.id);
                    await updateDoc(ref, { read: true });
                  } catch (e) {
                    console.error(e);
                  }
                  setActiveToast(null);
                }}
                className="px-3.5 py-1.5 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center shadow-sm">
            <GraduationCap className="text-[#ef4444] w-5 h-5" />
          </div>
          <button onClick={() => setActiveTab('overview')} className="font-display font-black text-lg text-[#1e3a8a] tracking-tighter">RU Informer</button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center relative border transition-all",
              activeTab === 'profile' 
                ? "bg-[#2563eb] border-[#2563eb] text-white" 
                : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"
            )}
            title="Edit Profile"
          >
            <User className="w-5 h-5" />
          </button>
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
      {activeTab !== 'chat' && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-[70]">
          <div className="bg-[#1e3a8a]/90 backdrop-blur-xl rounded-[2rem] p-2 flex items-center justify-between shadow-2xl border border-white/10">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Hub' },
              { id: 'sandbox', icon: <Zap className="w-5 h-5" />, label: 'Sandbox' },
              { id: 'roadmap', icon: <Rocket className="w-5 h-5" />, label: 'Path' },
              { id: 'career', icon: <Book className="w-5 h-5" />, label: 'Guides' },
              { id: 'settings', icon: <Cpu className="w-5 h-5" />, label: 'System' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 transition-all rounded-2xl",
                  activeTab === item.id ? "bg-[#ef4444] text-[#1e3a8a] shadow-lg shadow-[#ef4444]/20 scale-110" : "text-white/40"
                )}
              >
                {item.icon}
                <span className="text-[8px] font-black uppercase tracking-[0.1em]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-0 z-50 bg-white md:bg-white md:static md:w-72 md:flex flex-col md:h-screen h-full transition-transform duration-300 md:translate-x-0 border-r border-[#2563eb]/5",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
              <GraduationCap className="text-[#ef4444] w-6 h-6" />
            </div>
            <button onClick={() => setActiveTab('overview')} className="font-display font-black text-xl text-[#1e3a8a] tracking-tighter">RU Informer</button>
          </div>

          {activeRoleView && onRoleChange && (
            <div className="mb-6 bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Active Session View
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    onRoleChange?.("student");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "student"
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#2563eb]"
                  )}
                >
                  🎓 View as Student
                </button>
                <button
                  onClick={() => {
                    onRoleChange?.("admin");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "admin"
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#2563eb]"
                  )}
                >
                  🏛️ View as Club Admin
                </button>
                <button
                  onClick={() => {
                    onRoleChange?.("author");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "author"
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#2563eb]"
                  )}
                >
                  ✍️ View as Author
                </button>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
              { id: 'sandbox', icon: <Zap className="w-5 h-5 text-yellow-500" />, label: 'Instant Match' },
              { id: 'calendar', icon: <Calendar className="w-5 h-5 text-indigo-500" />, label: 'Event Calendar' },
              { id: 'roadmap', icon: <Rocket className="w-5 h-5" />, label: 'Roadmap' },
              { id: 'clubs', icon: <Users className="w-5 h-5" />, label: 'Clubs' },
              { id: 'career', icon: <Book className="w-5 h-5" />, label: 'Career DB' },
              { id: 'insights', icon: <BookOpen className="w-5 h-5" />, label: 'Campus Insights' },
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
                    ? "bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/20" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-[#2563eb]"
                )}
              >
                <span className={cn(activeTab === item.id ? "text-[#ef4444]" : "")}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-50 space-y-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all group/sidebar-profile",
                activeTab === 'profile'
                  ? "bg-blue-50 border-blue-200 text-[#2563eb]"
                  : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-500 hover:border-gray-200"
              )}
              title="Click to view/edit profile"
            >
              <div className="w-9 h-9 bg-[#ef4444] rounded-lg flex items-center justify-center text-[#1e3a8a] font-black shrink-0 group-hover/sidebar-profile:scale-105 transition-transform">
                {profile.displayName?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate flex items-center gap-1 group-hover/sidebar-profile:text-[#2563eb] transition-colors">
                  {profile.displayName || 'Student'}
                  <Edit3 className="w-3 h-3 opacity-0 group-hover/sidebar-profile:opacity-100 transition-opacity text-[#2563eb]" />
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{profile.studentDNA?.dept || 'RU'}</p>
              </div>
            </button>
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
      <main className="flex-1 px-4 md:px-12 py-6 md:py-10 overflow-y-auto relative z-10">
        <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-[#1e3a8a]">
              {activeTab === 'overview' && "Campus Intelligence"}
              {activeTab === 'sandbox' && "Instant Recommend Sandbox"}
              {activeTab === 'calendar' && "Campus Event Chronology"}
              {activeTab === 'roadmap' && "Career Synthesis"}
              {activeTab === 'clubs' && "Club Matching Agency"}
              {activeTab === 'career' && "Career Database"}
              {activeTab === 'insights' && "Campus Insights Hub"}
              {activeTab === 'manual' && "Operation Manual"}
              {activeTab === 'profile' && "Academic DNA Studio"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm md:text-base text-gray-400 font-medium">
                Welcome back, {profile.displayName?.split(' ')[0] || 'Junior'}.
              </p>
              <button 
                onClick={() => setActiveTab('profile')} 
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1e3a8a] hover:underline bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <button 
              onClick={() => setActiveTab('chat')}
              className="px-3 py-2 bg-[#2563eb] text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm hover:scale-105 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3 text-[#ef4444]" />
              AI Chat
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
                          <div key={n.id} className={cn("p-6 hover:bg-gray-50 transition-colors border border-gray-50 rounded-2xl", !n.read && "bg-blue-50/50 border-blue-100")}>
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
               <div className="lg:col-span-3">
                 <div className="bg-gradient-to-br from-[#003c2b] to-[#001c13] rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border border-blue-950/20">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <Bot className="w-96 h-96 text-[#ef4444]" />
                   </div>
                   <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                   
                   <div className="relative z-10 max-w-4xl mx-auto space-y-10 text-center">

                     {/* Gemini/ChatGPT-style Input Dock */}
                     <div className="relative bg-white/5 border border-white/10 rounded-3xl p-3 md:p-4 focus-within:border-[#ef4444] focus-within:ring-4 focus-within:ring-[#ef4444]/5 transition-all shadow-2xl backdrop-blur-md max-w-sm mx-auto">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-[#ef4444] flex items-center justify-center shrink-0 shadow-md">
                           <Bot className="w-5 h-5" />
                         </div>
                         <input 
                           type="text"
                           value={aiSearchQuery}
                           onChange={(e) => setAiSearchQuery(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               setActiveTab('chat');
                             }
                           }}
                           placeholder="Message Campus Navigator... (e.g. Give me a 4-year BCS roadmap)"
                           className="w-full bg-transparent outline-none font-extrabold text-white placeholder:text-white/20 text-sm md:text-base"
                         />
                         <button 
                           onClick={() => setActiveTab('chat')}
                           className="px-6 py-3 bg-[#ef4444] text-[#1e3a8a] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                         >
                           <Sparkles className="w-3.5 h-3.5" />
                           Ask AI
                         </button>
                       </div>
                     </div>

                   </div>
                 </div>
               </div>

               {/* Featured Event Stream - MOVED UP */}
               <div className="lg:col-span-3 space-y-6 md:space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6 md:pb-8">
                    <div className="space-y-3 md:space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ef4444] text-[#1e3a8a] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Live Node Feed
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-3xl md:text-5xl font-display font-black text-gray-900 tracking-tighter">Event Stream</h2>
                        <p className="text-sm md:text-lg font-medium text-gray-400 uppercase tracking-widest">Personalized activities for your <span className="text-[#1e3a8a] font-bold italic">Career Node</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Global Status</p>
                        <p className="text-sm font-bold text-[#2563eb]">Synchronized in BD</p>
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
                    color="red"
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
                    color="gold"
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
               <div className="lg:col-span-2 bg-[#1e3a8a] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp className="w-24 md:w-36 h-24 md:h-36" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      <Users className="w-3 h-3 text-[#ef4444]" />
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
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563eb]">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">DNA Sync</p>
                           <p className="text-sm font-bold text-[#2563eb]">High Resonance</p>
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

          {activeTab === 'roadmap' && (
            <div className="space-y-8 md:space-y-12">
              {profile.roadmap ? (
                <div className="space-y-6 md:space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {[
                      { year: 'Year 1', desc: profile.roadmap.year1, color: 'bg-blue-500' },
                      { year: 'Year 2', desc: profile.roadmap.year2, color: 'bg-blue-500' },
                      { year: 'Year 3', desc: profile.roadmap.year3, color: 'bg-[#ef4444]' },
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

                   <div className="bg-[#1e3a8a] rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
                      <div className="relative z-10 max-w-2xl">
                        <h4 className="text-xl md:text-3xl font-display font-black italic leading-tight mb-8">
                          "{profile.roadmap.alumnusPath}"
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-10">
                          {profile.roadmap.keySkills.map(skill => (
                            <span key={skill} className="px-4 py-2 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider border border-white/10 text-[#ef4444]">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                          {profile.roadmap.conductionStrategy && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-[#ef4444] uppercase tracking-[0.2em]">How to Conduct (via Clubs)</p>
                              <p className="text-sm font-medium leading-relaxed text-white/80 italic">{profile.roadmap.conductionStrategy}</p>
                            </div>
                          )}
                          {profile.roadmap.onlineGuidelineReference && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-[#ef4444] uppercase tracking-[0.2em]">Target Guidelines</p>
                              <p className="text-sm font-medium leading-relaxed text-white/80 italic">{profile.roadmap.onlineGuidelineReference}</p>
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-sm mx-auto space-y-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563eb] mx-auto shadow-sm">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-black text-2xl text-gray-900">Your AI Career Roadmap is Unforged</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                      Define your department and career coordinates inside your Academic DNA Profile to compile an aligned 4-year success path instantly using Gemini AI.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="px-6 py-3 bg-[#2563eb] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#1e3a8a] transition-all cursor-pointer shadow-lg shadow-[#2563eb]/10 inline-flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Go to DNA Profile
                  </button>
                </div>
              )}

              {/* Comprehensive CURATED resources directory */}
              <CareerResourcesDirectory />
            </div>
          )}


          {activeTab === 'clubs' && (
            selectedClubId ? (
              <ClubDetailView
                clubId={selectedClubId}
                onBack={() => setSelectedClubId(null)}
                events={events}
                profile={profile}
              />
            ) : (
              <div className="space-y-12">
                {/* Recommended Top DNA Matches */}
                {profile.roadmap?.recommendedClubs && profile.roadmap.recommendedClubs.length > 0 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-3xl p-8 md:p-12 text-[#2563eb] border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-5 h-5 text-[#ef4444]" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70">AI DNA Alignment</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-2">Matches Linked to Your DNA</h3>
                        <p className="text-sm md:text-base font-medium opacity-80 leading-relaxed max-w-2xl">
                          These societies match your department, personality type, and ultimate career roadmap. Click on any card to view detailed organization plans.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {profile.roadmap?.recommendedClubs.map((clubName, i) => {
                        const matchingClub = CLUBS_DATA.find(c => clubName.toLowerCase().includes(c.id.toLowerCase()) || clubName.toLowerCase().includes(c.name.toLowerCase()));
                        return (
                          <div
                            key={i}
                            onClick={() => matchingClub && setSelectedClubId(matchingClub.id)}
                            className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300 group cursor-pointer border-t-4 border-t-emerald-600 hover:border-t-emerald-800"
                          >
                            <div className="flex justify-between items-start mb-6">
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-[#ef4444] transition-colors duration-300">
                                <Target className="w-6 h-6" />
                              </div>
                              <span className="text-[9px] uppercase font-black tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                View Profile
                              </span>
                            </div>
                            <h4 className="text-lg font-display font-black text-gray-900 mb-1 group-hover:text-[#2563eb] transition-colors">
                              {clubName}
                            </h4>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                              Recommended Match
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (matchingClub) setSelectedClubId(matchingClub.id);
                              }}
                              className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-blue-50 hover:bg-[#2563eb] text-[#2563eb] hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300"
                            >
                              Analyze Detailed Fit <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All 35 Clubs Portal Listing & Direct Feeds */}
                <div className="space-y-8">
                  <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-display font-black text-gray-900 tracking-tight">Rajshahi University Club Ecosystem</h3>
                      <p className="text-gray-400 font-medium text-sm mt-1 italic">Click on club names to view their full profiles, DNA compatibility, and real-time announcement board.</p>
                    </div>
                  </div>

                  {/* Search & Category Filter */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search official RU Clubs..."
                        value={clubSearchQuery}
                        onChange={(e) => setClubSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2563eb] outline-none text-sm font-semibold"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Career & Business', 'Science & Academic', 'Culture & Arts', 'Social & Service', 'Media & Leisure'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedClubCategory(cat)}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                            selectedClubCategory === cat
                              ? "bg-[#2563eb] text-white border-[#2563eb]"
                              : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {CLUBS_DATA.filter(c => {
                      const matchesSearch = c.name.toLowerCase().includes(clubSearchQuery.toLowerCase()) || c.id.toLowerCase().includes(clubSearchQuery.toLowerCase());
                      const matchesCat = selectedClubCategory === 'All' || c.category === selectedClubCategory;
                      return matchesSearch && matchesCat;
                    }).map((club) => {
                      const clubEvents = events.filter(e => (e as any).clubId === club.id).map(e => ({
                        ...e,
                        clubPostType: 'Event',
                        dateTime: e.dateTime,
                        venue: e.venue
                      }));
                      const clubFeedFiltered = clubFeedItems.filter(f => f.clubId === club.id);
                      const feeds = [...clubEvents, ...clubFeedFiltered].sort((a, b) => {
                        const dateA = a.createdAt ? ((a.createdAt as any).toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt)) : new Date();
                        const dateB = b.createdAt ? ((b.createdAt as any).toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt)) : new Date();
                        return dateB.getTime() - dateA.getTime();
                      });
                      const isExpanded = expandedClubId === club.id;

                      return (
                        <div
                          key={club.id}
                          onClick={() => setSelectedClubId(club.id)}
                          className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer"
                        >
                          <div className="absolute top-0 left-0 w-2 h-full bg-[#2563eb] opacity-80" />
                          <div>
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-mono font-black text-[#2563eb]">
                                {club.id}
                              </span>
                              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{club.category}</span>
                            </div>

                            <h4 className="mb-2">
                              <button
                                onClick={() => setSelectedClubId(club.id)}
                                className="inline-flex items-center gap-1.5 text-[#2563eb] hover:text-[#1e3a8a] font-display font-black text-lg md:text-xl hover:underline group-hover:translate-x-1 transition-all duration-300 text-left"
                              >
                                {club.name}
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563eb] transition-colors" />
                              </button>
                            </h4>

                            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">
                              {club.description}
                            </p>

                            <div className="flex gap-3 mb-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClubId(club.id);
                                }}
                                className="flex-1 py-3 bg-blue-50 hover:bg-[#2563eb] text-[#2563eb] hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm"
                              >
                                View Detailed Profile
                              </button>
                            </div>

                            {/* Club Feed Section for Student */}
                            <div className="border-t border-gray-50 pt-5 mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedClubId(isExpanded ? null : club.id);
                                }}
                                className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest text-[#2563eb] hover:text-[#1e3a8a]"
                              >
                                <span className="flex items-center gap-2">
                                  <span className={cn("w-1.5 h-1.5 rounded-full", feeds.length > 0 ? "bg-amber-500 animate-pulse" : "bg-gray-300")} />
                                  Live Announcements ({feeds.length})
                                </span>
                                <span>{isExpanded ? "Hide Feed" : "View Feed"}</span>
                              </button>

                              {isExpanded && (
                                <div className="mt-4 space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                                  {feeds.length > 0 ? (
                                    feeds.map((item) => (
                                      <div key={item.id} className="bg-gray-50 p-4 border border-gray-100 rounded-2xl flex flex-col relative">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className={cn(
                                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                            (item as any).clubPostType === 'Event' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                            (item as any).clubPostType === 'Achievement' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                            (item as any).clubPostType === 'History' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                            (item as any).clubPostType === 'Ceremony' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                            (item as any).clubPostType === 'Update' ? "bg-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/15" :
                                            "bg-blue-50 text-blue-700 border-blue-100"
                                          )}>
                                            {(item as any).clubPostType || 'News'}
                                          </span>
                                          <span className="text-[9px] font-semibold text-gray-400">
                                            {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : 'Just now'}
                                          </span>
                                        </div>
                                        <h5 className="font-extrabold text-sm text-gray-900 mb-1">{item.title.replace(`[${club.id}] `, '')}</h5>
                                        <p className="text-xs text-gray-600 leading-relaxed font-semibold italic">"{item.description}"</p>

                                        {((item as any).clubPostType === 'Event' || item.venue || item.dateTime) && (
                                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-gray-500 border-t border-gray-100/50 pt-2">
                                            {item.venue && <span className="flex items-center gap-1">📍 {item.venue}</span>}
                                            {item.dateTime && <span className="flex items-center gap-1">🕒 {item.dateTime}</span>}
                                          </div>
                                        )}

                                        {item.contact?.joinLink && (
                                          <a
                                            href={item.contact.joinLink.startsWith('http') ? item.contact.joinLink : `https://${item.contact.joinLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#2563eb] hover:underline"
                                          >
                                            Register / Join Now <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="py-6 text-center text-xs text-gray-300 italic">
                                      No active announcements for this club.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'insights' && (
            <div className="space-y-8 animate-fade-in">
              {/* Main Hub Header Card */}
              <div className="relative overflow-hidden bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563eb]/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative min-w-0 flex-1">
                  <h3 className="text-2xl md:text-3xl font-display font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-[#ef4444] fill-current" />
                    RU Campus Insights Hub
                  </h3>
                  <p className="text-gray-400 font-medium italic text-xs md:text-sm mt-1">
                    Authentic guides, department hacks, research hints, and career suggestions curated by authorized authors.
                  </p>
                  
                  {/* Sub-tab Switches */}
                  <div className="flex items-center gap-2 mt-6 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100 flex-wrap">
                    <button
                      onClick={() => setInsightsSubTab('articles')}
                      className={cn(
                        "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                        insightsSubTab === 'articles'
                          ? "bg-[#2563eb] text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-900"
                      )}
                    >
                      Articles & Guides
                    </button>
                    <button
                      onClick={() => setInsightsSubTab('media')}
                      className={cn(
                        "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer",
                        insightsSubTab === 'media'
                          ? "bg-[#2563eb] text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-900"
                      )}
                    >
                      Multimedia Vault ({mediaResources.length})
                    </button>
                    <button
                      onClick={() => setInsightsSubTab('synthesis')}
                      className={cn(
                        "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                        insightsSubTab === 'synthesis'
                          ? "bg-[#2563eb] text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-900"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#ef4444]" />
                      AI Synthesis Center
                    </button>
                  </div>
                </div>

                {insightsSubTab !== 'synthesis' && (
                  <div className="relative w-full md:w-80 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    {insightsSubTab === 'articles' ? (
                      <input
                        type="text"
                        value={articleSearchQuery}
                        onChange={(e) => setArticleSearchQuery(e.target.value)}
                        placeholder="Search titles, authors, hacks..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2563eb] transition-all shadow-inner"
                      />
                    ) : (
                      <input
                        type="text"
                        value={mediaSearchQuery}
                        onChange={(e) => setMediaSearchQuery(e.target.value)}
                        placeholder="Search files, channels, resource links..."
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm font-bold text-gray-900 focus:bg-white focus:border-[#2563eb] transition-all shadow-inner"
                      />
                    )}
                  </div>
                )}
              </div>

              {insightsSubTab === 'articles' && (
                <>
                  {/* Category Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {['All', 'Career Suggestions', 'Research & Publications', 'Department Hacks', 'Skill Development Tips', 'Campus Resources', 'General Guidance'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedArticleCategory(cat)}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer",
                          selectedArticleCategory === cat
                            ? "bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-[#2563eb]/10"
                            : "bg-white text-gray-400 border-gray-100 hover:border-[#2563eb]/20 hover:text-gray-900"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Articles Feed */}
                  {articles.filter(art => {
                    const matchesCat = selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                    const matchesSearch = art.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
                                          art.content.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
                                          art.authorName.toLowerCase().includes(articleSearchQuery.toLowerCase());
                    return matchesCat && matchesSearch;
                  }).length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 space-y-3">
                      <p className="text-gray-400 font-bold">No insights found.</p>
                      <p className="text-xs text-gray-300">Try adjusting your filters or search terms.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {articles.filter(art => {
                        const matchesCat = selectedArticleCategory === 'All' || art.category === selectedArticleCategory;
                        const matchesSearch = art.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
                                              art.content.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
                                              art.authorName.toLowerCase().includes(articleSearchQuery.toLowerCase());
                        return matchesCat && matchesSearch;
                      }).map((art) => (
                        <motion.article
                          key={art.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 hover:border-[#2563eb]/10 transition-all shadow-sm relative group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="px-3 py-1 bg-blue-50 text-[#2563eb] text-[9px] font-black uppercase tracking-wider rounded-full border border-blue-100">
                                {art.category}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {art.readingTime}
                              </span>
                            </div>

                            <h4 className="text-lg md:text-xl font-display font-black text-gray-900 mt-4 leading-snug group-hover:text-[#2563eb] transition-colors">
                              {art.title}
                            </h4>

                            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium mt-3 whitespace-pre-line line-clamp-4 italic">
                              "{art.content}"
                            </p>
                          </div>

                          <div className="flex items-center gap-3 mt-6 border-t pt-4">
                            <div className="w-8 h-8 bg-blue-50 text-[#2563eb] rounded-lg flex items-center justify-center font-black text-xs border border-blue-100">
                              {art.authorName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-800">{art.authorName}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Authorized Platform Author</p>
                            </div>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  )}
                </>
              )}

              {insightsSubTab === 'media' && (
                <div className="space-y-6">
                  {/* Category Pills for Media types */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {['All', 'pdf', 'word', 'video', 'audio', 'website'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedMediaType(type)}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer",
                          selectedMediaType === type
                            ? "bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-[#2563eb]/10"
                            : "bg-white text-gray-400 border-gray-100 hover:border-[#2563eb]/20 hover:text-gray-900"
                        )}
                      >
                        {type === 'All' ? 'All Formats' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {/* Media Grid */}
                  {mediaResources.filter(res => {
                    const matchesType = selectedMediaType === 'All' || res.type === selectedMediaType;
                    const matchesSearch = res.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()) || 
                                          res.description.toLowerCase().includes(mediaSearchQuery.toLowerCase()) || 
                                          res.authorName.toLowerCase().includes(mediaSearchQuery.toLowerCase());
                    return matchesType && matchesSearch;
                  }).length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 space-y-3">
                      <p className="text-gray-400 font-bold">No resources found in the Vault.</p>
                      <p className="text-xs text-gray-300">Try adjusting your filters or search terms.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mediaResources.filter(res => {
                        const matchesType = selectedMediaType === 'All' || res.type === selectedMediaType;
                        const matchesSearch = res.title.toLowerCase().includes(mediaSearchQuery.toLowerCase()) || 
                                              res.description.toLowerCase().includes(mediaSearchQuery.toLowerCase()) || 
                                              res.authorName.toLowerCase().includes(mediaSearchQuery.toLowerCase());
                        return matchesType && matchesSearch;
                      }).map((res) => {
                        // Icon mapping
                        const getIcon = () => {
                          switch(res.type) {
                            case 'pdf': return <File className="w-5 h-5 text-rose-500" />;
                            case 'word': return <FileUp className="w-5 h-5 text-blue-500" />;
                            case 'video': return <Video className="w-5 h-5 text-purple-500" />;
                            case 'audio': return <Music className="w-5 h-5 text-amber-500" />;
                            case 'website': return <Globe className="w-5 h-5 text-blue-500" />;
                            default: return <File className="w-5 h-5 text-gray-500" />;
                          }
                        };

                        return (
                          <motion.div
                            key={res.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-[#2563eb]/10 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-4">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5",
                                  res.type === 'pdf' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                  res.type === 'word' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  res.type === 'video' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                  res.type === 'audio' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                  "bg-blue-50 text-blue-700 border-blue-100"
                                )}>
                                  {getIcon()}
                                  {res.type}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400">
                                  {res.createdAt ? new Date(res.createdAt.toDate ? res.createdAt.toDate() : res.createdAt).toLocaleDateString() : 'Recent'}
                                </span>
                              </div>

                              <h4 className="text-base font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-2">
                                {res.title}
                              </h4>

                              <p className="text-xs text-gray-500 leading-relaxed font-semibold italic mt-2 line-clamp-3">
                                "{res.description}"
                              </p>
                            </div>

                            <div className="mt-6 border-t border-gray-50 pt-4 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 flex items-center justify-center font-black text-[10px] shrink-0">
                                  {res.authorName ? res.authorName.charAt(0) : 'A'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black text-gray-800 truncate">{res.authorName || 'Author'}</p>
                                </div>
                              </div>

                              <a
                                href={res.url.startsWith('http') ? res.url : `https://${res.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/5 text-[#2563eb] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2563eb] hover:text-white transition-all shrink-0 cursor-pointer"
                              >
                                Access <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {insightsSubTab === 'synthesis' && (
                <AICampusSynthesizer 
                  profile={profile}
                  articles={articles}
                  mediaResources={mediaResources}
                  events={events}
                  clubFeedItems={clubFeedItems}
                />
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <DNAStudio profile={profile} events={events} />
          )}

          {activeTab === 'calendar' && (
            <EventCalendar events={events} onFeedbackClick={setSelectedEventForFeedback} />
          )}

          {activeTab === 'sandbox' && (
            <RecommendationSandbox profile={profile} />
          )}

          {activeTab === 'settings' && (
            <SystemSettings />
          )}

          {activeTab === 'manual' && (
            <PlatformManual />
          )}
        </div>

        <AnimatePresence>
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#131314]"
            >
              <MentorChat 
                initialMessage={aiSearchQuery} 
                onClose={() => setActiveTab('overview')} 
                articles={articles}
                mediaResources={mediaResources}
                events={events}
                clubFeedItems={clubFeedItems}
                profile={profile}
              />
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
      <div className="bg-[#1e3a8a] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Book className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ef4444] text-[#1e3a8a] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
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
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-[#2563eb] mb-8">
              {p.icon}
            </div>
            <h4 className="text-2xl font-display font-black text-gray-900 mb-4">{p.title}</h4>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">{p.desc}</p>
            <div className="space-y-3">
              {p.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-[10px] font-black text-[#2563eb] uppercase tracking-widest">
                  <span className="w-1 h-1 bg-[#ef4444] rounded-full" />
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
          className="px-10 py-5 bg-[#1e3a8a] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#1e3a8a]/20"
        >
          Speak with Navigator AI
        </button>
      </div>
    </div>
  );
}

function DNAStudio({ profile, events }: { profile: UserProfile; events: ClubEvent[] }) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
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
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  useEffect(() => {
    if (profile.studentDNA) {
      setDna(profile.studentDNA);
    }
    if (profile.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile.studentDNA, profile.displayName]);

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

  const handleSaveOnly = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'users', profile.uid);
      await updateDoc(docRef, { 
        displayName: displayName,
        studentDNA: dna, 
        updatedAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setSaving(false);
    }
  };

  const handleDeepAISynthesis = async () => {
    setGeneratingRoadmap(true);
    setGenerationStep(1);
    
    const interval = setInterval(() => {
      setGenerationStep(prev => prev < 4 ? prev + 1 : prev);
    }, 1800);

    try {
      const docRef = doc(db, 'users', profile.uid);
      // Run Gemini API call
      const generated = await generateRoadmap(dna);
      if (generated) {
        await updateDoc(docRef, { 
          displayName: displayName,
          studentDNA: dna, 
          roadmap: generated, 
          updatedAt: serverTimestamp() 
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      clearInterval(interval);
      setGeneratingRoadmap(false);
      setGenerationStep(0);
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'roadmap' }));
    }
  };

  // --- REAL-TIME HEURISTIC RECOMMENDATION CORE ---
  const getHeuristicFeedback = () => {
    // 1. Temporal Stage Milestones Focus
    let ageGuidance = "Select your department and year to calibrate instant pathway insights.";
    if (dna.year === '1st Year') {
      ageGuidance = "Focus on establishing academic foundations (GPA), adjustments with student autonomy, and discovering general-purpose clubs (like RUCC or RUSC) as general members.";
    } else if (dna.year === '2nd Year') {
      ageGuidance = "Aim at basic skillset creation (coding, basic debates, slide creation). Step up into working execution-level sub-committees of campus clubs.";
    } else if (dna.year === '3rd Year') {
      ageGuidance = "Pivot towards local workspace preparedness: search actively for internships, design robust LinkedIn networks, engage in inter-varsity contests, or begin core BCS preparatory sets.";
    } else if (dna.year === '4th Year') {
      ageGuidance = "Complete graduation thesis/dissertation milestones. Unleash intensive job applications and profile promotions. Engage in physical mock trials and recruitment challenges.";
    } else if (dna.year === 'Masters' || dna.year === 'Alumnus') {
      ageGuidance = "Focus on corporate transitions, international MS fellowships or graduate applications, major national recruitment schemes, and mentorship roles inside the TSC.";
    }

    // 2. Club Match Algorithm
    const clubScores = CLUBS_DATA.map(club => {
      let score = 0.5; // Base score
      const cat = club.category;
      const deptLow = (dna.dept || '').toLowerCase();
      const goalLow = (dna.goals || '').toLowerCase();

      // Dept category alignments
      if (deptLow.includes('computer') || deptLow.includes('information') || deptLow.includes('electrical') || deptLow.includes('engineering')) {
        if (cat === 'Science & Academic') score += 0.25;
        if (club.id === 'RUCC' || club.id === 'RUSC' || club.id === 'RURS') score += 0.15;
      }
      if (deptLow.includes('chemistry') || deptLow.includes('applied') || deptLow.includes('physics') || deptLow.includes('math') || deptLow.includes('statistics')) {
        if (cat === 'Science & Academic') score += 0.2;
        if (club.id === 'RUSC' || club.id === 'RURS' || club.id === 'RUHSC') score += 0.1;
      }
      if (deptLow.includes('accounting') || deptLow.includes('management') || deptLow.includes('marketing') || deptLow.includes('finance') || deptLow.includes('business') || deptLow.includes('economics')) {
        if (cat === 'Career & Business') score += 0.3;
        if (club.id === 'RUBC' || club.id === 'RUCC') score += 0.15;
      }
      if (deptLow.includes('law') || deptLow.includes('political') || deptLow.includes('public') || deptLow.includes('english') || deptLow.includes('sociology')) {
        if (club.id === 'RUMUNA' || club.id === 'RURF') score += 0.25;
        if (cat === 'Social & Service') score += 0.1;
      }

      // Goals parameters alignments
      if (goalLow.includes('software') || goalLow.includes('engineer') || goalLow.includes('tech') || goalLow.includes('coding')) {
        if (club.id === 'RUCC') score += 0.1;
        if (club.id === 'RUSC') score += 0.05;
      }
      if (goalLow.includes('business') || goalLow.includes('entrepreneur') || goalLow.includes('bank') || goalLow.includes('startup')) {
        if (club.id === 'RUBC' || club.id === 'RUCC') score += 0.15;
      }
      if (goalLow.includes('bcs') || goalLow.includes('govt') || goalLow.includes('government') || goalLow.includes('civil')) {
        if (club.id === 'RUEC' || club.id === 'RUMUNA') score += 0.15;
      }
      if (goalLow.includes('higher') || goalLow.includes('study') || goalLow.includes('masters') || goalLow.includes('academic') || goalLow.includes('phd')) {
        if (club.id === 'RUHSC' || club.id === 'RURS') score += 0.15;
      }

      // Motivation & involving metrics
      if (dna.motivation === 'Financial Stability' && cat === 'Career & Business') score += 0.05;
      if (dna.motivation === 'Social Impact' && cat === 'Social & Service') score += 0.1;

      return {
        ...club,
        score: Math.min(0.98, score)
      };
    }).sort((a, b) => b.score - a.score);

    const recommendedClubsHeuristic = clubScores.slice(0, 3);

    // 3. Active Event Alignments Matcher
    const eventScores = (events || []).map(event => {
      let score = 0.5;
      const titleLow = event.title.toLowerCase();
      const descLow = (event.description || '').toLowerCase();
      const orgLow = (event.adminName || '').toLowerCase();
      const deptLow = (dna.dept || '').toLowerCase();
      const goalLow = (dna.goals || '').toLowerCase();

      // Check overlaps with recommended club abbreviation ids
      recommendedClubsHeuristic.forEach(club => {
        if (orgLow.includes(club.id.toLowerCase()) || titleLow.includes(club.id.toLowerCase())) {
          score += 0.25;
        }
      });

      // Semantic matching keywords
      if (deptLow.includes('computer') || deptLow.includes('information') || goalLow.includes('software') || goalLow.includes('engineering') || goalLow.includes('developer')) {
        if (titleLow.includes('code') || titleLow.includes('comput') || titleLow.includes('tech') || titleLow.includes('hack') || titleLow.includes('program') || descLow.includes('software')) {
          score += 0.25;
        }
      }
      if (deptLow.includes('accounting') || deptLow.includes('business') || deptLow.includes('economics') || goalLow.includes('business') || goalLow.includes('entrepreneur')) {
        if (titleLow.includes('case') || titleLow.includes('business') || titleLow.includes('market') || titleLow.includes('summit') || descLow.includes('finance')) {
          score += 0.25;
        }
      }
      if (goalLow.includes('bcs') || goalLow.includes('govt') || goalLow.includes('civil') || goalLow.includes('government')) {
        if (titleLow.includes('bcs') || titleLow.includes('guidelines') || titleLow.includes('civil') || titleLow.includes('exam')) {
          score += 0.3;
        }
      }
      if (goalLow.includes('higher') || goalLow.includes('study') || goalLow.includes('research') || goalLow.includes('scholarship')) {
        if (titleLow.includes('ielts') || titleLow.includes('research') || titleLow.includes('journal') || titleLow.includes('higher') || titleLow.includes('gre')) {
          score += 0.3;
        }
      }

      return {
        ...event,
        score: Math.min(0.97, score)
      };
    }).sort((a, b) => b.score - a.score);

    const recommendedEventsHeuristic = eventScores.slice(0, 2);

    return {
      ageGuidance,
      recommendedClubs: recommendedClubsHeuristic,
      recommendedEvents: recommendedEventsHeuristic
    };
  };

  const feedback = getHeuristicFeedback();

  // Loader components shown while executing deep synthesis
  if (generatingRoadmap) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-full border-4 border-blue-50 border-t-emerald-600 animate-spin flex items-center justify-center" />
          <div className="absolute inset-0 flex items-center justify-center text-blue-600">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
        </div>
        <div className="space-y-4 max-w-lg">
          <h4 className="text-3xl font-display font-black text-gray-900 tracking-tight">Synthetically Calibrating...</h4>
          <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest animate-pulse">
            {generationStep === 1 && "Aligning Academic DNA parameters..."}
            {generationStep === 2 && "Mapping Rajshahi University Club coordinates..."}
            {generationStep === 3 && "Synthesizing deep localized 4-year success milestones..."}
            {generationStep === 4 && "Connecting physical and digital alumni knowledge resources..."}
          </p>
          <p className="text-xs text-gray-400 italic">This will update your dashboard reactively. Seamless transition occurs automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Top Banner introducing Instant Feedback */}
      <div className="bg-[#1e3a8a] rounded-[3.5rem] p-8 md:p-14 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Cpu className="w-56 h-56" />
        </div>
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ef4444] text-[#1e3a8a] rounded-full text-[9px] font-black uppercase tracking-[0.25em]">
            Interactive Synthesis Studio
          </div>
          <h3 className="text-3xl md:text-5xl font-display font-black leading-tight tracking-tighter">Academic DNA Calibration</h3>
          <p className="text-sm md:text-base text-white/80 max-w-2xl font-medium leading-relaxed italic">
            "Adjust your academic goals, motivation indices, and department attributes below. Your club alignments, yearly path constraints, and event nodes will calibrate in real-time."
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Left Column (Core Parameters Form) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-8">
          <div className="border-b border-gray-100 pb-4">
            <h4 className="text-xl font-display font-black text-gray-900">1. Parameter Tuning Node</h4>
            <p className="text-xs text-gray-400 font-medium italic">Adjust the inputs to recalculate recommendations instantly.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveOnly(); }} className="space-y-8">
            {/* Section: Personal Identity */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Personal Profile Node</span>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text"
                  required
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm shadow-inner" 
                  placeholder="e.g. Adit Chowdhury"
                />
              </div>
            </div>

            {/* Section A: Academics */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Academic Matrix</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Department Node</label>
                  <select 
                    value={dna.dept} 
                    onChange={e => setDna({...dna, dept: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {deptOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Temporal Stage (Year)</label>
                  <select 
                    value={dna.year} 
                    onChange={e => setDna({...dna, year: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select Year</option>
                    {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section B: Ambition & Context */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Ambition Core</span>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Primary Ambition</label>
                <input 
                  value={dna.goals} 
                  onChange={e => setDna({...dna, goals: e.target.value})} 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm shadow-inner" 
                  placeholder="e.g. Software Engineer, Civil Servant, Banker"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['BCS / Civil Service', 'Software Engineer', 'Bank Job', 'Higher Studies', 'Entrepreneur'].map(s => (
                    <button key={s} type="button" onClick={() => setDna({...dna, goals: s})} className="text-[8px] font-black uppercase bg-[#ef4444]/10 hover:bg-[#ef4444]/30 px-2.5 py-1 rounded-full text-[#2563eb] transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Development Stage</label>
                  <select 
                    value={dna.goalStage} 
                    onChange={e => setDna({...dna, goalStage: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    {goalStageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Target Market Selection</label>
                  <select 
                    value={dna.marketPreference} 
                    onChange={e => setDna({...dna, marketPreference: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Target Market</option>
                    {marketOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section C: Character Traits */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Psychographic Vectors</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Primary Motivation</label>
                  <select 
                    value={dna.motivation} 
                    onChange={e => setDna({...dna, motivation: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">What drives you?</option>
                    {motivationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ideal Work Style</label>
                  <select 
                    value={dna.workStyle} 
                    onChange={e => setDna({...dna, workStyle: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Best work environments</option>
                    {styleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">10-Year Long-Term Vision</label>
                  <select 
                    value={dna.vision10Years} 
                    onChange={e => setDna({...dna, vision10Years: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Future self projection</option>
                    {visionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Obstruction Factor</label>
                  <select 
                    value={dna.majorObstacle} 
                    onChange={e => setDna({...dna, majorObstacle: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Biggest barrier</option>
                    {obstacleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section D: Talents & Capabilities */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Functional Talents</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Top Native Strength</label>
                  <select 
                    value={dna.topStrengths} 
                    onChange={e => setDna({...dna, topStrengths: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Your strongest asset</option>
                    {strengthOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Desired Growth Area</label>
                  <select 
                    value={dna.improvementAreas} 
                    onChange={e => setDna({...dna, improvementAreas: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Growth focus</option>
                    {improvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section E: Extracurricular and Habits */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]/70 border-b border-gray-100 pb-1 block">Extracurricular Nodes & Detailed Narrative</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Previous Club Sector</label>
                  <select 
                    value={dna.previousInvolvement} 
                    onChange={e => setDna({...dna, previousInvolvement: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select past involvement</option>
                    {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active TSC Node involvement</label>
                  <select 
                    value={dna.currentInvolvement} 
                    onChange={e => setDna({...dna, currentInvolvement: e.target.value})} 
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-bold text-gray-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select current node involvement</option>
                    {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Habits & Specific Tech/Life Experiences</label>
                <textarea 
                  value={dna.habits} 
                  onChange={e => setDna({...dna, habits: e.target.value})} 
                  placeholder="Summarize daily routines, digital technologies used, or practical hands-on experiences."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#2563eb] outline-none transition-all font-medium text-gray-600 text-sm h-28 shadow-inner leading-relaxed" 
                />
              </div>
            </div>

            {/* Actions Panel */}
            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <button 
                type="button"
                onClick={handleSaveOnly}
                disabled={saving}
                className="flex-1 py-4 bg-gray-100 text-[#2563eb] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#2563eb]/5 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Coordinates</>}
              </button>

              <button 
                type="button" 
                onClick={handleDeepAISynthesis}
                disabled={generatingRoadmap}
                className="flex-1 py-4 bg-[#2563eb] text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#2563eb]/10 hover:scale-[1.01] hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-[#ef4444]" /> Forging Deep AI Roadmap
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (Dynamic Recommendation and Instant Feedback Studio) */}
        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8 self-start">
          {/* Main Feedback Box */}
          <div className="bg-gray-900 p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-8 border-2 border-[#10b981]/20">
            {/* Pulsing Active Node header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                </span>
                <span className="font-mono text-[9px] font-black text-gray-400 uppercase tracking-widest">COGNITIVE MATCH ENGINE</span>
              </div>
              <span className="px-2.5 py-1 bg-[#10b981]/10 rounded-full text-[8px] font-black uppercase text-[#10b981] tracking-widest">
                0ms Latency Feed
              </span>
            </div>

            {/* Instant Pathway Guideline Milestone */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#ef4444]">
                <Target className="w-5 h-5" />
                <h5 className="font-display font-black text-base uppercase tracking-tight">Temporal Stage Focus</h5>
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <p className="text-xs text-white/80 font-medium leading-relaxed italic">
                  "{feedback.ageGuidance}"
                </p>
              </div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                Target milestones adapted dynamically to {dna.year || 'general status'}.
              </p>
            </div>

            {/* Club Scores Dynamic List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Users className="w-5 h-5" />
                <h5 className="font-display font-black text-base uppercase tracking-tight">Best Society Resonance</h5>
              </div>
              <p className="text-[10px] font-medium text-gray-400 leading-relaxed italic mt-1">
                Your parameters suggest high compatibility with these Rajshahi University extra-curricular structures:
              </p>
              
              <div className="space-y-3">
                {feedback.recommendedClubs.map((club, idx) => (
                  <div key={club.id} className="relative overflow-hidden bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-2 group hover:border-[#10b981]/30 transition-all">
                    {/* Progress score bar alignment background overlay */}
                    <div className="absolute top-0 left-0 bottom-0 bg-blue-500/5 transition-all" style={{ width: `${club.score * 100}%` }} />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[8px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{club.id}</span>
                        <h6 className="font-bold text-sm text-white line-clamp-1 truncate block">{club.name}</h6>
                      </div>
                      <span className="font-mono font-black text-xs text-blue-400">{(club.score * 100).toFixed(0)}% Match</span>
                    </div>
                    <p className="relative z-10 text-[10px] text-gray-400 italic line-clamp-1">"{club.description}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Campus Event Alignment Heuristic */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#ef4444]">
                <Calendar className="w-5 h-5" />
                <h5 className="font-display font-black text-base uppercase tracking-tight">Custom Events Match-ups</h5>
              </div>

              {feedback.recommendedEvents.length === 0 ? (
                <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-center text-[11px] italic text-gray-400">
                  No upcoming active club events detected in database.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedback.recommendedEvents.map((ev, i) => (
                    <div key={ev.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-2 hover:border-[#ef4444]/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Matched Event Node</span>
                        <span className="font-mono font-black text-[9px] text-[#ef4444]">{(ev.score * 100).toFixed(0)}% Score</span>
                      </div>
                      <h6 className="font-bold text-xs text-white line-clamp-1">{ev.title}</h6>
                      <p className="text-[10px] text-gray-400 italic block">Organized by {ev.adminName || 'TSC Society'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Settings Quick Link Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563eb]">
                <Cpu className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-display font-black text-lg text-gray-900 tracking-tight">Neural API Credential</h4>
                <p className="text-xs font-medium text-gray-400">Calibrate local Gemini key</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Your AI-driven success roadmaps are compiled using Google Gemini models. To maximize processing velocity, supply your unique Gemini API Key.
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'settings' }))}
              className="px-6 py-3 bg-gray-50 text-[#2563eb] leading-none rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2563eb] hover:text-white transition-all border border-[#2563eb]/10 inline-block"
            >
              Configure API Node
            </button>
          </div>
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
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white transition-all">
                  {res.category === 'LinkedIn' && <Linkedin className="w-6 h-6" />}
                  {res.category === 'BCS' && <GraduationCap className="w-6 h-6" />}
                  {res.category === 'Tech' && <Cpu className="w-6 h-6" />}
                  {res.category === 'RU Portal' && <Globe className="w-6 h-6" />}
                  {res.category === 'Skill' && <Target className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 line-clamp-1">{res.title}</h4>
                  <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest">{res.category}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 italic mb-4">"{res.description}"</p>
              <div className="flex items-center gap-2 text-xs font-black text-[#2563eb] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
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
    red: 'bg-red-50 text-[#D11226]',
    blue: 'bg-sky-50 text-[#00A3E0]',
    gold: 'bg-amber-50 text-amber-500',
    green: 'bg-blue-50 text-[#2563eb]'
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border border-gray-100 shadow-sm group hover:border-[#2563eb] transition-all flex flex-col">
      <div className="flex items-center gap-4 mb-4 md:mb-6">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#2563eb] group-hover:text-white shrink-0", colorStyles[color])}>
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

      <button onClick={onAction} className="w-full py-3 md:py-4 text-[9px] md:text-[10px] font-black text-[#2563eb] uppercase tracking-widest bg-[#2563eb]/5 rounded-xl hover:bg-[#2563eb] hover:text-white transition-all">
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
        theme === 'green' ? "bg-[#2563eb] text-white" : "bg-[#ef4444] text-[#2563eb]"
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
      className="group bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:border-[#2563eb] hover:shadow-2xl transition-all flex flex-col relative overflow-hidden"
    >
      {/* Club Name Highlight Badge */}
      <div className="absolute top-0 right-0 px-4 md:px-6 py-1.5 md:py-2 bg-[#2563eb] text-[#ef4444] text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-2xl md:rounded-bl-3xl shadow-sm z-10">
        {event.organizer || event.adminName || 'RU Society'}
      </div>

      {interestCount > 40 && (
        <div className="absolute top-8 md:top-10 right-4 px-2 py-1 bg-orange-100 text-orange-600 text-[7px] md:text-[8px] font-black uppercase tracking-tighter rounded-full border border-orange-200">
          Uprising Node
        </div>
      )}

      <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
        <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-md shrink-0", type === 'pro' ? "bg-blue-50 text-[#2563eb]" : "bg-yellow-50 text-yellow-700")}>
          {type === 'pro' ? <Briefcase className="w-5 h-5 md:w-6 md:h-6" /> : <Heart className="w-5 h-5 md:w-6 md:h-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg md:text-xl font-display font-black text-gray-900 leading-tight group-hover:text-[#2563eb] transition-colors line-clamp-1">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full animate-pulse" />
            <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Live Node Activity</p>
          </div>
        </div>
      </div>

      {/* DATA & LOCATION HUD */}
      <div className="relative mb-6 md:mb-8">
        <div className="absolute inset-0 bg-[#2563eb]/5 rounded-2xl md:rounded-3xl -rotate-1 skew-x-1 transition-transform group-hover:rotate-0 group-hover:skew-x-0" />
        <div className="relative p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#2563eb] shadow-sm border border-gray-100 shrink-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Deployment Date</p>
              <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.dateTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-[#ef4444] shadow-sm border border-gray-100 shrink-0">
              <MapPin className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Node Location</p>
              <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.venue || event.location}</p>
            </div>
          </div>
          {event.mentors && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-gray-100 shrink-0">
                <User className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Mentor / Speaker</p>
                <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.mentors}</p>
              </div>
            </div>
          )}
          {event.fee && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Registration Fee</p>
                <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.fee}</p>
              </div>
            </div>
          )}
          {event.duration && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 shrink-0">
                <Cpu className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Event Duration</p>
                <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.duration}</p>
              </div>
            </div>
          )}
          {event.skillsTargeted && (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-gray-100 shrink-0">
                <Target className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Targeted Skills</p>
                <p className="text-xs md:text-base font-black text-gray-900 leading-none mt-1">{event.skillsTargeted}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs md:text-sm text-gray-500 mb-6 md:mb-8 line-clamp-2 italic font-medium leading-relaxed flex-grow">"{event.description}"</p>

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center justify-between gap-3 md:gap-4">
            <div className="flex gap-2">
              {event.contact.whatsapp && <a href={`https://wa.me/${event.contact.whatsapp}`} target="_blank" rel="noreferrer" className="p-2.5 md:p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><MessageCircle className="w-4 h-4 md:w-5 md:h-5" /></a>}
              {event.contact.joinLink && <a href={event.contact.joinLink} target="_blank" rel="noreferrer" className="p-2.5 md:p-3 bg-[#2563eb]/5 text-[#2563eb] rounded-xl hover:bg-[#2563eb] hover:text-white transition-all shadow-sm"><ExternalLink className="w-4 h-4 md:w-5 md:h-5" /></a>}
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
        <button onClick={onFeedbackClick} className="w-full py-3.5 md:py-4 bg-gray-900 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#2563eb] shadow-lg flex items-center justify-center gap-2 md:gap-3">
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
      <div className="bg-[#1e3a8a] rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Cpu className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ef4444] text-[#1e3a8a] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
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
                className="w-full h-64 p-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#2563eb] focus:bg-white outline-none transition-all font-medium text-gray-600 shadow-inner leading-relaxed"
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
              {isKnowledgeSaved ? <Edit3 className="w-4 h-4" /> : <Zap className="w-4 h-4 text-[#ef4444]" />}
              {isKnowledgeSaved ? "Knowledge Synchronized" : "Calibrate AI Brain"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#2563eb]">
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
                  className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-[#2563eb] focus:bg-white outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <button 
                type="submit" 
                className={cn(
                  "w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                  isSaved ? "bg-red-500 text-white" : "bg-[#2563eb] text-white hover:scale-[1.02] shadow-lg"
                )}
              >
                {isSaved ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4 text-[#ef4444]" />}
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
                  <div key={i} className="flex items-center gap-3 text-xs font-black text-[#2563eb] uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-[#ef4444] rounded-full" />
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e3a8a]/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl">
        <div className="bg-[#1e3a8a] p-10 text-white relative">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-5 h-5 text-white" /></button>
          <Sparkles className="w-10 h-10 text-[#ef4444] mb-6" />
          <h3 className="text-3xl font-display font-black leading-tight">Synergy Feedback.</h3>
          <p className="text-white/60 text-sm font-medium italic truncate mb-0">{event.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black text-gray-300 uppercase tracking-widest">Experience Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="p-1 hover:scale-110 transition-transform">
                  <Star className={cn("w-10 h-10", star <= rating ? "fill-[#ef4444] text-[#ef4444]" : "text-gray-100")} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-300 uppercase tracking-widest">Semantic Review</label>
            <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How did this event affect your roadmap?" className="w-full h-40 p-6 bg-gray-50 border-2 border-transparent rounded-[2.5rem] focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm font-medium leading-relaxed shadow-inner" />
          </div>

          <button type="submit" disabled={submitting} className="w-full py-6 bg-[#2563eb] text-white rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
            {submitting ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Inform RU Mentors'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
