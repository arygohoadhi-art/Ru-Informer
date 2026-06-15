import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion } from 'motion/react';
import { Sparkles, GraduationCap, Users, ShieldCheck, ChevronRight, BookOpen, Rocket, MapPin, LogIn } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] selection:bg-[#ffd700] selection:text-[#004d39] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#006a4e]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ffd700]/5 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-20 flex items-center justify-between p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006a4e] rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
            <GraduationCap className="text-[#ffd700] w-6 h-6" />
          </div>
          <span className="font-display font-black text-2xl text-[#004d39] tracking-tighter">RU Informer AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#preview" className="text-sm font-bold text-gray-500 hover:text-[#006a4e] transition-colors">How it works</a>
          <button onClick={handleLogin} className="px-6 py-2.5 bg-[#006a4e] text-white rounded-full text-sm font-bold hover:bg-[#004d39] shadow-lg shadow-[#006a4e]/20 transition-all">
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-[#006a4e] rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100"
            >
              <Sparkles className="w-3 h-3" />
              Intelligence for Rajshahi University
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl font-display font-black text-[#004d39] leading-[1.05] tracking-tight"
            >
              Your Career, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006a4e] to-[#009e73]">Synthesized.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 max-w-lg leading-relaxed font-medium"
            >
              A bridge between your department and professional success. Get a personalized 4-year roadmap, club matches, and AI-driven mentorship tailored for RU.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={handleLogin}
                className="group relative flex-1 bg-[#006a4e] text-white p-6 rounded-3xl text-left overflow-hidden shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10">
                  <Users className="w-8 h-8 text-[#ffd700] mb-4" />
                  <h3 className="text-xl font-bold mb-1">Student Entry</h3>
                  <p className="text-white/60 text-sm">Build your DNA and start your journey</p>
                </div>
                <div className="absolute bottom-6 right-6 group-hover:translate-x-2 transition-transform">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </button>

              <button 
                onClick={handleLogin}
                className="group relative flex-1 bg-white border-2 border-gray-100 text-[#004d39] p-6 rounded-3xl text-left overflow-hidden transition-all hover:border-[#006a4e]/20"
              >
                <div className="relative z-10">
                  <ShieldCheck className="w-8 h-8 text-gray-400 group-hover:text-[#006a4e] transition-colors mb-4" />
                  <h3 className="text-xl font-bold mb-1">Club Admin</h3>
                  <p className="text-gray-400 text-sm">Manage society events & recruitment</p>
                </div>
                <div className="absolute bottom-6 right-6 group-hover:translate-x-2 transition-transform">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </button>
            </motion.div>
          </div>

          <div className="relative">
            {/* Visual Preview Card */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[3rem] p-1 shadow-[0_32px_64px_-12px_rgba(0,106,78,0.15)] border border-gray-100 relative group"
            >
              <div className="bg-gray-50 rounded-[2.8rem] p-10 space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-200 pb-6">
                  <div className="w-12 h-12 bg-[#ffd700] rounded-2xl flex items-center justify-center text-[#006a4e]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">RU Informer Preview</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Intelligence</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-sm font-medium text-gray-700 italic">"Generating a 4-year path for a CSE student who loves painting..."</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-black text-[#006a4e] uppercase mb-1">Rec Club</p>
                      <p className="text-xs font-bold text-gray-900">RU Fine Arts Society</p>
                    </div>
                    <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100">
                      <p className="text-[10px] font-black text-yellow-700 uppercase mb-1">Campus Hub</p>
                      <p className="text-xs font-bold text-gray-900">Iblis Field @ 4PM</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#004d39] rounded-3xl text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase">Success Metrics</span>
                    <Rocket className="w-4 h-4 text-[#ffd700]" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#ffd700] w-[85%]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold opacity-60">
                      <span>Semantic Fit</span>
                      <span>85% Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Accents */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ffd700]/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#006a4e]/20 rounded-full blur-3xl" />
          </div>
        </div>
      </main>

      <section id="preview" className="max-w-7xl mx-auto px-8 py-32 border-t border-gray-100">
        <div className="text-center space-y-6 mb-20">
          <h2 className="text-4xl font-display font-black text-[#004d39]">Why RU Informer AI?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">We analyzed thousands of alumni paths to provide you with the most accurate campus intelligence possible.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: <BookOpen className="w-6 h-6" />, title: 'Academic DNA', desc: 'Synthesize your department studies with hobbies to create a unique profile.' },
            { icon: <MapPin className="w-6 h-6" />, title: 'RU Locations', desc: 'Find your spots at Paris Road, Tukitaki, or Iblis Field for focus & networking.' },
            { icon: <Sparkles className="w-6 h-6" />, title: 'Career Synthesis', desc: 'Get a 4-year roadmap that connects graduation directly to career success.' }
          ].map((feature, i) => (
            <div key={i} className="space-y-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#006a4e]">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-50 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50 grayscale">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-display font-black text-xl text-gray-800 tracking-tighter">RU Informer AI</span>
          </div>
          <p className="text-sm text-gray-400 font-medium font-mono">© 2026 Rajshahi University Intelligence Hub</p>
        </div>
      </footer>
    </div>
  );
}
