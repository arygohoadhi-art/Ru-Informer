import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile, StudentDNA } from '../types';
import { CLUBS_DATA, UniversityClub } from '../lib/clubs';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  Users, 
  Rocket, 
  Target, 
  Compass, 
  MapPin, 
  Check, 
  Save, 
  Loader2, 
  Briefcase, 
  Brain, 
  Cpu, 
  Zap,
  Info
} from 'lucide-react';

interface RecommendationSandboxProps {
  profile: UserProfile;
}

export default function RecommendationSandbox({ profile }: RecommendationSandboxProps) {
  // Extract initial values from profile or set default values
  const initialDNA = profile.studentDNA || {
    dept: 'Computer Science & Engineering',
    year: '1st Year',
    interests: 'Coding, Debate',
    experience: '',
    activities: '',
    goals: 'Software Engineer',
    habits: '',
    previousInvolvement: '',
    currentInvolvement: '',
    goalStage: 'Exploring options',
    motivation: 'Personal Growth',
    topStrengths: 'Problem Solving',
    improvementAreas: 'Public Speaking',
    marketPreference: 'Local Tech Firms (Therap, etc)',
    workStyle: 'Collaborative team work',
    majorObstacle: 'Lack of Proper Guidance',
    vision10Years: 'Senior Industry Expert'
  };

  // Live sandbox state
  const [dept, setDept] = useState(initialDNA.dept || 'Computer Science & Engineering');
  const [year, setYear] = useState(initialDNA.year || '1st Year');
  const [goal, setGoal] = useState(initialDNA.goals || 'Software Engineer');
  const [motivation, setMotivation] = useState(initialDNA.motivation || 'Personal Growth');
  const [workStyle, setWorkStyle] = useState(initialDNA.workStyle || 'Collaborative team work');
  const [obstacle, setObstacle] = useState(initialDNA.majorObstacle || 'Lack of Proper Guidance');
  const [vision, setVision] = useState(initialDNA.vision10Years || 'Senior Industry Expert');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(() => {
    const raw = initialDNA.interests || 'Coding, Debate';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  });
  const [selectedSpot, setSelectedSpot] = useState<string>('Tukitaki Cafe');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Department options same as DNA Studio
  const deptOptions = [
    'Computer Science & Engineering', 'Information & Communication Engineering', 
    'Electrical & Electronic Engineering', 'Applied Physics & Electronic Engineering', 
    'Mathematics', 'Statistics', 'Physics', 'Chemistry', 
    'Accounting & Information Systems', 'Management Studies', 'Marketing', 'Finance',
    'Law', 'Political Science', 'Economics', 'English', 'Sociology'
  ];

  // Goals options
  const targetGoals = [
    'BCS / Civil Service', 'Software Engineer', 'Bank Job', 'Higher Studies', 'Entrepreneurship'
  ];

  const motivationOptions = [
    'Personal Growth', 'Financial Stability', 'Social Impact', 'International Exposure'
  ];

  const workStyleOptions = [
    'Collaborative team work', 'Autonomous execution', 'Highly organized systems', 'Physical field tasks'
  ];

  const visionOptions = [
    'Senior Industry Expert', 'High-ranking Govt Official', 'Successful Business Owner', 'Academician / Researcher'
  ];

  // Custom available hobbies tags
  const availableHobbies = [
    'Coding', 'Debate', 'Public Speaking', 'Creative Writing', 'Social Work', 
    'Journalism', 'Graphic Design', 'Academic Research', 'Event Organizing', 
    'Book Reviewing', 'Astronomy'
  ];

  const ruSpots = [
    { name: 'Tukitaki Cafe', desc: 'Central intellectual meeting hub at Rajshahi University.' },
    { name: 'Paris Road', desc: 'Symmetric beautiful lane, ideal for visionary design walks and deep pondering.' },
    { name: 'Iblis Field Garden', desc: 'Relaxed ambient environment adjacent to science faculty buildings.' },
    { name: 'Central Library Lobby', desc: 'Quiet workspace surrounded by thousands of local reference archives.' },
    { name: 'TSC Cafeteria Lounge', desc: 'The melting pot of RU club representatives and societal debates.' }
  ];

  // Helper toggle
  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  // Compute Instant recommendations completely client-side in micro-seconds!
  const getHeuristicRecommendations = () => {
    // 1. Calculate dynamic Semantic Match Fit calculation
    // Base fit score starts at 50%
    let fitScore = 55;
    
    // Increment fit score based on selected metadata richness
    if (dept) fitScore += 5;
    if (year) fitScore += 5;
    if (goal) fitScore += 10;
    if (motivation !== 'Personal Growth') fitScore += 5;
    if (workStyle !== 'Collaborative team work') fitScore += 5;
    if (selectedHobbies.length > 0) fitScore += Math.min(15, selectedHobbies.length * 4);
    if (selectedSpot !== 'Tukitaki Cafe') fitScore += 5;

    // Constrain score between 40% and 98%
    const finalScore = Math.min(98, Math.max(40, fitScore));

    // 2. Filter top clubs based on parameters
    const scoredClubs = CLUBS_DATA.map(club => {
      let score = 0.45; // Base score
      const cat = club.category;
      const deptLower = dept.toLowerCase();
      const goalLower = goal.toLowerCase();
      const clubId = club.id;

      // Classify match weight by Department Study
      if (deptLower.includes('computer') || deptLower.includes('information') || deptLower.includes('electrical')) {
        if (cat === 'Science & Academic') score += 0.2;
        if (clubId === 'RUCC' || clubId === 'RUSC') score += 0.15;
      } else if (deptLower.includes('accounting') || deptLower.includes('management') || deptLower.includes('finance') || deptLower.includes('marketing')) {
        if (cat === 'Career & Business') score += 0.25;
        if (clubId === 'RUBC' || clubId === 'RUCC') score += 0.1;
      } else if (deptLower.includes('law') || deptLower.includes('political') || deptLower.includes('english')) {
        if (clubId === 'RUMUNA' || clubId === 'RURF') score += 0.25;
        if (cat === 'Social & Service') score += 0.1;
      }

      // Goal classifications
      if (goalLower.includes('software') || goalLower.includes('engineer')) {
        if (clubId === 'RUCC') score += 0.1;
        if (clubId === 'RUSC') score += 0.05;
      } else if (goalLower.includes('bcs') || goalLower.includes('civil') || goalLower.includes('government')) {
        if (clubId === 'RUEC' || clubId === 'RUMUNA') score += 0.15;
        if (clubId === 'BNCC') score += 0.1;
      } else if (goalLower.includes('business') || goalLower.includes('entrepreneur')) {
        if (clubId === 'RUBC') score += 0.15;
      } else if (goalLower.includes('study') || goalLower.includes('academic') || goalLower.includes('higher')) {
        if (clubId === 'RUHSC' || clubId === 'RURS') score += 0.2;
      }

      // Dynamic hobby weights
      selectedHobbies.forEach(hobby => {
        const h = hobby.toLowerCase();
        if (h.includes('coding') && (clubId === 'RUCC' || clubId === 'RUSC')) score += 0.1;
        if (h.includes('debate') && clubId === 'RUMUNA') score += 0.15;
        if (h.includes('public speaking') && (clubId === 'RUMUNA' || clubId === 'RUCC' || clubId === 'RUBC')) score += 0.1;
        if (h.includes('writing') && (clubId === 'BYCWF' || clubId === 'RUWS')) score += 0.15;
        if (h.includes('book') && clubId === 'RURF') score += 0.2;
        if (h.includes('social') && (clubId === 'RURSG' || clubId === 'BNCC')) score += 0.15;
        if (h.includes('astronomy') && clubId === 'RUSC') score += 0.2;
      });

      return {
        ...club,
        score: Math.min(0.98, score)
      };
    }).sort((a, b) => b.score - a.score);

    const topClubs = scoredClubs.slice(0, 3);

    // 3. Generate dynamic Year Pathway highlights
    let pathwayStep = "";
    if (year === '1st Year') {
      pathwayStep = `Establish solid GPA baselines (aim >3.50). Join ${topClubs[0]?.id || 'RUCC'} as an enthusiastic general member to expand network nodes.`;
    } else if (year === '2nd Year') {
      pathwayStep = `Acquire specialized skills. Start leading small initiatives in clubs. Build a competitive resume focusing on ${selectedHobbies.join(' and ') || 'academic success'}.`;
    } else if (year === '3rd Year') {
      pathwayStep = `Pivotal workspace alignment. Draft physical portfolios, apply for local fellowships/internships, and design an exhaustive LinkedIn connection map.`;
    } else if (year === '4th Year') {
      pathwayStep = `Execute graduation thesis/dissertation milestones. Tackle offline mock exams or tech recruitment contests. Push intense applications toward your primary goal as ${goal}.`;
    } else {
      pathwayStep = `Transition stage. Focus on national civil services, corporate management trainee placements, or international study fellowships.`;
    }

    // 4. Spotlight Spot Guidance
    let spotSuggestion = "";
    if (selectedSpot === 'Tukitaki Cafe') {
      spotSuggestion = "The perfect intersection for spontaneous debate sessions and professional networking with senior year leaders.";
    } else if (selectedSpot === 'Paris Road') {
      spotSuggestion = "Excellent for quiet strategic contemplation. Stroll beneath the tall trees at sunset to clear mental clutter.";
    } else if (selectedSpot === 'Iblis Field Garden') {
      spotSuggestion = "Conducive to group project brainstorming sessions and scientific collaborations after faculty hours.";
    } else if (selectedSpot === 'Central Library Lobby') {
      spotSuggestion = "Highly focused intellectual space. Perfect for deep concentration, research reviews, and civil service preparation.";
    } else {
      spotSuggestion = "Vibrant gathering ground. Interact with diverse club delegates to coordinate multi-disciplinary campus efforts.";
    }

    return {
      finalScore,
      topClubs,
      pathwayStep,
      spotSuggestion
    };
  };

  const results = getHeuristicRecommendations();

  // Save changes node function
  const handleSaveToProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'users', profile.uid);
      const updatedDNAValue: StudentDNA = {
        ...initialDNA,
        dept,
        year,
        goals: goal,
        interests: selectedHobbies.join(', '),
        motivation,
        workStyle,
        majorObstacle: obstacle,
        vision10Years: vision
      };

      await updateDoc(docRef, {
        studentDNA: updatedDNAValue,
        updatedAt: serverTimestamp()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-16 selection:bg-[#ffd700] selection:text-[#004d39] overflow-hidden">
      {/* Dynamic Background Dots */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[5%] right-[5%] w-[40%] h-[40%] bg-[#006a4e]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-[#ffd700]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Aesthetic Page Header */}
        <div className="bg-[#004d39] rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Cpu className="w-56 h-56" />
          </div>
          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffd700] text-[#004d39] rounded-full text-[9px] font-black uppercase tracking-[0.25em]">
              Recommendation Engine Core
            </div>
            <h3 className="text-3xl md:text-5xl font-display font-black leading-tight tracking-tighter">Instant Match Sandbox</h3>
            <p className="text-sm text-white/80 leading-relaxed font-semibold italic">
              "Fine-tune your temporary variables below to watch the campus intelligence engine re-orient your club connections, pathway steps, and spatial focal points instantly."
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-xs font-mono max-w-sm relative z-10">
            <span className="text-[#ffd700] font-black block mb-1">⚡ COGNITIVE CALCULATIONS</span>
            Running real-time vector matches against {CLUBS_DATA.length} active Rajshahi University tsc societies.
          </div>
        </div>

        {/* Real-time Interactive Flow Diagram (Logo pipeline) */}
        <div className="bg-gradient-to-r from-[#004d39] to-[#015f47] rounded-[2.5rem] p-6 text-white border border-white/10 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/10 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
            
            {/* Input Node Card */}
            <div className="flex-1 w-full bg-black/20 backdrop-blur-sm p-5 rounded-2xl border border-white/5 space-y-3 relative">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#ffd700] text-[#004d39] font-black text-[9px] uppercase tracking-widest rounded-md">
                STAGE 1: STUDENT DATA INGESTION
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300">
                  <span>DISCIPLINE:</span>
                  <span className="font-bold text-white max-w-[150px] truncate">{dept}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300">
                  <span>STAGE:</span>
                  <span className="font-bold text-white">{year}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300">
                  <span>AMBITION TARGET:</span>
                  <span className="font-bold text-white">{goal}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-[#ffd700]">
                  <span>INTEREST CLUSTERS:</span>
                  <span className="font-bold text-white truncate max-w-[150px]">{selectedHobbies.join(', ') || 'None'}</span>
                </div>
              </div>
              
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-400"
                  animate={{ width: ["20%", "100%", "20%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Pulsating Connector Stream */}
            <div className="shrink-0 flex flex-col items-center justify-center">
              <div className="hidden md:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700] animate-ping" />
                <div className="w-14 h-1 bg-white/20 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full w-4 bg-[#ffd700] rounded-full absolute"
                    animate={{ left: ["-20%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <Zap className="w-4 h-4 text-[#ffd700]" />
              </div>
              <div className="md:hidden flex flex-col items-center gap-1.5 my-1">
                <Zap className="w-4 h-4 text-[#ffd700]" />
                <div className="h-8 w-1 bg-white/20 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="w-full h-4 bg-[#ffd700] rounded-full absolute animate-[moveDown_1.5s_infinite]"
                    animate={{ top: ["-20%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-white/50">Streams</span>
            </div>

            {/* Visual Logo Centerpiece (The Cognitive Core) */}
            <div className="shrink-0 flex flex-col items-center justify-center relative">
              <motion.div 
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ffd700] via-emerald-400 to-[#009e73] p-1 shadow-lg shadow-emerald-950/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full rounded-full bg-[#004d39] flex items-center justify-center">
                  <Brain className="w-9 h-9 text-white animate-pulse" />
                </div>
              </motion.div>
              {/* Overlay elements */}
              <div className="absolute top-0 right-0 bg-[#ffd700] rounded-full p-1 border border-[#004d39]">
                <Cpu className="w-3.5 h-3.5 text-[#004d39] animate-spin" />
              </div>
              <span className="text-[9px] font-black uppercase text-[#ffd700] mt-1.5 tracking-widest text-center">
                STUDENT DNA CORE
              </span>
            </div>

            {/* Pulsating Connector Stream */}
            <div className="shrink-0 flex flex-col items-center justify-center">
              <div className="hidden md:flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div className="w-14 h-1 bg-white/20 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full w-4 bg-[#009e73] rounded-full absolute"
                    animate={{ left: ["-20%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-[#009e73] animate-ping" />
              </div>
              <div className="md:hidden flex flex-col items-center gap-1.5 my-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div className="h-8 w-1 bg-white/20 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="w-full h-4 bg-[#009e73] rounded-full absolute"
                    animate={{ top: ["-20%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-white/50">Pipeline</span>
            </div>

            {/* Output Node Card */}
            <div className="flex-1 w-full bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10 space-y-3 relative">
              <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-[#006a4e] text-emerald-200 border border-emerald-400/40 font-black text-[9px] uppercase tracking-widest rounded-md">
                STAGE 2: INSTANT COGNITIVE OUTPUT
              </div>
              
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-[#ffd700]">
                  <span>AFFINITY MATCH:</span>
                  <span className="font-bold text-white text-[11px]">{results.finalScore}% Confidence</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300">
                  <span>TOP RECOMMENDED:</span>
                  <span className="font-bold text-white">{results.topClubs[0]?.id || 'RUCC'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-emerald-300">
                  <span>TARGET SOCIAL PLACE:</span>
                  <span className="font-bold text-white truncate max-w-[130px]">{selectedSpot}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-300">
                  <span>TEMPORAL ADVICE:</span>
                  <span className="font-bold text-white truncate max-w-[130px]" title={results.pathwayStep}>{results.pathwayStep}</span>
                </div>
              </div>

              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-400"
                  animate={{ width: ["100%", "20%", "100%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* 2-Column Responsive Body replicating Login page */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Left Column (Parameter Synthesis Form) */}
          <div className="lg:col-span-7 bg-white rounded-[3rem] p-6 md:p-10 shadow-sm border border-gray-100 space-y-8">
            <div className="space-y-2 border-b border-gray-100 pb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#006a4e] rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                Intelligence Tuning Nodes
              </div>
              <h2 className="text-4xl font-display font-black text-[#004d39] leading-[1.1] tracking-tight">
                Profile <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006a4e] to-[#009e73]">Synthesizer.</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium italic">Adjust inputs. Watch the live dashboard on the right adapt in micro-seconds.</p>
            </div>

            <div className="space-y-6">
              {/* Node 1: Academic Discipline & Timeline */}
              <div className="space-y-3 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-[#006a4e] uppercase tracking-widest block">Academic Coordinates</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Department Node</label>
                    <select
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:border-[#006a4e] outline-none font-bold text-gray-800 text-xs appearance-none cursor-pointer"
                    >
                      {deptOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Temporal Stage (Year)</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['1st Yr', '2nd Yr', '3rd Yr', '4th Yr', 'MSt'].map((yr, idx) => {
                        const values = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters'];
                        const val = values[idx];
                        const isActive = year === val;
                        return (
                          <button
                            key={yr}
                            onClick={() => setYear(val)}
                            className={`p-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              isActive 
                                ? 'bg-[#006a4e] text-white shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Node 2: Primary Ambition Goals */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#006a4e] uppercase tracking-widest block">Primary Ambition Core</span>
                <div className="flex flex-wrap gap-2">
                  {targetGoals.map(g => {
                    const isActive = goal === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setGoal(g)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                          isActive 
                            ? 'bg-[#006a4e] text-white border-[#006a4e] shadow-lg shadow-[#006a4e]/10 scale-105' 
                            : 'bg-white text-[#004d39] border-gray-100 hover:border-[#006a4e]/20 hover:bg-gray-50'
                        }`}
                      >
                        <Target className={`w-3.5 h-3.5 ${isActive ? 'text-[#ffd700]' : 'text-gray-400'}`} />
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Node 3: Interactive Hobbies & Cognitive Strengths Toggle */}
              <div className="space-y-3">
                <span className="text-[11px] font-black text-[#006a4e] uppercase tracking-widest block">
                  Interests & Tactical Activities ({selectedHobbies.length} selected)
                </span>
                <p className="text-[10px] text-gray-400 italic">Select multiple. These directly impact society similarities.</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableHobbies.map(hobby => {
                    const isSelected = selectedHobbies.includes(hobby);
                    return (
                      <button
                        key={hobby}
                        onClick={() => toggleHobby(hobby)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-[#ffd700] text-[#004d39] font-bold shadow-sm border border-[#ffd700]' 
                            : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        {hobby}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Node 4: Psychographic Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Drive / Core Motivation</span>
                  <select
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-700 cursor-pointer outline-none"
                  >
                    {motivationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Required Work Style</span>
                  <select
                    value={workStyle}
                    onChange={(e) => setWorkStyle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-700 cursor-pointer outline-none"
                  >
                    {workStyleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Node 5: Campus Spot Selection */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#006a4e] uppercase tracking-widest block">Rajshahi University Campus Hangout Node</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ruSpots.map(spot => {
                    const isSelected = selectedSpot === spot.name;
                    return (
                      <div 
                        key={spot.name}
                        onClick={() => setSelectedSpot(spot.name)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all relative ${
                          isSelected 
                            ? 'border-2 border-[#006a4e] bg-[#006a4e]/5 shadow-sm' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isSelected ? 'text-[#006a4e]' : 'text-gray-400'}`} />
                          <h4 className="text-xs font-black text-gray-900">{spot.name}</h4>
                        </div>
                        <p className="text-[10px] text-gray-400 italic mt-1 line-clamp-2">{spot.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Application Integration Controls */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900">Synchronize Settings</h4>
                <p className="text-xs text-gray-400">Save this calibration directly to your permanent academic DNA profile.</p>
              </div>

              <button
                onClick={handleSaveToProfile}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                  saveSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#006a4e] text-white hover:bg-[#004d39] shadow-lg shadow-[#006a4e]/20'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3px]" />
                    DNA SYNCHRONIZED!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#ffd700]" />
                    Adopt Coordinates
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (Dynamic Recommendation Output Cards - Copied Landing View Style) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8 self-start">
            
            {/* Visual Preview Card replicating Login layout */}
            <div className="bg-white rounded-[3rem] p-1.5 shadow-[0_32px_64px_-12px_rgba(0,106,78,0.15)] border border-gray-100 relative group">
              
              <div className="bg-gray-900 rounded-[2.8rem] p-6 md:p-8 space-y-8 text-white relative overflow-hidden">
                {/* Floating neon accent glow dots similar to landing page */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ffd700]/10 rounded-full blur-2xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-4 border-b border-white/5 pb-5 relative z-10">
                  <div className="w-12 h-12 bg-[#ffd700] rounded-xl flex items-center justify-center text-[#006a4e] transform -rotate-3">
                    <Brain className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Recommendation Brain</h4>
                    <p className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                      Active Cognitive Analysis (Cortex-Live)
                    </p>
                  </div>
                  <div className="absolute top-1 right-1 opacity-70">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
                    </span>
                  </div>
                </div>

                {/* Semantic Alignment Metric Bar */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Semantic Alignment</span>
                    <span className="font-mono text-[#ffd700] font-black">{results.finalScore}% Match</span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#ffd700]"
                      initial={{ width: "30%" }}
                      animate={{ width: `${results.finalScore}%` }}
                      transition={{ type: "spring", stiffness: 60 }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 font-medium italic">
                    "Computed dynamically based on mutual correlations between studies and target ambitions."
                  </p>
                </div>

                {/* Instant Club Suggestions */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4.5 h-4.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Matched TSC Societies
                    </span>
                  </div>

                  <div className="space-y-3">
                    {results.topClubs.map((club) => {
                      const matchPct = (club.score * 100).toFixed(0);
                      return (
                        <div 
                          key={club.id} 
                          className="relative overflow-hidden bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-default"
                        >
                          <div className="space-y-0.5 max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded uppercase">
                                {club.id}
                              </span>
                              <span className="text-xs font-black text-gray-300 block truncate">{club.name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 leading-none block line-clamp-1 italic">
                              "{club.description}"
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-black text-emerald-400 block">{matchPct}%</span>
                            <span className="text-[8px] uppercase font-black text-gray-500 block tracking-widest">Fit</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Micro Year Pathway Target */}
                <div className="space-y-3 relative z-10 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-[#ffd700]">
                    <Rocket className="w-4.5 h-4.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest block">
                      {year} Path Instruction
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium italic leading-relaxed">
                    "{results.pathwayStep}"
                  </p>
                </div>

                {/* Dynamic Spots and Places */}
                <div className="space-y-3 relative z-10 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Compass className="w-4.5 h-4.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest block">
                      Target Spot Calibration ({selectedSpot})
                    </span>
                  </div>
                  <p className="text-xs text-white/80 font-medium italic leading-relaxed">
                    {results.spotSuggestion}
                  </p>
                </div>

              </div>
            </div>

            {/* Quick Informer AI Insight note */}
            <div className="bg-[#fcfdfc] p-6 rounded-3xl border border-gray-100 flex gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#006a4e] shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 text-left">
                <h5 className="text-xs font-black text-gray-900 uppercase">Interactive Algorithm Overview</h5>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The match index assigns dynamic affinity points based on shared coordinates, and evaluates student hobbies alongside physical TSC club charters recorded at Rajshahi University.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
