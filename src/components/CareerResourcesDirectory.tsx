import React, { useState } from "react";
import { 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Search, 
  ExternalLink, 
  FileText, 
  Award, 
  Code, 
  Users, 
  Cpu, 
  BookOpenCheck,
  Building,
  CheckCircle2
} from "lucide-react";
import { cn } from "../lib/utils";

export default function CareerResourcesDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const resourceCategories = [
    "All",
    "BCS & Govt Jobs",
    "Tech & Engineering",
    "Higher Studies & Research",
    "Corporate & MNC Grooming"
  ];

  const resourceData = [
    {
      id: "bcs-prep-node",
      category: "BCS & Govt Jobs",
      title: "Bangladesh Civil Service (BCS) Prep Guide",
      subtitle: "Syllabus Breakdown & Material Nodes",
      description: "Comprehensive preliminary & written guidelines. Recommended reading includes Professor's/MP3 Series, standard High School textbooks for Bengali, Math, and English grammar.",
      tips: [
        "Focus heavily on Bengali and English Literature (marks-dense areas).",
        "Solve last 10 years of BCS preliminary papers first to identify patterns.",
        "Read daily newspapers (Prothom Alo / Daily Star) for current affairs and global nodes."
      ],
      links: [
        { label: "BPSC Official Portal", url: "http://www.bpsc.gov.bd" },
        { label: "BCS Preliminary Syllabus", url: "http://bpsc.gov.bd/site/page/b80f7453-6a5c-43df-9730-81f185d0d829" }
      ],
      icon: <BookOpen className="w-5 h-5 text-blue-600" />
    },
    {
      id: "gov-bank-prep",
      category: "BCS & Govt Jobs",
      title: "Govt Bank Assistant Director (AD) Prep Hub",
      subtitle: "Focus on Mathematics & Analytical Ability",
      description: "Guidance for Bangladesh Bank AD and other nationalized commercial bank recruitment exams. Covers English MCQ, Arithmetic questions (mainly from IBA MBA exams), and Focus Writing.",
      tips: [
        "Math section is key. Master 'Nova's GRE Math Bible' and past commercial bank math papers.",
        "Practice Focus Writing in both Bengali and English daily under strict timing.",
        "Review monetary policies of Bangladesh Bank and key economic indicators."
      ],
      links: [
        { label: "BB Recruitment Portal", url: "https://erecruitment.bb.org.bd" },
        { label: "Past Bank Math Solutions", url: "https://www.google.com/search?q=past+bank+math+solutions+bangladesh" }
      ],
      icon: <Building className="w-5 h-5 text-teal-600" />
    },
    {
      id: "tech-roadmap-sh",
      category: "Tech & Engineering",
      title: "Global Software Engineering Roadmaps",
      subtitle: "Interactive Technical Learning Nodes",
      description: "Visual roadmap.sh guidelines for frontend, backend, devops, blockchain, and cyber-security. Aligns university theory with market-ready tools.",
      tips: [
        "Do not jump directly to frameworks (React/Spring). Strengthen Core DSA and OS principles first.",
        "Build 3 full-stack projects showcasing CRUD, Auth, and database relations.",
        "Follow standard Git workflow; push code daily to demonstrate consistency."
      ],
      links: [
        { label: "Interactive Roadmaps", url: "https://roadmap.sh" },
        { label: "LeetCode DSA Node", url: "https://leetcode.com" }
      ],
      icon: <Code className="w-5 h-5 text-indigo-600" />
    },
    {
      id: "ru-cse-local",
      category: "Tech & Engineering",
      title: "RU CSE & Campus Coding Communities",
      subtitle: "Local Rajshahi University Clubs & Contests",
      description: "Engage with RU's local competitive programming and software dev groups. Participate in regular intra-university programming contests, hackathons, and bootcamps.",
      tips: [
        "Join the RU Competitive Programming Community on Facebook/Discord.",
        "Utilize the university's central lab facilities and coordinate with senior mentors.",
        "Form teams of 3 early for national events like ACM-ICPC and National Girls Programming Contests."
      ],
      links: [
        { label: "RU central website", url: "https://www.ru.ac.bd" },
        { label: "Bdjobs IT Circulars", url: "https://jobs.bdjobs.com/jobsearch.asp?fcatId=8" }
      ],
      icon: <Cpu className="w-5 h-5 text-blue-600" />
    },
    {
      id: "erasmus-daad",
      category: "Higher Studies & Research",
      title: "Erasmus Mundus & DAAD Scholarship Guides",
      subtitle: "Fully Funded Post-Graduation Pathways",
      description: "Step-by-step documentation guidelines for fully funded Master's programs in Europe (Erasmus Mundus, DAAD in Germany, MEXT in Japan, and Commonwealth in UK) tailored for RU graduates.",
      tips: [
        "Keep your CGPA above 3.50 if possible, though Erasmus accepts diverse profiles.",
        "Secure at least 2 strong recommendation letters from RU departmental professors.",
        "Write a stellar Statement of Purpose (SOP) connecting your RU studies to future research."
      ],
      links: [
        { label: "Erasmus Catalogue", url: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en" },
        { label: "DAAD Scholarship Node", url: "https://www.daad.de/en" }
      ],
      icon: <Award className="w-5 h-5 text-rose-600" />
    },
    {
      id: "ielts-gre-nodes",
      category: "Higher Studies & Research",
      title: "IELTS & GRE Academic Preparation Hub",
      subtitle: "Standardized Exams Guidance",
      description: "Complete study planners, diagnostic test links, vocabulary lists, and practice modules for standardized exams. Essential for securing foreign graduate teaching assistantships.",
      tips: [
        "For IELTS, focus heavily on the Cambridge practice books (11 to 18) for listening and reading.",
        "For GRE, practice official ETS materials and leverage 'Magoosh' flashcards for vocabulary.",
        "Take regular timed mock exams to adapt to the pressure and structure."
      ],
      links: [
        { label: "British Council BD IELTS", url: "https://www.britishcouncil.org.bd" },
        { label: "ETS Official GRE Node", url: "https://www.ets.org/gre" }
      ],
      icon: <BookOpenCheck className="w-5 h-5 text-orange-600" />
    },
    {
      id: "linkedin-networking",
      category: "Corporate & MNC Grooming",
      title: "LinkedIn Networking & RU Alumni Bridge",
      subtitle: "Professional Brand Building",
      description: "How to craft a highly searchable LinkedIn profile, write cold reach-out messages to RU alumni at multinational corporations (like Unilever, BAT, or Grameenphone), and find internships.",
      tips: [
        "Use a professional headshot, a crisp headline with keywords, and a structured, achievement-based summary.",
        "Search LinkedIn for 'University of Rajshahi' under the education filter to locate seniors in your desired firms.",
        "Keep cold emails short: introduce yourself, state the connection (RU), and ask for a 10-minute chat."
      ],
      links: [
        { label: "LinkedIn Professional", url: "https://www.linkedin.com" },
        { label: "RU Alumni Search Page", url: "https://www.linkedin.com/school/university-of-rajshahi/people/" }
      ],
      icon: <Users className="w-5 h-5 text-sky-600" />
    },
    {
      id: "resume-ats-grooming",
      category: "Corporate & MNC Grooming",
      title: "ATS-Friendly Resume & CV Engineering",
      subtitle: "Corporate Candidate Screening Standards",
      description: "Templates and guidelines to pass Applicant Tracking Systems (ATS) used by top multinationals. Covers chronological layout, active action verbs, and quantitative impact reporting.",
      tips: [
        "Avoid multi-column resume layouts or images. Standard single-column black & white PDF is safest.",
        "Quantify your results: e.g., 'Led a team of 4 to organize an RU tech event, attracting 500+ attendees'.",
        "Tailor your resume keywords to exactly match the job description circular."
      ],
      links: [
        { label: "Harvard CV Templates", url: "https://www.google.com/search?q=harvard+college+cv+templates" },
        { label: "Canva Resume Builder", url: "https://www.canva.com/resumes/" }
      ],
      icon: <FileText className="w-5 h-5 text-violet-600" />
    }
  ];

  const filteredResources = resourceData.filter(res => {
    const matchesCat = activeCategory === "All" || res.category === activeCategory;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-50">
        <div>
          <h4 className="font-display font-black text-xl text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#006a4e]" />
            Curated Career & Job Resources Hub
          </h4>
          <p className="text-xs text-gray-400 font-medium italic mt-1">
            Handpicked guidelines, syllabus nodes, and official preparation portals for RU students.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search guidelines, topics, exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold focus:bg-white focus:border-[#006a4e] transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {resourceCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-all cursor-pointer",
              activeCategory === cat
                ? "bg-[#006a4e] text-white border-[#006a4e] shadow-sm shadow-[#006a4e]/10"
                : "bg-white text-gray-400 border-gray-50 hover:border-[#006a4e]/20 hover:text-gray-900"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {filteredResources.length === 0 ? (
          <div className="md:col-span-2 text-center py-16 space-y-2 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-gray-400 font-bold text-xs">No directories match your query.</p>
          </div>
        ) : (
          filteredResources.map((res) => (
            <div
              key={res.id}
              className="bg-gray-50/30 border border-gray-100 rounded-2xl p-5 hover:border-[#006a4e]/10 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    {res.icon}
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#006a4e]">
                      {res.category}
                    </span>
                    <h5 className="font-display font-black text-gray-800 text-sm leading-snug">
                      {res.title}
                    </h5>
                    <p className="text-[10px] font-bold text-gray-400">{res.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {res.description}
                </p>

                {/* Localized Advice list */}
                <div className="space-y-2 bg-white/50 border border-gray-50 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">
                    Strategic Action Plan
                  </span>
                  <ul className="space-y-1.5">
                    {res.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 font-medium leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
                {res.links.map((link, linkIdx) => (
                  <a
                    key={linkIdx}
                    href={link.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-[#006a4e] hover:text-[#004d39] hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 text-[#ffd700]" />
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
