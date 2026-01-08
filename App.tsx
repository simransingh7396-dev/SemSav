
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import SubjectDetail from './screens/SubjectDetail';
import Contributor from './screens/Contributor';
import VerificationQueue from './screens/VerificationQueue';
import Profile from './screens/Profile';
import KarmaHub from './screens/KarmaHub';
import AdminPanel from './screens/AdminPanel';
import { User, ContentItem } from './types';
import { MockStore } from './services/store';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const prevItemsCount = useRef<number>(0);
  const initialLoadDone = useRef<boolean>(false);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const storedUser = localStorage.getItem('openverse_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    const unsubscribe = MockStore.subscribe((items) => {
      setContentItems(items);
      setLoading(false);
    });

    const handleUserUpdate = (e: Event) => {
      const updatedUser = (e as CustomEvent).detail;
      if (updatedUser) setUser(updatedUser);
    };

    window.addEventListener('user_updated', handleUserUpdate as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener('user_updated', handleUserUpdate as EventListener);
    };
  }, []);

  // Check for upcoming deadlines
  useEffect(() => {
    if (user && contentItems.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const checkDeadlines = () => {
        const now = Date.now();
        const tomorrow = now + 24 * 60 * 60 * 1000;
        
        contentItems.forEach(item => {
          if (item.uploaderBranch === user.branch && (item.type === 'deadline' || item.type === 'test') && item.deadlineDate) {
            const dueDate = new Date(item.deadlineDate).getTime();
            if (dueDate > now && dueDate < tomorrow) {
              const notifId = `deadline-${item.id}`;
              // Simple check to avoid spamming (using session storage for this session)
              if (!sessionStorage.getItem(notifId)) {
                new Notification(`Upcoming ${item.type === 'test' ? 'Exam' : 'Deadline'}: ${item.title}`, {
                  body: `Due tomorrow! Check the portal for details.`,
                  icon: '/icon-192.png' // Fallback if available
                });
                sessionStorage.setItem(notifId, 'true');
              }
            }
          }
        });
      };
      
      checkDeadlines();
    }
  }, [user, contentItems]);

  // Handle New Item Notifications
  useEffect(() => {
    if (loading) return;

    if (!initialLoadDone.current) {
      prevItemsCount.current = contentItems.length;
      initialLoadDone.current = true;
      return;
    }

    if (contentItems.length > prevItemsCount.current) {
      // Find the new items
      const newItems = contentItems.slice(prevItemsCount.current);
      
      if (user && 'Notification' in window && Notification.permission === 'granted') {
        newItems.forEach(item => {
          // Only notify if it's for my branch and I didn't upload it
          if (item.uploaderBranch === user.branch && item.uploaderId !== user.enrollmentId && item.isVerified) {
             new Notification(`New ${item.type.toUpperCase()} Uploaded!`, {
               body: `${item.title} has been added to the ${item.uploaderBranch} repository.`,
               icon: '/icon-192.png'
             });
          }
        });
      }
      prevItemsCount.current = contentItems.length;
    }
  }, [contentItems, loading, user]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('openverse_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('openverse_user');
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-[2rem] animate-spin mb-8 shadow-2xl shadow-indigo-500/20"></div>
        <div className="text-center">
          <p className="text-indigo-600 font-black text-4xl tracking-tighter animate-pulse mb-2 uppercase">Semester Saviours</p>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Knowledge Matrix</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard items={contentItems} user={user} />;
      case 'subjects': return <SubjectDetail items={contentItems} user={user} />;
      case 'contributor': return <Contributor user={user} />;
      case 'karma': return <KarmaHub user={user} />;
      case 'verification': return <VerificationQueue items={contentItems} user={user} />;
      case 'profile': return <Profile user={user} />;
      case 'admin': return <AdminPanel user={user} />;
      default: return <Dashboard items={contentItems} user={user} />;
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
