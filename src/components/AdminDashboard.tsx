import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, serverTimestamp, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, auth } from '../lib/firebase';
import { UserProfile, ClubEvent, StudentDNA } from '../types';
import { getEmbedding, analyzeStudentMatch } from '../services/geminiService';
import { cn, cosineSimilarity } from '../lib/utils';
import { Plus, Send, Calendar, MapPin, Target, MessageSquare, Loader2, LogOut, CheckCircle2, Sparkles, DollarSign, Users, GraduationCap, LayoutDashboard, X, Rocket, Book, Menu, ExternalLink } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { CareerResource } from '../types';

interface Props {
  profile: UserProfile;
}

export default function AdminDashboard({ profile }: Props) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'career'>('events');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General' as ClubEvent['category'],
    venue: '',
    mentors: '',
    paymentScale: '',
    paymentDetails: '',
    skillsTargeted: '',
    date: '',
    time: '',
    whatsapp: '',
    email: '',
    joinLink: '',
  });

  const [careerFormData, setCareerFormData] = useState<Omit<CareerResource, 'id'>>({
    title: '',
    category: 'Skill',
    url: '',
    description: '',
  });

  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      where('adminId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubEvent)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'events'));

    const careerQuery = query(collection(db, 'careerResources'), orderBy('title', 'asc'));
    const unsubCareer = onSnapshot(careerQuery, (snapshot) => {
      setCareerResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareerResource)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'careerResources'));

    return () => { unsubEvents(); unsubCareer(); };
  }, [profile.uid]);

  const handlePublishCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await addDoc(collection(db, 'careerResources'), {
        ...careerFormData,
        createdAt: serverTimestamp(),
      });
      setCareerFormData({ title: '', category: 'Skill', url: '', description: '' });
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'careerResources');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const eventContent = `${formData.title} ${formData.description} ${formData.skillsTargeted} ${formData.category} ${formData.mentors}`;
      const vector = await getEmbedding(eventContent);

      const formattedDateTime = `${formData.date} at ${formData.time}`;

      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        venue: formData.venue,
        mentors: formData.mentors,
        paymentScale: formData.paymentScale,
        paymentDetails: formData.paymentDetails,
        skillsTargeted: formData.skillsTargeted,
        dateTime: formattedDateTime,
        contact: {
          whatsapp: formData.whatsapp,
          email: formData.email,
          joinLink: formData.joinLink,
        },
        adminId: profile.uid,
        adminName: profile.displayName || profile.email,
        eventVector: vector,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      
      // TRIGGER MATCHING LOGIC (90% Similarity)
      await runMatchingProcess({ id: docRef.id, ...eventData } as ClubEvent, vector);

      setFormData({
        title: '',
        description: '',
        category: 'General',
        venue: '',
        mentors: '',
        paymentScale: '',
        paymentDetails: '',
        skillsTargeted: '',
        date: '',
        time: '',
        whatsapp: '',
        email: '',
        joinLink: '',
      });
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    } finally {
      setPublishing(false);
    }
  };

  const runMatchingProcess = async (event: ClubEvent, eventVector: number[]) => {
    try {
      const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), where('onboardingComplete', '==', true));
      const studentSnapShort = await getDocs(studentsQuery);
      
      const matchPromises = studentSnapShort.docs.map(async (studentDoc) => {
        const studentData = studentDoc.data() as UserProfile;
        if (!studentData.dnaVector) return;

        const similarity = cosineSimilarity(eventVector, studentData.dnaVector);
        if (similarity >= 0.9) {
          // AI explanation
          const dnaString = JSON.stringify(studentData.studentDNA);
          const eventString = `${event.title}: ${event.description}`;
          const explanation = await analyzeStudentMatch(dnaString, eventString);

          await addDoc(collection(db, 'notifications'), {
            userId: studentData.uid,
            eventId: event.id,
            eventTitle: event.title,
            message: `URGENT MATCH: ${event.title} is a 90%+ match for your profile!`,
            explanation,
            similarityScore: similarity,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      });

      await Promise.all(matchPromises);
    } catch (error) {
      console.error("Matching process failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbfa] flex flex-col md:flex-row selection:bg-[#ffd700] selection:text-[#004d39]">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#004d39] rounded-lg flex items-center justify-center">
            <Target className="text-[#ffd700] w-5 h-5" />
          </div>
          <span className="font-display font-black text-lg text-[#004d39]">RU Admin</span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-0 z-50 bg-[#004d39] md:static md:w-72 md:flex flex-col md:h-screen transition-transform duration-300 md:translate-x-0 h-full",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10 text-white">
            <div className="w-10 h-10 bg-[#ffd700] rounded-xl flex items-center justify-center shadow-lg transform rotate-6">
              <Target className="text-[#004d39] w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">Pathfinder Admin</h1>
          </div>

          <nav className="space-y-1">
             {[
               { id: 'events', icon: <Calendar className="w-5 h-5" />, label: 'Events Mgr' },
               { id: 'career', icon: <Book className="w-5 h-5" />, label: 'Career DB' },
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
                     ? "bg-[#ffd700] text-[#004d39] shadow-lg shadow-[#ffd700]/10" 
                     : "text-white/40 hover:bg-white/10 hover:text-white"
                 )}
               >
                 <span>{item.icon}</span>
                 {item.label}
               </button>
             ))}
          </nav>

          <div className="mt-auto px-4 py-8 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#ffd700] font-black">
                 {profile.displayName?.charAt(0) || 'A'}
               </div>
               <div className="min-w-0">
                 <p className="text-xs font-black text-white truncate">{profile.displayName || 'Admin'}</p>
                 <p className="text-[10px] font-bold text-white/40 truncate">{profile.email}</p>
               </div>
            </div>
            <button
               onClick={() => signOut(auth)}
               className="w-full flex items-center gap-3 p-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
            >
               <LogOut className="w-4 h-4" />
               Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 px-4 md:px-12 py-6 md:py-10 bg-[#f8fbfa] min-h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-[#004d39]">
              {activeTab === 'events' ? "Event Management" : "Career Database Mgr"}
            </h2>
            <p className="text-sm md:text-base text-gray-400 font-medium mt-1 italic">
              {activeTab === 'events' ? "Publish campus events and semantic matches." : "Manage global career resources for RU."}
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black transition-all shadow-lg active:scale-95 group",
              showForm ? "bg-red-500 text-white" : "bg-[#ffd700] text-[#004d39]"
            )}
          >
            {showForm ? "Close Form" : <><Plus className="w-5 h-5" /> {activeTab === 'events' ? 'New Event' : 'New Resource'}</>}
          </button>
        </header>

        {showForm && (
          <AnimatePresence>
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-12">
              {activeTab === 'events' ? (
                <form onSubmit={handlePublish} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                        <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none" placeholder="Workshop Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold">
                          <option value="General">General</option>
                          <option value="Course">Course</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Competition">Competition</option>
                          <option value="Festival">Festival</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-32 outline-none" placeholder="Event details..." />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#004d39] uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3 h-3" /> Event Venue / Location
                        </label>
                        <input required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold" placeholder="e.g. TSC / Iblis Field / Dept Room" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Date
                          </label>
                          <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Loader2 className="w-3 h-3" /> Time
                          </label>
                          <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none" />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Join Link (Optional)</label>
                      <input value={formData.joinLink} onChange={e => setFormData({...formData, joinLink: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl" placeholder="URL for registration" />
                   </div>
                   <button disabled={publishing} className="w-full py-5 bg-[#004d39] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all">
                      {publishing ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5 text-[#ffd700]" /> Publish Event Assets</>}
                   </button>
                </form>
              ) : (
                <form onSubmit={handlePublishCareer} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Title</label>
                        <input required value={careerFormData.title} onChange={e => setCareerFormData({...careerFormData, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold" placeholder="Road to BCS / Tech Guide" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                        <select value={careerFormData.category} onChange={e => setCareerFormData({...careerFormData, category: e.target.value as any})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold">
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="BCS">BCS</option>
                          <option value="Tech">Tech</option>
                          <option value="Skill">Skill</option>
                          <option value="RU Portal">RU Portal</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource URL</label>
                      <input required value={careerFormData.url} onChange={e => setCareerFormData({...careerFormData, url: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-medium" placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Summary/Guide</label>
                      <textarea required value={careerFormData.description} onChange={e => setCareerFormData({...careerFormData, description: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-24 md:h-32 outline-none font-medium text-sm leading-relaxed" placeholder="Tell students why this is important..." />
                   </div>
                   <button disabled={publishing} className="w-full py-5 bg-[#004d39] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all">
                      {publishing ? <Loader2 className="animate-spin" /> : <><Send className="w-5 h-5 text-[#ffd700]" /> Add to Career Database</>}
                   </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="space-y-8">
           {activeTab === 'events' ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-[#004d39] uppercase tracking-widest rounded-lg border border-gray-100">{event.category}</span>
                      <button onClick={() => deleteDoc(doc(db, 'events', event.id))} className="text-red-400 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-3">{event.title}</h4>
                    <p className="text-sm text-gray-500 mb-6 italic line-clamp-3">"{event.description}"</p>
                    <div className="mt-auto space-y-3 pt-6 border-t border-gray-50 text-xs font-bold text-gray-400">
                       <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#004d39]" /> {event.dateTime}</div>
                       <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#ffd700]" /> {event.venue}</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 italic">No events published.</div>}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {careerResources.map((res) => (
                   <div key={res.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#004d39] group-hover:bg-[#004d39] group-hover:text-white transition-all">
                           <Book className="w-5 h-5" />
                        </div>
                         <button onClick={() => deleteDoc(doc(db, 'careerResources', res.id!))} className="text-red-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <h4 className="font-black text-gray-900 mb-1">{res.title}</h4>
                      <span className="text-[10px] font-black text-[#004d39] uppercase tracking-widest mb-4">{res.category}</span>
                      <p className="text-xs text-gray-500 italic mb-6 line-clamp-2">"{res.description}"</p>
                      <a href={res.url} target="_blank" rel="noreferrer" className="mt-auto flex items-center gap-2 text-[10px] font-black text-[#004d39] uppercase tracking-widest hover:translate-x-1 transition-transform">
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </a>
                   </div>
                ))}
                {careerResources.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 italic">Career Database is empty.</div>}
             </div>
           )}
        </div>
      </main>
    </div>
  );
}
