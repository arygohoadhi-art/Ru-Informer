import React, { useState } from 'react';
import { UniversityClub, CLUBS_DATA } from '../lib/clubs';
import { UserProfile, ClubEvent } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Target,
  Calendar,
  MapPin,
  Clock,
  User,
  Heart,
  TrendingUp,
  Award,
  BookOpen,
  Info,
  CheckCircle,
  MessageSquare,
  Users,
  Briefcase,
  Zap,
  Globe
} from 'lucide-react';

interface ClubDetailViewProps {
  clubId: string;
  onBack: () => void;
  events: ClubEvent[];
  profile: UserProfile;
}

export default function ClubDetailView({ clubId, onBack, events, profile }: ClubDetailViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'dna' | 'feed'>('overview');
  const [followed, setFollowed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Find the club
  const club = CLUBS_DATA.find(c => c.id === clubId);

  if (!club) {
    return (
      <div className="bg-white rounded-[3rem] p-12 text-center shadow-sm border border-gray-100 space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-display font-black text-gray-900">Organization Not Found</h3>
        <p className="text-sm text-gray-500">The requested club could not be loaded from the Rajshahi University dataset.</p>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-[#006a4e] text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Get matching announcements/feeds
  const feeds = events.filter(e => (e as any).clubId === club.id || e.adminName?.toLowerCase().includes(club.id.toLowerCase()));

  // Extract Student DNA characteristics
  const dna = profile.studentDNA || {
    dept: 'Computer Science & Engineering',
    year: '1st Year',
    interests: 'Coding, Debate',
    goals: 'Software Engineer',
  };

  // Perform a neat dynamic alignment match score calculation & criteria listing
  const getDnaAlignmentDetails = () => {
    let score = 50;
    const reasons: { title: string; desc: string; type: 'success' | 'warn' | 'info' }[] = [];
    
    // Check Department Match
    const deptLower = (dna.dept || '').toLowerCase();
    const isTechClub = ['RUCC', 'RUSC'].includes(club.id);
    const isBizClub = ['RUBC', 'RUCC'].includes(club.id);
    const isMediaOrArts = ['RURF', 'BYCWF', 'RUWS', 'RUDC', 'RUPC'].includes(club.id);

    if (deptLower.includes('computer') || deptLower.includes('information') || deptLower.includes('electronic')) {
      if (isTechClub) {
        score += 25;
        reasons.push({
          title: "Primary Academic Synergy",
          desc: `Your engineering discipline (${dna.dept}) directly maps with ${club.id}'s focus on software engineering, tech projects, and systematic innovations.`,
          type: 'success'
        });
      } else {
        score += 10;
        reasons.push({
          title: "Multi-Disciplinary Scale",
          desc: `Applying technical analysis inside ${club.name} offers high-value leadership potential and digitized process modeling.`,
          type: 'info'
        });
      }
    } else if (deptLower.includes('accounting') || deptLower.includes('management') || deptLower.includes('finance') || deptLower.includes('marketing')) {
      if (isBizClub) {
        score += 25;
        reasons.push({
          title: "Business Focus Match",
          desc: `Your departmental background in business tracks perfectly with ${club.name}'s industry-facing workshops and professional networks.`,
          type: 'success'
        });
      } else {
        score += 10;
        reasons.push({
          title: "Administrative Contribution",
          desc: `As a business student, you bring pristine coordination, event planning, and budget management skills to this society.`,
          type: 'info'
        });
      }
    } else {
      reasons.push({
        title: "Diverse Lateral Expansion",
        desc: `Pairing your background in ${dna.dept || 'your study department'} with extra-curricular ${club.id} modules provides strong balance for holistic resumes.`,
        type: 'info'
      });
    }

    // Check Goal match
    const goalLower = (dna.goals || '').toLowerCase();
    if (goalLower.includes('engineer') || goalLower.includes('developer') || goalLower.includes('software')) {
      if (isTechClub) {
        score += 15;
        reasons.push({
          title: "Career Goal Synchronization",
          desc: `Your career objective of becoming a ${dna.goals} is strongly supported by technical portfolios and developer meetups hosted by ${club.id}.`,
          type: 'success'
        });
      }
    } else if (goalLower.includes('bcs') || goalLower.includes('civil') || goalLower.includes('govt')) {
      if (['RUEC', 'RUMUNA', 'BNCC'].includes(club.id)) {
        score += 20;
        reasons.push({
          title: "Civil Service Foundation",
          desc: `${club.id}'s disciplined structures, social outreach, or geopolitics workshops align solidly with competitive civil exam interviews.`,
          type: 'success'
        });
      }
    } else if (goalLower.includes('business') || goalLower.includes('entrepreneur') || goalLower.includes('start')) {
      if (isBizClub) {
        score += 20;
        reasons.push({
          title: "Entrepreneurial Gateway",
          desc: `Becoming active in ${club.id} provides vital startup networking, presentation skills, and incubation support.`,
          type: 'success'
        });
      }
    }

    // Check and map multiple Hobbies / Interests matches
    const hobbies = (dna.interests || '').split(',').map(h => h.trim().toLowerCase());
    let hobbyMatchesCount = 0;
    hobbies.forEach(hobby => {
      if (hobby.includes('code') || hobby.includes('program')) {
        if (club.id === 'RUCC' || club.id === 'RUSC') hobbyMatchesCount++;
      }
      if (hobby.includes('debate') || hobby.includes('speak') || hobby.includes('present')) {
        if (['RUMUNA', 'RUCC', 'RUBC'].includes(club.id)) hobbyMatchesCount++;
      }
      if (hobby.includes('writ') || hobby.includes('read') || hobby.includes('book')) {
        if (['RURF', 'BYCWF', 'RUWS'].includes(club.id)) hobbyMatchesCount++;
      }
      if (hobby.includes('scout') || hobby.includes('social') || hobby.includes('help')) {
        if (['BNCC', 'RURSG'].includes(club.id)) hobbyMatchesCount++;
      }
    });

    if (hobbyMatchesCount > 0) {
      score += Math.min(20, hobbyMatchesCount * 10);
      reasons.push({
        title: "Innate Passion Match",
        desc: `You have specified interests that align directly with the active hobbies practiced inside this club. This reduces onboarding friction.`,
        type: 'success'
      });
    }

    const finalScore = Math.min(98, score);

    return {
      finalScore,
      reasons
    };
  };

  const alignment = getDnaAlignmentDetails();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(club.portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Back link element */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#006a4e] hover:text-[#004d39] transition-all bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3px]" /> Back to Club Ecosystem
      </button>

      {/* Modern Banner Hero Card */}
      <div className="bg-[#004d39] rounded-[2.8rem] p-8 md:p-14 text-white relative overflow-hidden shadow-xl border border-blue-800/20">
        {/* Neon blur decorations */}
        <div className="absolute top-0 right-0 w-[30%] h-[50%] bg-[#ffd700]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-[#ffd700] text-[#004d39] font-mono font-black text-xs rounded-xl shadow-lg shadow-[#ffd700]/10">
                {club.id}
              </span>
              <span className="px-3.5 py-1 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#ffd700] border border-white/10">
                {club.category}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-display font-black tracking-tighter leading-tight">
                {club.name}
              </h1>
              <p className="text-base md:text-lg text-white/80 font-medium leading-relaxed max-w-2xl italic">
                "{club.description}"
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-widest">Core Domain</span>
                <span className="font-bold text-white text-xs">{club.category.split(' ')[0]}</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-white/40 block text-[9px] uppercase tracking-widest">Feeds Found</span>
                <span className="font-bold text-white text-xs">{feeds.length} Active</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-white/40 block text-[9px] uppercase tracking-widest">DNA Affinity</span>
                <span className="font-bold text-[#ffd700] text-xs">{alignment.finalScore}% Match</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-white/40 block text-[9px] uppercase tracking-widest">Active Scale</span>
                <span className="font-bold text-white text-xs">University Wide</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-stretch gap-3 w-full lg:w-auto relative z-10">
            <button
              onClick={() => setFollowed(!followed)}
              className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 ${
                followed
                  ? "bg-[#ffd700] text-[#004d39] font-bold shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
              }`}
            >
              <Heart className={`w-4 h-4 ${followed ? "fill-[#004d39]" : ""}`} />
              {followed ? "Connected Society" : "Connect with DNA"}
            </button>

            <a
              href={club.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              <Globe className="w-4 h-4" />
              Official Facebook Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>

      {/* Sub Tabs Selection */}
      <div className="flex border-b border-gray-100 pb-px">
        {[
          { id: 'overview', label: 'Overview & Guidelines', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'dna', label: 'DNA Alignment Calculations', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'feed', label: `Live Announcements (${feeds.length})`, icon: <Clock className="w-4 h-4" /> }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 text-xs font-black uppercase tracking-wider transition-all -mb-px ${
                isActive
                  ? "border-[#006a4e] text-[#006a4e]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Body */}
      <div className="min-h-[400px]">
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Main Overview Block */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-900 mb-2">About The Organization</h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-medium">
                    The {club.name} ({club.id}) stands as one of Rajshahi University's primary active clubs. It serves as a focal point of excellence inside the campus TSC, organizing inter-department contests, specialized workshops, open sessions, and collaborative ventures corresponding to the university calendar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-[#006a4e] tracking-widest block">Main Student Tasks</span>
                    <ul className="text-xs text-gray-500 font-semibold space-y-2.5">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e] mt-0.5 shrink-0" />
                        Attending weekly physical learning circles in TSC rooms.
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e] mt-0.5 shrink-0" />
                        Participating in specialized national / local competitions on behalf of RU.
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#006a4e] mt-0.5 shrink-0" />
                        Contributing to annual science / arts / corporate festivals and open assemblies.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-[#006a4e] tracking-widest block">Core Skills Targeted</span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Public Speaking', 'Team Leadership', 'Strategic Planning', 'Problem Solving', 'Event Coordination'].map((sk) => (
                        <span key={sk} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Guidance card based on Year */}
              <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 flex gap-5 items-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#006a4e] shrink-0 shadow-sm">
                  <Award className="w-6 h-6 text-[#006a4e]" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-[#006a4e] tracking-widest block">
                    Strategic Integration Plan — {dna.year}
                  </span>
                  <h4 className="text-base font-display font-black text-[#004d39]">How to stand out in this society</h4>
                  <p className="text-xs text-gray-600 font-semibold italic leading-relaxed">
                    {dna.year === '1st Year' && `As a freshman student, your core goal is high-frequency exploration. Join ${club.id}'s general communication group, apply for executive membership teams during recruitment drives, and register in introductory seminars.`}
                    {dna.year === '2nd Year' && `As a second-year sophomore, aim to transition from passive attendance to partial project execution. Draft event logistics, pitch ideas to seniors, and lead mock presentations.`}
                    {dna.year === '3rd Year' && `As a third-year student, target specialized sub-committee leadership tags inside ${club.id}. Connect with alumni networks via the club connection log.`}
                    {(dna.year === '4th Year' || dna.year === 'Masters') && `As an advanced years senior student, focus on giving back through mentor roles inside ${club.id}, advising juniors, and coordinating large-scale job portals or campus contests.`}
                  </p>
                </div>
              </div>

            </div>

            {/* Right Side Info Cards */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Reference Info</h4>
                
                <div className="space-y-3 font-semibold text-xs text-gray-600">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span>Main Hub</span>
                    <span className="text-gray-900 text-right">Central TSC, Rajshahi University</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span>Target Target Audience</span>
                    <span className="text-gray-900 text-right">All Departments / Batches</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span>Admissions</span>
                    <span className="text-[#006a4e] text-right font-black">Open During Recruits</span>
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-500 border border-gray-100"
                >
                  {copiedLink ? "Copied Link Successfully!" : "Copy Member Registration Link"}
                </button>
              </div>

              <div className="bg-gradient-to-br from-[#004d39] to-[#006a4e] text-white rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-md">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="w-24 h-24" />
                </div>
                <h4 className="font-bold text-sm text-[#ffd700] uppercase tracking-widest">Connect with Advisor</h4>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  Want to acquire detailed interview coaching or obtain a direct connection recommendation to this club's student board?
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      alert("Connecting with academic mentor specialized in club recruitments...");
                    }}
                    className="px-4 py-2 bg-white text-[#006a4e] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#ffd700] hover:text-[#004d39] transition-all"
                  >
                    Ping RU Mentor Hub
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {alignment && activeSubTab === 'dna' && (
          <div className="space-y-6">
            
            {/* Match Percentage Display */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start items-center gap-1 text-[#ffd700] mb-1">
                  <Sparkles className="w-5 h-5 fill-[#ffd700]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">DNA Match Calculations</span>
                </div>
                <h3 className="text-2xl font-display font-black text-gray-900">Your AI Affinity to {club.id}</h3>
                <p className="text-sm text-gray-400 font-semibold italic">Based on academic, psychological, and target ambition alignment guidelines.</p>
              </div>

              <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
                {/* SVG Circle Progress */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                  <motion.circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#006a4e" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * alignment.finalScore) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <span className="absolute text-xl font-black text-[#004d39] font-mono">{alignment.finalScore}%</span>
              </div>
            </div>

            {/* List of Reasons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {alignment.reasons.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    r.type === 'success' ? 'bg-blue-50 text-blue-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {r.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-gray-900 uppercase">{r.title}</h5>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {activeSubTab === 'feed' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-5 mb-5">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-900">Society Newsroom</h3>
                  <p className="text-xs text-gray-400 font-semibold italic">Viewing announcements, events, call for members, and contest rosters.</p>
                </div>
                <span className="px-3.5 py-1 bg-blue-50 rounded-lg text-xs font-mono font-black text-[#006a4e]">
                  {feeds.length} Active Feeds
                </span>
              </div>

              {feeds.length > 0 ? (
                <div className="space-y-4">
                  {feeds.map((item) => (
                    <div key={item.id} className="bg-gray-50/50 hover:bg-gray-50 p-6 border border-gray-100 rounded-2xl flex flex-col relative transition-all duration-300">
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest border ${
                          (item as any).clubPostType === 'Event' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {(item as any).clubPostType || 'News / Alert'}
                        </span>
                        
                        <div className="text-[10px] font-semibold text-gray-400">
                          {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString() : 'Just now'}
                        </div>
                      </div>

                      <h4 className="font-extrabold text-base text-gray-900 mb-1.5">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-semibold italic mb-4">"{item.description}"</p>

                      {/* Event details coordinates */}
                      {((item as any).clubPostType === 'Event' || item.venue || item.dateTime) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500 bg-white p-4 rounded-xl border border-gray-100">
                          {item.venue && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">📍</span>
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Venue Space</span>
                                <span className="font-bold text-gray-800">{item.venue}</span>
                              </div>
                            </div>
                          )}
                          {item.dateTime && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🕒</span>
                              <div>
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Time & Date</span>
                                <span className="font-bold text-gray-800">{item.dateTime}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* External Join / Support Button */}
                      {item.contact?.joinLink && (
                        <div className="pt-4 mt-2">
                          <a
                            href={item.contact.joinLink.startsWith('http') ? item.contact.joinLink : `https://${item.contact.joinLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#006a4e] hover:bg-[#004d39] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Explore Portal Registration <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="text-4xl">📭</div>
                  <h4 className="text-sm font-black text-gray-900">Quiet Newsroom</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">This organization hasn't published any announcements this week. Click their Facebook Portal above to check recent social threads.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
