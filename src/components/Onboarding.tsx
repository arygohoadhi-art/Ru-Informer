import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile, StudentDNA } from '../types';
import { getEmbedding, generateRoadmap } from '../services/geminiService';
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  profile: UserProfile;
  onComplete: (updatedProfile: UserProfile) => void;
}

export default function Onboarding({ profile, onComplete }: Props) {
  const [dna, setDna] = useState<StudentDNA>({
    dept: '',
    year: '',
    interests: '',
    experience: '',
    activities: '',
    goals: '',
    habits: '',
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
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('user_gemini_api_key') || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const needsApiKeySetup = !(localStorage.getItem('user_gemini_api_key') || process.env.GEMINI_API_KEY);

  const suggestions = {
    dept: [
      'Computer Science & Engineering', 'Pharmacy', 'Electrical & Electronic Engineering', 
      'Law', 'Economics', 'English', 'Accounting & Info Systems', 'Applied Chemistry'
    ],
    goals: ['Corporate Career', 'BCS / Civil Service', 'Software Engineer', 'Higher Studies Abroad', 'Bank Executive'],
    motivation: ['Financial Stability', 'Passion for Subject', 'Social Impact', 'Creative Freedom'],
    market: ['BCS / Government Sector', 'Multinational Corporate (MNC)', 'Local Private Sector', 'Higher Studies'],
    strengths: ['Analytical Thinking', 'Creative Problem Solving', 'Communication', 'Technical Coding'],
    obstacles: ['Financial Constraints', 'Lack of Guidance', 'Skills Gap', 'Limited Resources'],
    improvement: ['Communication Skills', 'Technical Depth', 'Time Management', 'Networking']
  };

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'Alumnus'];
  const involvementOptions = [
    'Technical (Coding/Hardware)', 'Social (Community Service)', 
    'Leadership (Events/Society)', 'Cultural (Music/Art)', 
    'Research (Academic)', 'Sports & Athletics'
  ];
  const goalStageOptions = ['Exploring', 'Foundation Building', 'Skills Refining', 'Job Hunting', 'Final Preparation'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (needsApiKeySetup) {
        if (!apiKey.trim()) {
          setErrorMsg("Please enter a valid Gemini API Key to continue initializing the system.");
          setLoading(false);
          return;
        }
        localStorage.setItem('user_gemini_api_key', apiKey.trim());
      }

      const dnaText = `
        Department: ${dna.dept}
        Year: ${dna.year}
        Career Goal: ${dna.goals}
        Motivation: ${dna.motivation}
        Strengths: ${dna.topStrengths}
        Improvement: ${dna.improvementAreas}
        Obstacle: ${dna.majorObstacle}
        Work Style: ${dna.workStyle}
        10 Year Vision: ${dna.vision10Years}
        Daily Habits: ${dna.habits}
        Previous Involvement: ${dna.previousInvolvement}
        Current Involvement: ${dna.currentInvolvement}
      `.trim();

      const [vector, roadmap] = await Promise.all([
        getEmbedding(dnaText),
        generateRoadmap(dna)
      ]);
      
      const docRef = doc(db, 'users', profile.uid);
      const updates = {
        onboardingComplete: true,
        studentDNA: dna,
        dnaVector: vector,
        roadmap: roadmap,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updates);
      if (onComplete) {
        onComplete({ ...profile, ...updates });
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.toLowerCase().includes('key') || msg.toLowerCase().includes('api_key') || msg.toLowerCase().includes('invalid')) {
        setErrorMsg("The Gemini API Key provided appears to be invalid or missing. Please correct it and click Initialize again.");
        if (needsApiKeySetup) {
          localStorage.removeItem('user_gemini_api_key');
        }
      } else {
        setErrorMsg(`DNA synthesis paused: ${msg}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill DNA if it exists
  useEffect(() => {
    if (profile.studentDNA) {
      setDna({
        ...dna,
        ...profile.studentDNA
      });
    }
  }, [profile.studentDNA]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] py-12 px-4 shadow-inner">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 ring-1 ring-black/5">
        <div className="bg-[#006a4e] p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700] opacity-10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <Sparkles className="w-12 h-12 text-[#ffd700] mx-auto mb-4" />
          <h1 className="text-3xl font-display font-black mb-2 tracking-tight">Initialize RU Informer AI</h1>
          <p className="text-[#ffd700] font-medium opacity-90 max-w-md mx-auto">Provide your academic and personal details. I will synthesize a 4-year success path tailored specifically for your RU journey.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          {/* Section 1: Academic & Career Identity */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Academic & Career Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">University Department</label>
                <select
                  required
                  value={dna.dept}
                  onChange={(e) => setDna({ ...dna, dept: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Select Department</option>
                  {suggestions.dept.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Academic Year</label>
                <select
                  required
                  value={dna.year}
                  onChange={(e) => setDna({ ...dna, year: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Select Year</option>
                  {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Career Goal / Ambition</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Software Engineer at Therap"
                  value={dna.goals}
                  onChange={(e) => setDna({ ...dna, goals: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none font-bold text-sm"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestions.goals.map(s => (
                    <button key={s} type="button" onClick={() => setDna({...dna, goals: s})} className="text-[9px] font-black uppercase bg-[#ffd700]/10 hover:bg-[#ffd700]/30 px-2.5 py-1 rounded-full text-[#006a4e] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Goal Progress Stage</label>
                <select
                  required
                  value={dna.goalStage}
                  onChange={(e) => setDna({ ...dna, goalStage: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="Exploring">Exploring</option>
                  <option value="Foundation Building">Foundation Building</option>
                  <option value="Skills Refining">Skills Refining</option>
                  <option value="Job Hunting">Job Hunting</option>
                  <option value="Final Preparation">Final Preparation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Psychographic Research */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Psychographic & Motivation Research</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Primary Motivation</label>
                <select
                  required
                  value={dna.motivation}
                  onChange={(e) => setDna({ ...dna, motivation: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">What drives your career choice?</option>
                  {suggestions.motivation.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Job Market Preference</label>
                <select
                  required
                  value={dna.marketPreference}
                  onChange={(e) => setDna({ ...dna, marketPreference: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Target job market</option>
                  {suggestions.market.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Preferred Work Style</label>
                <select
                  required
                  value={dna.workStyle}
                  onChange={(e) => setDna({ ...dna, workStyle: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">How do you prefer to work?</option>
                  <option value="Individual Contributor">Individual Contributor</option>
                  <option value="Collaborative Team Player">Collaborative Team Player</option>
                  <option value="Leader / Manager">Leader / Manager</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">10-Year Vision</label>
                <select
                  required
                  value={dna.vision10Years}
                  onChange={(e) => setDna({ ...dna, vision10Years: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Where do you see yourself?</option>
                  <option value="Senior Industry Expert">Senior Industry Expert</option>
                  <option value="High-ranking Govt Official">High-ranking Govt Official</option>
                  <option value="Successful Business Owner">Successful Business Owner</option>
                  <option value="Academician / Researcher">Academician / Researcher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Skill & Obstacle Synthesis */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Skill & Obstacle Synthesis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Strength</label>
                <select
                  required
                  value={dna.topStrengths}
                  onChange={(e) => setDna({ ...dna, topStrengths: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Your strongest skill/attribute</option>
                  {suggestions.strengths.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Primary Obstacle</label>
                <select
                  required
                  value={dna.majorObstacle}
                  onChange={(e) => setDna({ ...dna, majorObstacle: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Biggest challenge you face</option>
                  {suggestions.obstacles.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Improvement Focus</label>
                <select
                  required
                  value={dna.improvementAreas}
                  onChange={(e) => setDna({ ...dna, improvementAreas: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">What do you want to improve?</option>
                  {suggestions.improvement.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Involvement History */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-[#006a4e] uppercase tracking-[0.2em] border-b border-gray-100 pb-2">Societal & Community Involvement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Previous Club/Society Involvement</label>
                <select
                  required
                  value={dna.previousInvolvement}
                  onChange={(e) => setDna({ ...dna, previousInvolvement: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Select Past Primary Interest</option>
                  {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Preferred Activities</label>
                <select
                  required
                  value={dna.currentInvolvement}
                  onChange={(e) => setDna({ ...dna, currentInvolvement: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm font-bold"
                >
                  <option value="">Select Current Primary Interest</option>
                  {involvementOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Technological Habits & Life Interests</label>
            <textarea
              required
              placeholder="What specific tools, methods, or rituals do you use daily?"
              value={dna.habits}
              onChange={(e) => setDna({ ...dna, habits: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#006a4e] focus:bg-white outline-none transition-all h-24 text-sm font-medium"
            />
          </div>

          {errorMsg && (
            <div className="p-5 bg-red-50 border-2 border-red-200 text-red-800 text-sm font-bold rounded-[1.5rem] flex items-start gap-3 shadow-sm">
              <span className="text-xl">⚠️</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {needsApiKeySetup && (
            <div className="bg-[#fffbeb] border-2 border-[#ffd700] rounded-[2rem] p-8 space-y-4 text-left shadow-sm">
              <div className="flex items-center gap-3 text-amber-900">
                <Sparkles className="w-6 h-6 text-[#006a4e]" />
                <span className="font-display font-black text-sm uppercase tracking-wider">AI Protocol Calibration Required</span>
              </div>
              <p className="text-xs font-medium text-amber-950/80 leading-relaxed">
                Before we can map your academic DNA and generate your personalized success roadmap, you need to configure your Gemini API Key. This key is used on the client-side to query the Gemini platform and is stored safely inside your browser's private local storage.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Gemini API Key</label>
                <input
                  type="password"
                  required
                  placeholder="Paste your API key here (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-amber-200 rounded-xl outline-none focus:border-[#006a4e] font-mono text-xs transition-colors"
                />
                <p className="text-[10px] text-amber-800/70 font-semibold italic">
                  You can get a free, official Gemini API key instantly from <a href="https://ai.studio/build" target="_blank" rel="noopener noreferrer" className="underline font-black text-[#006a4e]">Google AI Studio</a>.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006a4e] text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-[#005a41] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Synthesizing DNA & Roadmap...
              </>
            ) : (
              <>
                Initialize System Protocol
                <ChevronRight className="w-6 h-6 text-[#ffd700]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
