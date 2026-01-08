
import React from 'react';
import { User } from '../types';
import { IconHome, IconLibrary, IconUpload, IconReview, IconUser } from './Icons';

interface LayoutProps {
  user: User | null;
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, children, onLogout, activeTab, setActiveTab }) => {
  if (!user) return <>{children}</>;

  const tabs = [
    { id: 'dashboard', label: 'Feed', icon: <IconHome /> },
    { id: 'subjects', label: 'Library', icon: <IconLibrary /> },
    { id: 'contributor', label: 'Upload', icon: <IconUpload /> },
    { id: 'karma', label: 'Karma Hub', icon: <IconReview /> }, 
    { id: 'verification', label: 'Review', icon: <IconReview /> },
    { id: 'profile', label: 'Profile', icon: <IconUser /> },
  ];

  if (user.role === 'admin') {
      tabs.push({ id: 'admin', label: 'Admin Panel', icon: <IconUser /> });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40 transform -rotate-6">
              <span className="text-white font-black text-2xl">Ss</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Semester Saviours</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none">Academic Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-black text-white uppercase tracking-tight">{user.enrollmentId}</span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-indigo-500">LVL {user.level}</span>
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                <span className="text-[10px] font-black text-amber-500">{user.karmaPoints} KARMA</span>
                {user.role === 'admin' && (
                    <span className="ml-2 bg-purple-600 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">ADMIN</span>
                )}
              </div>
            </div>

            <div 
              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-800 cursor-pointer hover:scale-105 transition-all"
              onClick={() => setActiveTab('profile')}
            >
              {user.profilePic ? (
                <img src={user.profilePic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <IconUser className="w-5 h-5 text-slate-400" />
                </div>
              )}
            </div>

            <button 
              onClick={onLogout}
              className="bg-red-900/20 text-red-400 p-2.5 rounded-xl text-lg hover:bg-red-900/40 transition-colors shadow-sm"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex justify-center space-x-2 sm:space-x-8 overflow-x-auto no-scrollbar pb-1 border-t border-slate-800/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-3 flex items-center space-x-2 font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap border-b-4 ${
                activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="w-5 h-5">{tab.icon}</div>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-12 animate-in fade-in duration-700">
        {children}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-xl font-black mb-2 text-white opacity-40 uppercase tracking-[0.2em]">SEMESTER SAVIOURS</div>
          <div className="text-slate-500 text-sm font-medium italic">
            "Contribute to earn karma points since karma hits back"
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
