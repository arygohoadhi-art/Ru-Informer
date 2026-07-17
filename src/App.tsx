import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { UserProfile, UserRole } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthorDashboard from './components/AuthorDashboard';
import { Loader2, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleView, setActiveRoleView] = useState<'student' | 'admin' | 'author' | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const profileData = docSnap.data() as UserProfile;
              setProfile(profileData);
              setActiveRoleView((prev) => prev || profileData.role);
            } else {
              setProfile(null);
              setActiveRoleView(null);
            }
            setLoading(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            setLoading(false);
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setActiveRoleView(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
      setActiveRoleView(role);
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
    const guestProfile: UserProfile = {
      uid: 'guest',
      email: 'guest@ru.informer.com',
      displayName: 'Guest Student',
      role: 'student',
      onboardingComplete: true,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    
    const currentView = activeRoleView || 'student';
    
    if (currentView === 'student') {
      return (
        <StudentDashboard 
          profile={guestProfile} 
          activeRoleView={currentView}
          onRoleChange={setActiveRoleView}
        />
      );
    }
    
    if (currentView === 'author') {
      return (
        <AuthorDashboard 
          profile={guestProfile} 
          activeRoleView={currentView}
          onRoleChange={setActiveRoleView}
        />
      );
    }
    
    return (
      <AdminDashboard 
        profile={guestProfile} 
        activeRoleView={currentView}
        onRoleChange={setActiveRoleView}
      />
    );
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleRoleSelect('student')}
              className="group flex flex-col items-center justify-center p-4 border-2 border-gray-50 rounded-2xl hover:border-[#006a4e] hover:bg-emerald-50 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-3">🎓</div>
              <span className="font-black text-[#006a4e] uppercase tracking-widest text-[9px]">Student</span>
            </button>
            <button
              onClick={() => handleRoleSelect('admin')}
              className="group flex flex-col items-center justify-center p-4 border-2 border-gray-50 rounded-2xl hover:border-[#ffd700] hover:bg-yellow-50 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl mb-3">🏛️</div>
              <span className="font-black text-yellow-700 uppercase tracking-widest text-[9px]">Club Admin</span>
            </button>
            <button
              onClick={() => handleRoleSelect('author')}
              className="group flex flex-col items-center justify-center p-4 border-2 border-gray-50 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-3">✍️</div>
              <span className="font-black text-purple-700 uppercase tracking-widest text-[9px]">Author</span>
            </button>
          </div>
          
          <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-widest">Rajshahi University Career Intelligence</p>
        </motion.div>
      </div>
    );
  }

  if (activeRoleView === 'student') {
    if (!profile.onboardingComplete) {
      return (
        <Onboarding 
          profile={profile} 
          onComplete={(updatedProfile) => {
            setProfile(updatedProfile);
            setActiveRoleView(updatedProfile.role);
          }} 
        />
      );
    }
    return (
      <StudentDashboard 
        profile={profile} 
        activeRoleView={activeRoleView} 
        onRoleChange={setActiveRoleView} 
      />
    );
  }

  if (activeRoleView === 'author') {
    return (
      <AuthorDashboard 
        profile={profile} 
        activeRoleView={activeRoleView} 
        onRoleChange={setActiveRoleView} 
      />
    );
  }

  return (
    <AdminDashboard 
      profile={profile} 
      activeRoleView={activeRoleView} 
      onRoleChange={setActiveRoleView} 
    />
  );
}
