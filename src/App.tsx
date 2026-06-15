import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { UserProfile, UserRole } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Loader2, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    if (!user) return;
    setLoading(true);
    try {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        role,
        onboardingComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfdfc]">
        <div className="w-16 h-16 bg-[#006a4e] rounded-2xl flex items-center justify-center shadow-2xl animate-bounce mb-8">
            <GraduationCap className="text-[#ffd700] w-8 h-8" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin mb-4 text-[#006a4e] opacity-20" />
        <p className="font-display font-black text-lg text-[#006a4e] italic tracking-tighter">RU Informer is synthesizing...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#006a4e] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full text-center"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-display font-black text-[#006a4e] tracking-tight mb-2">Welcome</h1>
            <p className="text-gray-500 font-medium italic text-sm">Please select your role to continue.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelect('student')}
              className="group flex flex-col items-center justify-center p-6 border-2 border-gray-50 rounded-2xl hover:border-[#006a4e] hover:bg-emerald-50 transition-all"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-3xl mb-3">🎓</div>
              <span className="font-black text-[#006a4e] uppercase tracking-widest text-[10px]">Student</span>
            </button>
            <button
              onClick={() => handleRoleSelect('admin')}
              className="group flex flex-col items-center justify-center p-6 border-2 border-gray-50 rounded-2xl hover:border-[#ffd700] hover:bg-yellow-50 transition-all"
            >
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center text-3xl mb-3">🏛️</div>
              <span className="font-black text-yellow-700 uppercase tracking-widest text-[10px]">Club Admin</span>
            </button>
          </div>
          
          <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-widest">Rajshahi University Career Intelligence</p>
        </motion.div>
      </div>
    );
  }

  if (profile.role === 'student') {
    if (!profile.onboardingComplete) {
      return <Onboarding profile={profile} onComplete={(updatedProfile) => setProfile(updatedProfile)} />;
    }
    return <StudentDashboard profile={profile} />;
  }

  return <AdminDashboard profile={profile} />;
}
