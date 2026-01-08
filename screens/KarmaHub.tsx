
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { MockStore } from '../services/store';
import { IconReview, IconUser } from '../components/Icons';

interface KarmaHubProps {
  user: User;
}

const KarmaHub: React.FC<KarmaHubProps> = ({ user: currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeView, setActiveView] = useState<'leaderboard' | 'directory' | 'guide'>('leaderboard');

  useEffect(() => {
    setUsers(MockStore.getAllUsers());
  }, []);

  // Filter users by the current user's branch
  const branchUsers = users.filter(u => u.branch === currentUser.branch);
  const leaderboard = [...branchUsers].sort((a, b) => b.karmaPoints - a.karmaPoints).slice(0, 10);
  const directory = [...branchUsers].sort((a, b) => b.registrationDate - a.registrationDate);

  const karmaRules = [
    { task: "Upload academic material", points: "20 XP", description: "Get started by sharing knowledge." },
    { task: "Verified Contribution", points: "100 XP + 10 Karma", description: "When your post reaches 5 upvotes." },
    { task: "Community Level Up", points: "Level Up", description: "Earned for every 500 XP accumulated." },
    { task: "Top Contributor", points: "Prestige", description: "Stay in the Top 10 to be featured." },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex justify-center space-x-2">
        <button 
          onClick={() => setActiveView('leaderboard')}
          className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeView === 'leaderboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          Leaderboard
        </button>
        <button 
          onClick={() => setActiveView('directory')}
          className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeView === 'directory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          {currentUser.branch.split(' (')[0]} Saviours
        </button>
        <button 
          onClick={() => setActiveView('guide')}
          className={`px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeView === 'guide' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          Karma Guide
        </button>
      </div>

      {activeView === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Hall of Saviours</h2>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Exclusively for {currentUser.branch}</p>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated Real-Time</div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {leaderboard.map((user, idx) => (
              <div key={user.enrollmentId} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:scale-[1.01] transition-transform group">
                <div className="flex items-center space-x-6">
                  <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-2xl ${idx === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : idx === 1 ? 'bg-slate-300 text-slate-600' : idx === 2 ? 'bg-orange-300 text-white shadow-lg shadow-orange-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-50 dark:border-slate-700 shadow-inner">
                      {user.profilePic ? (
                        <img src={user.profilePic} className="w-full h-full object-cover" alt={user.enrollmentId} />
                      ) : (
                        <IconUser className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white uppercase text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.enrollmentId}</h3>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-widest">Level {user.level}</span>
                        <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Rank</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-indigo-600 dark:text-indigo-400 font-black text-2xl tracking-tighter">{user.karmaPoints}</div>
                  <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">Karma Points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'directory' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Member Access Directory</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Saviours in {currentUser.branch}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Member Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Joined</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Matrix Lvl</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Hub State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {directory.map(user => (
                    <tr key={user.enrollmentId} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {user.profilePic ? (
                              <img src={user.profilePic} className="w-full h-full object-cover" />
                            ) : (
                              <IconUser className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.enrollmentId}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {new Date(user.registrationDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Level {user.level}</span>
                          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{user.xp} XP</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full w-fit border border-emerald-100 dark:border-emerald-800">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 animate-pulse"></div>
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Contribution Protocol</h2>
            <div className="space-y-4">
              {karmaRules.map((rule, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center space-x-6 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                    <IconReview className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-widest mb-1">{rule.task}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{rule.description}</p>
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest shadow-md shadow-indigo-200 dark:shadow-none">{rule.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-indigo-600 rounded-[3rem] p-12 text-white flex flex-col justify-center items-center text-center space-y-8 shadow-2xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-5xl border border-white/20 shadow-xl">
              🎮
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-3">Elevate {currentUser.branch.split(' (')[0]}</h3>
              <p className="opacity-80 font-medium leading-relaxed">Verified contributions in your branch yield the highest XP rewards. Secure your spot on the {currentUser.branch} Hall of Saviours today.</p>
            </div>
            <div className="bg-white/10 w-full p-8 rounded-[2rem] border border-white/20 text-xs font-black uppercase tracking-[0.1em] backdrop-blur-md">
              XP Progress: <br/>
              Lvl 1 → 2: 500 XP Accumulated<br/>
              Lvl 2 → 3: 1000 XP Total Required
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KarmaHub;
