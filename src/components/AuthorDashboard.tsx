import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db, OperationType, handleFirestoreError, auth } from "../lib/firebase";
import { UserProfile, Article, ClubEvent, ClubFeedItem, MediaResource } from "../types";
import { cn, cosineSimilarity } from "../lib/utils";
import { getEmbedding, analyzeStudentMatch } from "../services/geminiService";
import { CLUBS_DATA } from "../lib/clubs";
import {
  Plus,
  Send,
  Loader2,
  LogOut,
  Sparkles,
  BookOpen,
  X,
  Trash2,
  FileText,
  User,
  Menu,
  Calendar,
  MapPin,
  Target,
  DollarSign,
  Users,
  CheckCircle2,
  Megaphone,
  FileUp,
  History,
  Trophy,
  Video,
  Music,
  Globe,
  ExternalLink,
  File,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  profile: UserProfile;
  activeRoleView: "student" | "admin" | "author";
  onRoleChange: (role: "student" | "admin" | "author") => void;
}

export default function AuthorDashboard({ profile, activeRoleView, onRoleChange }: Props) {
  const [activeTab, setActiveTab] = useState<"insights" | "events" | "feeds" | "media">("insights");

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Career Suggestions",
    content: "",
    readingTime: "5 min read",
  });

  // Events state
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [publishingEvent, setPublishingEvent] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    category: "General" as ClubEvent["category"],
    venue: "",
    mentors: "",
    paymentScale: "",
    paymentDetails: "",
    skillsTargeted: "",
    date: "",
    time: "",
    whatsapp: "",
    email: "",
    joinLink: "",
    fee: "",
    duration: "",
  });

  // Club History & Feeds state
  const [feeds, setFeeds] = useState<ClubFeedItem[]>([]);
  const [publishingFeed, setPublishingFeed] = useState(false);
  const [showFeedForm, setShowFeedForm] = useState(false);
  const [feedFormData, setFeedFormData] = useState({
    clubId: "RUCC",
    type: "History" as "News" | "Event" | "History" | "Achievement" | "Ceremony" | "Update",
    title: "",
    content: "",
    date: "",
    time: "",
    link: "",
  });

  // Media resources state
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([]);
  const [publishingMedia, setPublishingMedia] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaFormData, setMediaFormData] = useState({
    title: "",
    type: "PDF" as MediaResource["type"],
    url: "",
    description: "",
  });

  useEffect(() => {
    // 1. Articles listener
    const articlesQuery = query(
      collection(db, "articles"),
      where("authorId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
    const unsubArticles = onSnapshot(
      articlesQuery,
      (snapshot) => {
        setArticles(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Article
          )
        );
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "articles")
    );

    // 2. Events listener
    const eventsQuery = query(
      collection(db, "events"),
      where("adminId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
    const unsubEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as ClubEvent
          )
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "events")
    );

    // 3. Feeds listener
    const feedsQuery = query(
      collection(db, "clubFeeds"),
      where("adminId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
    const unsubFeeds = onSnapshot(
      feedsQuery,
      (snapshot) => {
        setFeeds(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as ClubFeedItem
          )
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "clubFeeds")
    );

    // 4. Media listener
    const mediaQuery = query(
      collection(db, "mediaResources"),
      where("authorId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
    const unsubMedia = onSnapshot(
      mediaQuery,
      (snapshot) => {
        setMediaResources(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as MediaResource
          )
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "mediaResources")
    );

    return () => {
      unsubArticles();
      unsubEvents();
      unsubFeeds();
      unsubMedia();
    };
  }, [profile.uid]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;
    setPublishing(true);
    try {
      const articleData = {
        title: formData.title,
        category: formData.category,
        content: formData.content,
        readingTime: formData.readingTime,
        authorId: profile.uid,
        authorName: profile.displayName || profile.email || "Author Authority",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "articles"), articleData);

      setFormData({
        title: "",
        category: "Career Suggestions",
        content: "",
        readingTime: "5 min read",
      });
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "articles");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to retract this article?")) return;
    try {
      await deleteDoc(doc(db, "articles", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `articles/${id}`);
    }
  };

  // Event handlers
  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title || !eventFormData.description) return;
    setPublishingEvent(true);
    try {
      const eventContent = `${eventFormData.title} ${eventFormData.description} ${eventFormData.skillsTargeted} ${eventFormData.category} ${eventFormData.mentors} ${eventFormData.fee} ${eventFormData.duration}`;
      const vector = await getEmbedding(eventContent);

      const formattedDateTime = `${eventFormData.date} at ${eventFormData.time}`;

      const eventData = {
        title: eventFormData.title,
        description: eventFormData.description,
        category: eventFormData.category,
        venue: eventFormData.venue,
        mentors: eventFormData.mentors,
        paymentScale: eventFormData.paymentScale,
        paymentDetails: eventFormData.paymentDetails,
        skillsTargeted: eventFormData.skillsTargeted,
        dateTime: formattedDateTime,
        date: eventFormData.date,
        time: eventFormData.time,
        duration: eventFormData.duration,
        fee: eventFormData.fee,
        contact: {
          whatsapp: eventFormData.whatsapp,
          email: eventFormData.email,
          joinLink: eventFormData.joinLink,
        },
        adminId: profile.uid,
        adminName: profile.displayName || profile.email || "Author Authority",
        eventVector: vector,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "events"), eventData);

      await runMatchingProcess(
        { id: docRef.id, ...eventData } as ClubEvent,
        vector
      );

      setEventFormData({
        title: "",
        description: "",
        category: "General",
        venue: "",
        mentors: "",
        paymentScale: "",
        paymentDetails: "",
        skillsTargeted: "",
        date: "",
        time: "",
        whatsapp: "",
        email: "",
        joinLink: "",
        fee: "",
        duration: "",
      });
      setShowEventForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "events");
    } finally {
      setPublishingEvent(false);
    }
  };

  const runMatchingProcess = async (
    event: ClubEvent,
    eventVector: number[],
  ) => {
    try {
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student"),
        where("onboardingComplete", "==", true),
      );
      const studentSnapShort = await getDocs(studentsQuery);

      const matchPromises = studentSnapShort.docs.map(async (studentDoc) => {
        const studentData = studentDoc.data() as UserProfile;
        if (!studentData.dnaVector) return;

        const similarity = cosineSimilarity(eventVector, studentData.dnaVector);
        if (similarity >= 0.9) {
          const dnaString = JSON.stringify(studentData.studentDNA);
          const eventString = `${event.title}: ${event.description}`;
          const explanation = await analyzeStudentMatch(dnaString, eventString);

          await addDoc(collection(db, "notifications"), {
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

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to retract this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  // Feed handlers
  const handlePublishFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedFormData.title || !feedFormData.content) return;
    setPublishingFeed(true);
    try {
      const feedData = {
        clubId: feedFormData.clubId,
        type: feedFormData.type.toLowerCase(),
        title: `[${feedFormData.clubId}] ${feedFormData.title}`,
        content: feedFormData.content,
        date: feedFormData.date || "",
        time: feedFormData.time || "",
        link: feedFormData.link || "",
        adminId: profile.uid,
        adminName: profile.displayName || profile.email || "Author Authority",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "clubFeeds"), feedData);

      setFeedFormData({
        clubId: "RUCC",
        type: "History",
        title: "",
        content: "",
        date: "",
        time: "",
        link: "",
      });
      setShowFeedForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "clubFeeds");
    } finally {
      setPublishingFeed(false);
    }
  };

  const handleDeleteFeed = async (id: string) => {
    if (!confirm("Are you sure you want to delete this club feed post?")) return;
    try {
      await deleteDoc(doc(db, "clubFeeds", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clubFeeds/${id}`);
    }
  };

  // Media handlers
  const handlePublishMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFormData.title || !mediaFormData.url) return;
    setPublishingMedia(true);
    try {
      const mediaData = {
        title: mediaFormData.title,
        type: mediaFormData.type,
        url: mediaFormData.url,
        description: mediaFormData.description || "",
        authorId: profile.uid,
        authorName: profile.displayName || profile.email || "Author Authority",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "mediaResources"), mediaData);

      setMediaFormData({
        title: "",
        type: "PDF",
        url: "",
        description: "",
      });
      setShowMediaForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "mediaResources");
    } finally {
      setPublishingMedia(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to remove this media resource?")) return;
    try {
      await deleteDoc(doc(db, "mediaResources", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mediaResources/${id}`);
    }
  };

  const categories = [
    "Career Suggestions",
    "Research & Publications",
    "Department Hacks",
    "Skill Development Tips",
    "Campus Resources",
    "General Guidance",
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col md:flex-row selection:bg-[#ffd700] selection:text-[#004d39]">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#006a4e] rounded-lg flex items-center justify-center">
            <BookOpen className="text-[#ffd700] w-5 h-5" />
          </div>
          <span className="font-display font-black text-lg text-[#006a4e]">
            RU Author
          </span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-0 z-50 bg-[#006a4e] md:static md:w-72 md:flex flex-col md:h-screen transition-transform duration-300 md:translate-x-0 h-full",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-8 h-full flex flex-col justify-between">
          <div>
            <div className="hidden md:flex items-center gap-3 mb-10 text-white">
              <div className="w-10 h-10 bg-[#ffd700] rounded-xl flex items-center justify-center shadow-lg transform rotate-6">
                <BookOpen className="text-[#006a4e] w-6 h-6" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">
                RU Insights
              </h1>
            </div>

            {/* Switch activeView session role */}
            <div className="mb-8">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-3">
                Active Session View
              </span>
              <div className="space-y-2 bg-black/10 p-3 rounded-2xl border border-white/5">
                <button
                  onClick={() => {
                    onRoleChange("student");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-left transition-all",
                    activeRoleView === "student"
                      ? "bg-[#ffd700] text-[#006a4e]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  🎓 View as Student
                </button>
                <button
                  onClick={() => {
                    onRoleChange("admin");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-left transition-all",
                    activeRoleView === "admin"
                      ? "bg-[#ffd700] text-[#006a4e]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  🏛️ View as Club Admin
                </button>
                <button
                  onClick={() => {
                    onRoleChange("author");
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-left transition-all",
                    activeRoleView === "author"
                      ? "bg-[#ffd700] text-[#006a4e]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  ✍️ View as Author
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab("insights");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-left",
                  activeTab === "insights"
                    ? "bg-[#ffd700] text-[#006a4e] shadow-lg"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <FileText className="w-5 h-5" />
                Insights Studio
              </button>
              <button
                onClick={() => {
                  setActiveTab("events");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-left",
                  activeTab === "events"
                    ? "bg-[#ffd700] text-[#006a4e] shadow-lg"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Calendar className="w-5 h-5" />
                Campus Event Creator
              </button>
              <button
                onClick={() => {
                  setActiveTab("feeds");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-left",
                  activeTab === "feeds"
                    ? "bg-[#ffd700] text-[#006a4e] shadow-lg"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Megaphone className="w-5 h-5" />
                Club History & Feeds
              </button>
              <button
                onClick={() => {
                  setActiveTab("media");
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-left",
                  activeTab === "media"
                    ? "bg-[#ffd700] text-[#006a4e] shadow-lg"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <FileUp className="w-5 h-5" />
                Media Resource Hub
              </button>
            </div>
          </div>

          <div className="px-4 py-8 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-[#ffd700] font-black">
                {profile.displayName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">
                  {profile.displayName || "Author"}
                </p>
                <p className="text-[10px] font-bold text-white/40 truncate">
                  {profile.email}
                </p>
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
      <main className="flex-1 px-4 md:px-12 py-6 md:py-10 bg-[#fbfcfb] min-h-screen overflow-y-auto">
        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
             <h3 className="font-black text-gray-900 text-lg">Create Content</h3>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => { setActiveTab("events"); setShowEventForm(true); }} className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs">New Event</button>
               <button onClick={() => { setActiveTab("insights"); setShowForm(true); }} className="p-4 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs">New Insight</button>
             </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
             <h3 className="font-black text-gray-900 text-lg">Club Feed & Media</h3>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => { setActiveTab("feeds"); setShowFeedForm(true); }} className="p-4 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs">Feed Achievement</button>
               <button onClick={() => { setActiveTab("media"); setShowMediaForm(true); }} className="p-4 bg-purple-50 text-purple-700 rounded-xl font-bold text-xs">Add Media File</button>
             </div>
          </div>
        </div>

        {/* INSIGHTS TAB FORM */}
        {activeTab === "insights" && showForm && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12"
            >
              <form
                onSubmit={handlePublish}
                className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Article Title
                    </label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-900 text-sm shadow-inner"
                      placeholder="e.g. How to get Research Internships from RU"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Reading Time
                      </label>
                      <input
                        required
                        value={formData.readingTime}
                        onChange={(e) =>
                          setFormData({ ...formData, readingTime: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                        placeholder="e.g. 5 min read"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Content Body (Markdown Supported)
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-64 outline-none font-medium text-gray-800 text-sm shadow-inner"
                    placeholder="Write your article guidance here..."
                  />
                </div>

                <button
                  disabled={publishing}
                  className="w-full py-5 bg-[#006a4e] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all hover:bg-[#004d39]"
                >
                  {publishing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#ffd700]" /> Publish Article Node
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}

        {/* EVENTS TAB FORM */}
        {activeTab === "events" && showEventForm && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12"
            >
              <form
                onSubmit={handlePublishEvent}
                className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Event Title
                    </label>
                    <input
                      required
                      value={eventFormData.title}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, title: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-900 text-sm shadow-inner"
                      placeholder="e.g. Competitive Programming Bootcamp"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Target Audience / Skills Targeted (Comma separated)
                    </label>
                    <input
                      required
                      value={eventFormData.skillsTargeted}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, skillsTargeted: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-900 text-sm shadow-inner"
                      placeholder="e.g. C++, Algorithms, Problem Solving, Data Structures"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Classification
                    </label>
                    <select
                      value={eventFormData.category}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, category: e.target.value as any })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Contest">Contest / Competition</option>
                      <option value="Recruitment">Recruitment / Intake</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Venue
                    </label>
                    <input
                      required
                      value={eventFormData.venue}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, venue: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. Department Lab, Kazi Nazrul Auditorium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Mentors / Conductors
                    </label>
                    <input
                      value={eventFormData.mentors}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, mentors: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. Dr. Sayeed, Google Engineer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={eventFormData.date}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, date: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Time
                    </label>
                    <input
                      type="time"
                      required
                      value={eventFormData.time}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, time: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Duration
                    </label>
                    <input
                      value={eventFormData.duration}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, duration: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. 2 Hours"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Registration Fee
                    </label>
                    <input
                      value={eventFormData.fee}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, fee: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. Free, 50 BDT"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Registration / Join Link
                    </label>
                    <input
                      value={eventFormData.joinLink}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, joinLink: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. https://forms.gle/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      WhatsApp Group Link (Optional)
                    </label>
                    <input
                      value={eventFormData.whatsapp}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, whatsapp: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. https://chat.whatsapp.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Inquiry Email
                    </label>
                    <input
                      type="email"
                      value={eventFormData.email}
                      onChange={(e) =>
                        setEventFormData({ ...eventFormData, email: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. club@ru.ac.bd"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Event Description & Benefits
                  </label>
                  <textarea
                    required
                    value={eventFormData.description}
                    onChange={(e) =>
                      setEventFormData({ ...eventFormData, description: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-32 outline-none font-medium text-gray-800 text-sm shadow-inner"
                    placeholder="Give deep insights on what students will learn, rules of the competition, certificate details..."
                  />
                </div>

                <button
                  disabled={publishingEvent}
                  className="w-full py-5 bg-[#006a4e] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all hover:bg-[#004d39]"
                >
                  {publishingEvent ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#ffd700]" /> Match & Publish Event
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}

        {/* CLUB FEEDS TAB FORM */}
        {activeTab === "feeds" && showFeedForm && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12"
            >
              <form
                onSubmit={handlePublishFeed}
                className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Select Target Club Node
                    </label>
                    <select
                      value={feedFormData.clubId}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, clubId: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm"
                    >
                      {CLUBS_DATA.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name} ({club.id})
                        </option>
                      ))}
                      <option value="general">Campus-wide / General Feed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Classification Type
                    </label>
                    <select
                      value={feedFormData.type}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, type: e.target.value as any })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm"
                    >
                      <option value="History">Club History</option>
                      <option value="Achievement">Club Achievement</option>
                      <option value="Ceremony">Ceremony / Gala</option>
                      <option value="Update">Club Updates</option>
                      <option value="News">News Update</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Title of the Post
                    </label>
                    <input
                      required
                      value={feedFormData.title}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, title: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-900 text-sm shadow-inner"
                      placeholder="e.g. 10 Years of Excellence, Champion in IUPC 2026"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Reference Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={feedFormData.date}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, date: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Reference Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={feedFormData.time}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, time: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      External URL / Link (Optional)
                    </label>
                    <input
                      value={feedFormData.link}
                      onChange={(e) =>
                        setFeedFormData({ ...feedFormData, link: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. https://facebook.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Content / Feed Story
                  </label>
                  <textarea
                    required
                    value={feedFormData.content}
                    onChange={(e) =>
                      setFeedFormData({ ...feedFormData, content: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-44 outline-none font-medium text-gray-800 text-sm shadow-inner"
                    placeholder="Write detailed club news, histories, accomplishments, or update points..."
                  />
                </div>

                <button
                  disabled={publishingFeed}
                  className="w-full py-5 bg-[#006a4e] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all hover:bg-[#004d39]"
                >
                  {publishingFeed ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#ffd700]" /> Publish Club Feed Node
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}

        {/* MEDIA RESOURCE TAB FORM */}
        {activeTab === "media" && showMediaForm && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12"
            >
              <form
                onSubmit={handlePublishMedia}
                className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Resource Title
                    </label>
                    <input
                      required
                      value={mediaFormData.title}
                      onChange={(e) =>
                        setMediaFormData({ ...mediaFormData, title: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-900 text-sm shadow-inner"
                      placeholder="e.g. RU CSE 3rd Year Exam Prep Guide"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Resource Type
                    </label>
                    <select
                      value={mediaFormData.type}
                      onChange={(e) =>
                        setMediaFormData({ ...mediaFormData, type: e.target.value as any })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-800 text-sm"
                    >
                      <option value="PDF">PDF Document</option>
                      <option value="Word">Word File</option>
                      <option value="Video">Video Lecture / Video Link</option>
                      <option value="Audio">Audio Resource</option>
                      <option value="Website">Website Link / API</option>
                      <option value="Other">Other File / Resource</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Resource URL / Download Link
                    </label>
                    <input
                      required
                      value={mediaFormData.url}
                      onChange={(e) =>
                        setMediaFormData({ ...mediaFormData, url: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#006a4e] outline-none font-bold text-gray-800 text-sm shadow-inner"
                      placeholder="e.g. https://drive.google.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Brief Description
                  </label>
                  <textarea
                    value={mediaFormData.description}
                    onChange={(e) =>
                      setMediaFormData({ ...mediaFormData, description: e.target.value })
                    }
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-24 outline-none font-medium text-gray-800 text-sm shadow-inner"
                    placeholder="Provide overview details about this resource. e.g. Subject code, chapter names, useful links..."
                  />
                </div>

                <button
                  disabled={publishingMedia}
                  className="w-full py-5 bg-[#006a4e] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all hover:bg-[#004d39]"
                >
                  {publishingMedia ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#ffd700]" /> Publish Media Resource
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>
        )}


        {/* LIST RENDERERS */}

        {/* INSIGHTS TAB LIST */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffd700] fill-current" />
              Your Published Articles ({articles.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#006a4e]" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 space-y-3">
                <p className="text-gray-400 font-bold">No articles published yet.</p>
                <p className="text-xs text-gray-300">Click "Write Insight Article" to broadcast your first campus guide.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative group hover:border-[#006a4e]/20 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="px-3 py-1 bg-blue-50 text-[#006a4e] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                          {article.category}
                        </span>
                        <h4 className="text-xl font-black text-gray-900 mt-3 group-hover:text-[#006a4e] transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs font-bold text-gray-400 mt-1">
                          By {article.authorName} • {article.readingTime}
                        </p>
                      </div>

                      <button
                        onClick={() => article.id && handleDelete(article.id)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line border-t pt-4">
                      {article.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB LIST */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffd700] fill-current" />
              Your Created Events ({events.length})
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 space-y-3">
                <p className="text-gray-400 font-bold">No events created yet.</p>
                <p className="text-xs text-gray-300">Click "Create New Event" to launch a campaign match.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group hover:border-[#006a4e]/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                          {event.category}
                        </span>
                        <button
                          onClick={() => event.id && handleDeleteEvent(event.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-[#006a4e] transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-semibold mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {event.venue}
                      </p>
                      <p className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {event.dateTime}
                      </p>
                      <p className="text-xs font-bold text-[#006a4e] mt-3 uppercase tracking-wider">
                        Skills: {event.skillsTargeted}
                      </p>
                      <p className="text-xs text-gray-600 font-medium mt-3 border-t pt-3 line-clamp-3">
                        {event.description}
                      </p>
                    </div>

                    {event.contact?.joinLink && (
                      <a
                        href={event.contact.joinLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs text-gray-700 transition-all border border-gray-100"
                      >
                        Join / Register <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDS TAB LIST */}
        {activeTab === "feeds" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffd700] fill-current" />
              Your Published Club Feeds ({feeds.length})
            </h3>

            {feeds.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 space-y-3">
                <p className="text-gray-400 font-bold">No feed posts published yet.</p>
                <p className="text-xs text-gray-300">Click "Post to Club Feed" to broadcast history, achievements, and updates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group hover:border-[#006a4e]/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-[#006a4e] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                            {feed.clubId}
                          </span>
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                            {feed.type}
                          </span>
                        </div>
                        <button
                          onClick={() => feed.id && handleDeleteFeed(feed.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-lg font-extrabold text-gray-900 group-hover:text-[#006a4e] transition-colors">
                        {feed.title}
                      </h4>
                      {feed.date && (
                        <p className="text-xs text-gray-400 font-bold mt-2">
                          Reference Date: {feed.date} {feed.time && `at ${feed.time}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 font-medium mt-3 border-t pt-3 whitespace-pre-line">
                        {feed.content}
                      </p>
                    </div>

                    {feed.link && (
                      <a
                        href={feed.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold text-xs text-gray-700 transition-all border border-gray-100"
                      >
                        Reference Link <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEDIA RESOURCE LIST */}
        {activeTab === "media" && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffd700] fill-current" />
              Your Published Media Resources ({mediaResources.length})
            </h3>

            {mediaResources.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 space-y-3">
                <p className="text-gray-400 font-bold">No media resources uploaded yet.</p>
                <p className="text-xs text-gray-300">Click "Add Media Resource" to post a PDF, video, audio, website link, or word doc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mediaResources.map((res) => (
                  <div
                    key={res.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group hover:border-[#006a4e]/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1.5",
                          res.type === "PDF" && "bg-red-50 text-red-700 border-red-100",
                          res.type === "Word" && "bg-blue-50 text-blue-700 border-blue-100",
                          res.type === "Video" && "bg-amber-50 text-amber-700 border-amber-100",
                          res.type === "Audio" && "bg-purple-50 text-purple-700 border-purple-100",
                          res.type === "Website" && "bg-blue-50 text-blue-700 border-blue-100",
                          res.type === "Other" && "bg-gray-50 text-gray-700 border-gray-100"
                        )}>
                          {res.type === "PDF" && <File className="w-3 h-3" />}
                          {res.type === "Word" && <File className="w-3 h-3" />}
                          {res.type === "Video" && <Video className="w-3 h-3" />}
                          {res.type === "Audio" && <Music className="w-3 h-3" />}
                          {res.type === "Website" && <Globe className="w-3 h-3" />}
                          {res.type === "Other" && <File className="w-3 h-3" />}
                          {res.type}
                        </span>
                        <button
                          onClick={() => res.id && handleDeleteMedia(res.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-base font-extrabold text-gray-900 group-hover:text-[#006a4e] transition-colors leading-snug">
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-xs text-gray-500 font-semibold mt-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                          {res.description}
                        </p>
                      )}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 flex items-center justify-center gap-2 p-3 bg-[#006a4e]/5 hover:bg-[#006a4e] text-[#006a4e] hover:text-white rounded-xl font-bold text-xs transition-all border border-[#006a4e]/10"
                    >
                      Open Resource <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
