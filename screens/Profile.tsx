
import React, { useState, useRef, useEffect } from 'react';
import { User, ContentItem } from '../types';
import { MockStore } from '../services/store';
import { IconCamera, IconUser, IconPdf } from '../components/Icons';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [mobile, setMobile] = useState(user.mobile);
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myItems, setMyItems] = useState<ContentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize user contributions with the store
  useEffect(() => {
    const unsubscribe = MockStore.subscribe((items) => {
      const filtered = items.filter(i => i.uploaderId === user.enrollmentId);
      setMyItems(filtered);
    });
    return () => {
      unsubscribe();
    };
  }, [user.enrollmentId]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    MockStore.updateUserProfile(user.enrollmentId, { mobile });
    setTimeout(() => {
      setIsUpdating(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      MockStore.updateUserProfile(user.enrollmentId, { profilePic: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const xpProgress = (user.xp / 500) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-800"></div>
        
        <div className="px-10 pb-10">
          <div className="relative -mt-20 mb-6 flex justify-center">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white dark:bg-slate-700 p-1.5 shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover rounded-[2rem]" alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center">
                    <IconUser className="w-16 h-16 text-slate-300 dark:text-slate-500" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-4 border-white dark:border-slate-800"
              >
                <IconCamera className="w-6 h-6" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} className="hidden" accept="image/*" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{user.enrollmentId}</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1 mb-2">{user.branch} Saviour</p>
            <p className="text-slate-300 dark:text-slate-600 font-bold uppercase text-[9px] tracking-[0.2em] mb-4">Deployed {new Date(user.registrationDate).toLocaleDateString()}</p>
            
            <div className="max-w-xs mx-auto space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Expertise Lvl {user.level}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">{user.xp} / 500 XP</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000" 
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <div className="inline-flex items-center px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-xs font-black uppercase tracking-widest mt-2 border border-amber-200 dark:border-amber-800">
                ✨ {user.karmaPoints} Karma Points
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="max-w-md mx-auto space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Secure Contact</label>
              <input 
                type="tel" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Update mobile..."
                className="w-full p-5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" 
              />
            </div>

            <button type="submit" disabled={isUpdating} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-xs">Update Matrix Identity</button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Contributions</h3>
        {myItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700">
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No contributions yet. Start contributing to earn Karma!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myItems.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                      {item.type}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${item.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight">{item.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">"{item.content}"</p>
                  {item.file && (
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase mb-4">
                      <IconPdf className="w-4 h-4 mr-1" /> PDF Attached ({(item.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
