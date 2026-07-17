import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, OperationType, handleFirestoreError, auth } from "../lib/firebase";
import { UserProfile, ClubEvent, StudentDNA, ClubFeedItem } from "../types";
import { getEmbedding, analyzeStudentMatch } from "../services/geminiService";
import { cn, cosineSimilarity } from "../lib/utils";
import {
  Plus,
  Send,
  Calendar,
  MapPin,
  Target,
  MessageSquare,
  Loader2,
  LogOut,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Users,
  GraduationCap,
  LayoutDashboard,
  X,
  Rocket,
  Book,
  Menu,
  ExternalLink,
  Trash2,
  Megaphone,
  FileText,
  Globe,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { CareerResource } from "../types";
import { CLUBS_DATA, UniversityClub } from "../lib/clubs";

interface Props {
  profile: UserProfile;
  activeRoleView?: "student" | "admin" | "author";
  onRoleChange?: (role: "student" | "admin" | "author") => void;
}

export default function AdminDashboard({ profile, activeRoleView, onRoleChange }: Props) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);
  const [clubFeedItems, setClubFeedItems] = useState<ClubFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "clubs" | "career">(
    "events",
  );

  // Scoped states for club feeds
  const [clubSearchQuery, setClubSearchQuery] = useState("");
  const [selectedClubCategory, setSelectedClubCategory] =
    useState<string>("All");
  const [activeClubFeedFormId, setActiveClubFeedFormId] = useState<
    string | null
  >(null);
  const [publishingClubFeed, setPublishingClubFeed] = useState<string | null>(
    null,
  );
  const [clubFeedData, setClubFeedData] = useState({
    title: "",
    description: "",
    type: "News" as "News" | "Event" | "History" | "Achievement" | "Ceremony" | "Update",
    venue: "",
    date: "",
    time: "",
    joinLink: "",
  });

  const [formData, setFormData] = useState({
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

  const [careerFormData, setCareerFormData] = useState<
    Omit<CareerResource, "id">
  >({
    title: "",
    category: "Skill",
    url: "",
    description: "",
  });

  useEffect(() => {
    const eventsQuery = query(
      collection(db, "events"),
      where("adminId", "==", profile.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as ClubEvent,
          ),
        );
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "events"),
    );

    const careerQuery = query(
      collection(db, "careerResources"),
      orderBy("title", "asc"),
    );
    const unsubCareer = onSnapshot(
      careerQuery,
      (snapshot) => {
        setCareerResources(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CareerResource,
          ),
        );
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, "careerResources"),
    );

    const feedsQuery = query(
      collection(db, "clubFeeds"),
      orderBy("createdAt", "desc"),
    );
    const unsubFeeds = onSnapshot(
      feedsQuery,
      (snapshot) => {
        setClubFeedItems(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as ClubFeedItem,
          ),
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "clubFeeds"),
    );

    return () => {
      unsubEvents();
      unsubCareer();
      unsubFeeds();
    };
  }, [profile.uid]);

  const handlePublishCareer = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await addDoc(collection(db, "careerResources"), {
        ...careerFormData,
        createdAt: serverTimestamp(),
      });
      setCareerFormData({
        title: "",
        category: "Skill",
        url: "",
        description: "",
      });
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "careerResources");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const eventContent = `${formData.title} ${formData.description} ${formData.skillsTargeted} ${formData.category} ${formData.mentors} ${formData.fee} ${formData.duration}`;
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
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        fee: formData.fee,
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

      const docRef = await addDoc(collection(db, "events"), eventData);

      // TRIGGER MATCHING LOGIC (90% Similarity)
      await runMatchingProcess(
        { id: docRef.id, ...eventData } as ClubEvent,
        vector,
      );

      setFormData({
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
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "events");
    } finally {
      setPublishing(false);
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
          // AI explanation
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

  const handlePublishClubFeed = async (clubId: string) => {
    if (!clubFeedData.title || !clubFeedData.description) return;
    setPublishingClubFeed(clubId);
    try {
      await addDoc(collection(db, "clubFeeds"), {
        clubId,
        type: clubFeedData.type.toLowerCase(),
        title: clubFeedData.title,
        content: clubFeedData.description,
        date: clubFeedData.date || "",
        time: clubFeedData.time || "",
        link: clubFeedData.joinLink || "",
        adminId: profile.uid,
        adminName: profile.displayName || profile.email || "Admin Authority",
        createdAt: serverTimestamp(),
      });
      setClubFeedData({
        title: "",
        description: "",
        type: "News",
        venue: "",
        date: "",
        time: "",
        joinLink: "",
      });
      setActiveClubFeedFormId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "clubFeeds");
    } finally {
      setPublishingClubFeed(null);
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
          <span className="font-display font-black text-lg text-[#004d39]">
            RU Admin
          </span>
        </div>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-0 z-50 bg-[#004d39] md:static md:w-72 md:flex flex-col md:h-screen transition-transform duration-300 md:translate-x-0 h-full",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10 text-white">
            <div className="w-10 h-10 bg-[#ffd700] rounded-xl flex items-center justify-center shadow-lg transform rotate-6">
              <Target className="text-[#004d39] w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">
              Pathfinder Admin
            </h1>
          </div>

          {activeRoleView && onRoleChange && (
            <div className="mb-6 bg-black/10 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">
                Active Session View
              </span>
              <div className="space-y-1.5">
                <button
                  onClick={() => onRoleChange("student")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "student"
                      ? "bg-[#ffd700] text-[#004d39]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  🎓 View as Student
                </button>
                <button
                  onClick={() => onRoleChange("admin")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "admin"
                      ? "bg-[#ffd700] text-[#004d39]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  🏛️ View as Club Admin
                </button>
                <button
                  onClick={() => onRoleChange("author")}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all",
                    activeRoleView === "author"
                      ? "bg-[#ffd700] text-[#004d39]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  ✍️ View as Author
                </button>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {[
              {
                id: "events",
                icon: <Calendar className="w-5 h-5" />,
                label: "Events Mgr",
              },
              {
                id: "clubs",
                icon: <Users className="w-5 h-5" />,
                label: "Clubs Portal",
              },
              {
                id: "career",
                icon: <Book className="w-5 h-5" />,
                label: "Career DB",
              },
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
                    : "text-white/40 hover:bg-white/10 hover:text-white",
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
                {profile.displayName?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">
                  {profile.displayName || "Admin"}
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
      <main className="flex-1 px-4 md:px-12 py-6 md:py-10 bg-[#f8fbfa] min-h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-[#004d39]">
              {activeTab === "events"
                ? "Event Management"
                : activeTab === "clubs"
                  ? "Club Feeds Portal"
                  : "Career Database Mgr"}
            </h2>
            <p className="text-sm md:text-base text-gray-400 font-medium mt-1 italic">
              {activeTab === "events"
                ? "Publish campus events and semantic matches."
                : activeTab === "clubs"
                  ? "Feed news or events directly underneath each individual club."
                  : "Manage global career resources for RU."}
            </p>
          </div>

          {activeTab !== "clubs" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={cn(
                "flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-black transition-all shadow-lg active:scale-95 group",
                showForm
                  ? "bg-[#e11d48] text-white"
                  : "bg-[#ffd700] text-[#004d39]",
              )}
            >
              {showForm ? (
                "Close Form"
              ) : (
                <>
                  <Plus className="w-5 h-5" />{" "}
                  {activeTab === "events" ? "New Event" : "New Resource"}
                </>
              )}
            </button>
          )}
        </header>

        {showForm && (
          <AnimatePresence>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12"
            >
              {activeTab === "events" ? (
                <form
                  onSubmit={handlePublish}
                  className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Title
                      </label>
                      <input
                        required
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none"
                        placeholder="Workshop Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                      >
                        <option value="General">General</option>
                        <option value="Course">Course</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Competition">Competition</option>
                        <option value="Festival">Festival</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-32 outline-none focus:bg-white focus:border-[#004d39]"
                      placeholder="Event details..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Mentor / Speaker Name
                      </label>
                      <input
                        required
                        value={formData.mentors}
                        onChange={(e) =>
                          setFormData({ ...formData, mentors: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. Dr. John Doe / Alumni Expert"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Registration Fee
                      </label>
                      <input
                        required
                        value={formData.fee}
                        onChange={(e) =>
                          setFormData({ ...formData, fee: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. Free / 100 BDT"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Duration
                      </label>
                      <input
                        required
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. 2 Hours / 3 Days"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Skills Targeted
                      </label>
                      <input
                        required
                        value={formData.skillsTargeted}
                        onChange={(e) =>
                          setFormData({ ...formData, skillsTargeted: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. Public Speaking, Coding"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Contact WhatsApp (Optional)
                      </label>
                      <input
                        value={formData.whatsapp}
                        onChange={(e) =>
                          setFormData({ ...formData, whatsapp: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. 01712345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Contact Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. admin@club.ru.ac.bd"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#004d39] uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Event Venue / Location
                      </label>
                      <input
                        required
                        value={formData.venue}
                        onChange={(e) =>
                          setFormData({ ...formData, venue: e.target.value })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="e.g. TSC / Iblis Field / Dept Room"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Date
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Loader2 className="w-3 h-3" /> Time
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.time}
                          onChange={(e) =>
                            setFormData({ ...formData, time: e.target.value })
                          }
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Join/Registration Link (Optional)
                    </label>
                    <input
                      value={formData.joinLink}
                      onChange={(e) =>
                        setFormData({ ...formData, joinLink: e.target.value })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                      placeholder="URL for registration"
                    />
                  </div>
                  <button
                    disabled={publishing}
                    className="w-full py-5 bg-[#004d39] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all"
                  >
                    {publishing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 text-[#ffd700]" /> Publish
                        Event Assets
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handlePublishCareer}
                  className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Resource Title
                      </label>
                      <input
                        required
                        value={careerFormData.title}
                        onChange={(e) =>
                          setCareerFormData({
                            ...careerFormData,
                            title: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-bold"
                        placeholder="Road to BCS / Tech Guide"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Category
                      </label>
                      <select
                        value={careerFormData.category}
                        onChange={(e) =>
                          setCareerFormData({
                            ...careerFormData,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold"
                      >
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="BCS">BCS</option>
                        <option value="Tech">Tech</option>
                        <option value="Skill">Skill</option>
                        <option value="RU Portal">RU Portal</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Resource URL
                    </label>
                    <input
                      required
                      value={careerFormData.url}
                      onChange={(e) =>
                        setCareerFormData({
                          ...careerFormData,
                          url: e.target.value,
                        })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none font-medium"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Summary/Guide
                    </label>
                    <textarea
                      required
                      value={careerFormData.description}
                      onChange={(e) =>
                        setCareerFormData({
                          ...careerFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl h-24 md:h-32 outline-none font-medium text-sm leading-relaxed"
                      placeholder="Tell students why this is important..."
                    />
                  </div>
                  <button
                    disabled={publishing}
                    className="w-full py-5 bg-[#004d39] text-white rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all"
                  >
                    {publishing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 text-[#ffd700]" /> Add to
                        Career Database
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="space-y-8">
          {activeTab === "events" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-[#004d39] uppercase tracking-widest rounded-lg border border-gray-100">
                      {event.category}
                    </span>
                    <button
                      onClick={() => deleteDoc(doc(db, "events", event.id))}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <h4 className="text-xl md:text-2xl font-black text-gray-900 mb-3">
                    {event.title}
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 italic line-clamp-3">
                    "{event.description}"
                  </p>
                  <div className="mt-auto space-y-3 pt-6 border-t border-gray-50 text-xs font-bold text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#004d39]" />{" "}
                      {event.dateTime}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#ffd700]" />{" "}
                      {event.venue}
                    </div>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 italic">
                  No events published.
                </div>
              )}
            </div>
          ) : activeTab === "clubs" ? (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search 35 official RU Clubs..."
                    value={clubSearchQuery}
                    onChange={(e) => setClubSearchQuery(e.target.value)}
                    className="w-full pl-6 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#004d39] outline-none text-sm font-semibold"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "All",
                    "Career & Business",
                    "Science & Academic",
                    "Culture & Arts",
                    "Social & Service",
                    "Media & Leisure",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedClubCategory(cat)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl transition-all border",
                        selectedClubCategory === cat
                          ? "bg-[#004d39] text-white border-[#004d39]"
                          : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clubs Cards */}
              <div className="grid grid-cols-1 gap-6">
                {CLUBS_DATA.filter((c) => {
                  const matchesSearch =
                    c.name
                      .toLowerCase()
                      .includes(clubSearchQuery.toLowerCase()) ||
                    c.id.toLowerCase().includes(clubSearchQuery.toLowerCase());
                  const matchesCat =
                    selectedClubCategory === "All" ||
                    c.category === selectedClubCategory;
                  return matchesSearch && matchesCat;
                }).map((club) => {
                  const isFormActive = activeClubFeedFormId === club.id;
                  const clubAnnouncements = clubFeedItems.filter(
                    (f) => f.clubId === club.id,
                  );

                  return (
                    <div
                      key={club.id}
                      className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100/50 pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href={club.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#004d39] hover:underline font-black text-xl flex items-center gap-2"
                            >
                              {club.name} ({club.id})
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                            <span className="px-2 py-0.5 bg-emerald-50 text-[9px] font-black text-[#004d39] uppercase tracking-widest rounded border border-emerald-100">
                              {club.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                            {club.description}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            if (isFormActive) {
                              setActiveClubFeedFormId(null);
                            } else {
                              setActiveClubFeedFormId(club.id);
                              setClubFeedData({
                                title: "",
                                description: "",
                                type: "News",
                                venue: "",
                                date: "",
                                time: "",
                                joinLink: "",
                              });
                            }
                          }}
                          className={cn(
                            "px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 md:w-auto w-full",
                            isFormActive
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-[#004d39] text-white hover:bg-[#003c2c]",
                          )}
                        >
                          {isFormActive
                            ? "Close Feed Panel"
                            : "Feed Event / News"}
                        </button>
                      </div>

                      {/* Input Form Below Club Name */}
                      {isFormActive && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await handlePublishClubFeed(club.id);
                          }}
                          className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4 shadow-inner"
                        >
                          <div className="flex items-center gap-2 text-[#004d39]">
                            <Sparkles className="w-4 h-4 text-[#ffd700] fill-[#ffd700]" />
                            <span className="font-display font-black text-xs uppercase tracking-widest">
                              Feed Broadcast to {club.id} Node
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                Title
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. Weekly Workshop, Recruitment Notice 2026"
                                value={clubFeedData.title}
                                onChange={(e) =>
                                  setClubFeedData({
                                    ...clubFeedData,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                Classification
                              </label>
                              <select
                                value={clubFeedData.type}
                                onChange={(e) =>
                                  setClubFeedData({
                                    ...clubFeedData,
                                    type: e.target.value as any,
                                  })
                                }
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                              >
                                <option value="News">News Update</option>
                                <option value="Event">Upcoming Event</option>
                                <option value="History">Club History</option>
                                <option value="Achievement">Club Achievement</option>
                                <option value="Ceremony">Ceremony / Gala</option>
                                <option value="Update">Club Updates</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              Content Description
                            </label>
                            <textarea
                              required
                              placeholder="Write news highlights, agenda points, or guidelines..."
                              value={clubFeedData.description}
                              onChange={(e) =>
                                setClubFeedData({
                                  ...clubFeedData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none text-xs font-medium h-24"
                            />
                          </div>

                          {clubFeedData.type === "Event" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  Venue
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. TSC Auditoriums, Online Zoom"
                                  value={clubFeedData.venue}
                                  onChange={(e) =>
                                    setClubFeedData({
                                      ...clubFeedData,
                                      venue: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  Event Date
                                </label>
                                <input
                                  type="date"
                                  value={clubFeedData.date}
                                  onChange={(e) =>
                                    setClubFeedData({
                                      ...clubFeedData,
                                      date: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  Event Time
                                </label>
                                <input
                                  type="time"
                                  value={clubFeedData.time}
                                  onChange={(e) =>
                                    setClubFeedData({
                                      ...clubFeedData,
                                      time: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#004d39]"
                                />
                              </div>
                              <div className="space-y-1 md:col-span-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                  Form URL / Join link (Optional)
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={clubFeedData.joinLink}
                                  onChange={(e) =>
                                    setClubFeedData({
                                      ...clubFeedData,
                                      joinLink: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs"
                                />
                              </div>
                            </div>
                          )}

                          <button
                            disabled={publishingClubFeed === club.id}
                            type="submit"
                            className="w-full py-4 bg-[#004d39] hover:bg-[#003c2b] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                          >
                            {publishingClubFeed === club.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-4 h-4 text-[#ffd700]" />
                                Publish to {club.id} Feed
                              </>
                            )}
                          </button>
                        </form>
                      )}

                      {/* Feed Registry Lists */}
                      {clubAnnouncements.length > 0 ? (
                        <div className="space-y-3 pt-2">
                          <span className="text-[10px] font-black text-[#004d39] uppercase tracking-widest block">
                            Active Feeds & Announcements (
                            {clubAnnouncements.length})
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clubAnnouncements.map((feed) => (
                              <div
                                key={feed.id}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                                        (feed as any).clubPostType === "Event"
                                          ? "bg-amber-50 text-amber-700 border-amber-100"
                                          : "bg-blue-50 text-blue-700 border-blue-100",
                                      )}
                                    >
                                      {(feed as any).clubPostType || "News"}
                                    </span>
                                    <button
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            `Delete this announcement: "${feed.title}"?`,
                                          )
                                        ) {
                                          await deleteDoc(
                                            doc(db, "events", feed.id),
                                          );
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <h5 className="font-black text-gray-900 text-sm leading-tight mb-1">
                                    {feed.title.replace(`[${club.id}] `, "")}
                                  </h5>
                                  <p className="text-xs text-gray-500 font-medium whitespace-pre-wrap">
                                    {feed.description}
                                  </p>
                                </div>
                                <div className="mt-3 pt-2 border-t border-gray-100/50 flex flex-wrap gap-x-4 text-[9px] text-gray-400 font-bold">
                                  <span>📍 {feed.venue}</span>
                                  <span>🗓️ {feed.dateTime}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No feeds or announcements active for this club.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {careerResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#004d39] group-hover:bg-[#004d39] group-hover:text-white transition-all">
                      <Book className="w-5 h-5" />
                    </div>
                    <button
                      onClick={() =>
                        deleteDoc(doc(db, "careerResources", res.id!))
                      }
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-black text-gray-900 mb-1">{res.title}</h4>
                  <span className="text-[10px] font-black text-[#004d39] uppercase tracking-widest mb-4">
                    {res.category}
                  </span>
                  <p className="text-xs text-gray-500 italic mb-6 line-clamp-2">
                    "{res.description}"
                  </p>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto flex items-center gap-2 text-[10px] font-black text-[#004d39] uppercase tracking-widest hover:translate-x-1 transition-transform"
                  >
                    Visit Site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
              {careerResources.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 italic">
                  Career Database is empty.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
