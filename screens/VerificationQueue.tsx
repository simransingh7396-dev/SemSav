
import React from 'react';
import { ContentItem, User } from '../types';
import { SUBJECTS, UPVOTE_THRESHOLD } from '../constants.tsx';
import { MockStore } from '../services/store';
import { IconReview, IconPdf } from '../components/Icons';

interface VerificationQueueProps {
  items: ContentItem[];
  user: User;
}

const VerificationQueue: React.FC<VerificationQueueProps> = ({ items, user }) => {
  const currentUser = user;
  const isAdmin = currentUser?.role === 'admin';
  const userId = currentUser.enrollmentId;
  
  const unverifiedItems = items.filter(i => 
    !i.isVerified && (isAdmin || i.uploaderBranch === currentUser?.branch)
  ).sort((a, b) => b.timestamp - a.timestamp);

  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);

  const openPdf = (dataUrl: string) => {
    try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(arr[arr.length - 1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], {type:mime});
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    } catch (e) {
        console.error("PDF Open Error:", e);
        alert("Unable to open PDF. The file data might be corrupted.");
    }
  };

  const handleAdminReject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm("ADMIN ACTION: Permanently reject and delete this contribution?")) {
        await MockStore.deleteItem(id, user.enrollmentId, true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Verification Protocol</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            {isAdmin ? 'Global Administrative Review' : `Reviewing ${currentUser?.branch} Contributions`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
            <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                Pass: {UPVOTE_THRESHOLD} Upvotes
            </div>
            <div className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                Reject: 5 Downvotes
            </div>
        </div>
      </div>

      {unverifiedItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-16 text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-center mb-6">
            <IconReview className="w-16 h-16 text-indigo-100 dark:text-indigo-900/40" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Queue Clear</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">
            {isAdmin ? 'System-wide verification complete.' : `All ${currentUser?.branch} data has been synchronized.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {unverifiedItems.map(item => {
            const sub = getSubject(item.subjectId);
            const upProgress = (item.upvotes / UPVOTE_THRESHOLD) * 100;
            const downProgress = (item.downvotes / 5) * 100;
            const hasVoted = item.votedUsers && item.votedUsers.includes(userId);
            const isUploader = item.uploaderId === userId;
            const canVote = isAdmin || (!hasVoted && !isUploader);

            return (
              <div key={item.id} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border ${isAdmin ? 'border-indigo-500/30' : 'border-slate-100 dark:border-slate-800'} hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all group`}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      {isAdmin && (
                        <span className="text-[9px] font-black text-white bg-slate-700 px-2 py-1 rounded-md uppercase tracking-widest">
                            {item.uploaderBranch.split(' ')[0]}
                        </span>
                      )}
                      <span className={`${sub?.color || 'bg-slate-600'} text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-md`}>
                        {sub?.code || 'MISC'}
                      </span>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl italic leading-relaxed border border-slate-100 dark:border-slate-800">"{item.content}"</p>
                    
                    {item.file && (
                        <button 
                            onClick={() => openPdf(item.file!.data)}
                            className="mb-6 inline-flex items-center bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest"
                        >
                          <IconPdf className="mr-2 w-4 h-4" /> Review Attached PDF
                        </button>
                    )}

                    <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Commit ID: {item.uploaderId}</div>
                  </div>

                  <div className="w-full md:w-72 flex flex-col justify-center space-y-6">
                    <div className="space-y-4">
                      {/* Upvote Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verification Upvotes</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{item.upvotes} / {UPVOTE_THRESHOLD}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-700" 
                            style={{ width: `${Math.min(upProgress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Downvote Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Rejection Downvotes</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{item.downvotes} / 5</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                          <div 
                            className="h-full bg-rose-500 transition-all duration-700" 
                            style={{ width: `${Math.min(downProgress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        disabled={!canVote}
                        onClick={() => MockStore.vote(item.id, 'up', userId, currentUser.role)}
                        className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg ${
                          !canVote
                          ? 'bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-800 cursor-not-allowed border border-slate-100 dark:border-slate-900'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none'
                        }`}
                      >
                        <span className="text-lg">✅</span>
                        <span className="text-[10px] uppercase tracking-widest">Upvote</span>
                      </button>
                      <button 
                        disabled={!canVote}
                        onClick={() => MockStore.vote(item.id, 'down', userId, currentUser.role)}
                        className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg ${
                          !canVote
                          ? 'bg-slate-50 dark:bg-slate-950 text-slate-300 dark:text-slate-800 cursor-not-allowed border border-slate-100 dark:border-slate-900'
                          : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                        }`}
                      >
                        <span className="text-lg">❌</span>
                        <span className="text-[10px] uppercase tracking-widest">Downvote</span>
                      </button>
                    </div>

                    {isAdmin && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 animate-in fade-in">
                            <button 
                                onClick={() => MockStore.forceVerify(item.id)}
                                className="col-span-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transform active:scale-95 transition-all"
                            >
                                ⚡ Force Pass
                            </button>
                             <button 
                                onClick={(e) => handleAdminReject(e, item.id)}
                                className="col-span-1 bg-red-900/80 hover:bg-red-900 text-red-200 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg transform active:scale-95 transition-all border border-red-800"
                            >
                                🗑️ Reject
                            </button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;
