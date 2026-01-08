
import React, { useState, useEffect } from 'react';
import { Subject, ContentItem, User } from '../types';
import { MockStore } from '../services/store';
import { getGoogleCalendarUrl } from '../services/calendar';
import { IconPdf, IconClock, IconBell, IconLibrary, IconReview, IconCalendarPlus } from '../components/Icons';

interface SubjectDetailProps {
  items: ContentItem[];
  user: User;
}

const SubjectDetail: React.FC<SubjectDetailProps> = ({ items, user }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', code: '', color: 'bg-indigo-500' });

  useEffect(() => {
    setSubjects(MockStore.getSubjects());
    const handleUpdate = () => setSubjects(MockStore.getSubjects());
    window.addEventListener('subjects_updated', handleUpdate);
    return () => window.removeEventListener('subjects_updated', handleUpdate);
  }, []);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name || !newSub.code) return;
    MockStore.addSubject({
      id: newSub.code.toLowerCase().replace(/\s+/g, '-'),
      ...newSub
    });
    setNewSub({ name: '', code: '', color: 'bg-indigo-500' });
    setShowAddModal(false);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  
  const subjectItems = items
    .filter(i => {
        const matchesSubject = i.subjectId === selectedSubjectId;
        const isVerified = i.isVerified;
        const matchesBranch = user.role === 'admin' ? true : i.uploaderBranch === user.branch || i.uploaderBranch === 'Central Administration';
        return matchesSubject && isVerified && matchesBranch;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

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

  const handleCalendarSync = (e: React.MouseEvent, item: ContentItem) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(item, selectedSubject?.code);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!selectedSubjectId) {
    return (
      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Academic Repository</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-200"
          >
            + Add New Subject
          </button>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">New Global Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Name</label>
                  <input required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} type="text" placeholder="e.g. Cloud Computing" className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Code</label>
                  <input required value={newSub.code} onChange={e => setNewSub({...newSub, code: e.target.value})} type="text" placeholder="e.g. CS405" className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Theme Color</label>
                  <div className="flex space-x-2">
                    {['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map(c => (
                      <button 
                        key={c} 
                        type="button" 
                        onClick={() => setNewSub({...newSub, color: c})}
                        className={`w-10 h-10 rounded-xl transition-all ${c} ${newSub.color === c ? 'ring-4 ring-indigo-200 ring-offset-2' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-4 rounded-2xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg">Save Subject</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubjectId(subject.id)}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xl transition-all text-left group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${subject.color} opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-150 transition-transform`}></div>
              <div className={`${subject.color} w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:rotate-12`}>
                <span className="text-white font-black text-xl">{subject.code.slice(0, 2)}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight">{subject.name}</h3>
              <p className="text-slate-400 font-bold mt-1 tracking-widest uppercase text-xs">{subject.code}</p>
              <div className="mt-6 flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                Browse Repository →
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <button 
        onClick={() => setSelectedSubjectId(null)}
        className="group bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl text-indigo-600 dark:text-indigo-400 font-black flex items-center shadow-sm border border-slate-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all uppercase text-xs tracking-widest"
      >
        <span className="mr-3 transition-transform group-hover:-translate-x-1">←</span> Library Overview
      </button>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-indigo-200 dark:shadow-none">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
            {selectedSubject?.code}
          </div>
          <div className="bg-indigo-400/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
            {user.role === 'admin' ? 'GLOBAL REPO' : `${user.branch} REPO`}
          </div>
        </div>
        <h2 className="text-4xl font-black uppercase tracking-tight">{selectedSubject?.name}</h2>
        <p className="text-indigo-100/80 mt-2 font-medium">Branch Archives: Notes, Labs & Tests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">The Timeline</h3>
          
          <div className="relative border-l-4 border-indigo-50 dark:border-indigo-900/30 ml-6 pl-12 space-y-12">
            {subjectItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No saved materials yet.</p>
              </div>
            ) : (
              subjectItems.map(item => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[3.25rem] top-2 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-md border-4 border-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {item.type === 'note' ? <IconLibrary className="w-5 h-5" /> : item.type === 'deadline' ? <IconClock className="w-5 h-5" /> : <IconBell className="w-5 h-5" />}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                            item.type === 'note' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                            item.type === 'deadline' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                            item.type === 'test' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                            {item.type}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase">
                            {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(item.type === 'deadline' || item.type === 'test') && (
                          <button 
                            onClick={(e) => handleCalendarSync(e, item)}
                            className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors z-20 relative"
                            title="Add to Google Calendar"
                          >
                            <IconCalendarPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed italic">"{item.content}"</p>
                    
                    {item.file && (
                      <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => openPdf(item.file!.data)}
                          className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-6 py-3 rounded-2xl text-xs font-black transition-all transform active:scale-95 uppercase tracking-widest"
                        >
                          <IconPdf className="mr-3 w-4 h-4" /> View PDF Asset
                        </button>
                      </div>
                    )}
                    
                    {item.type === 'deadline' && item.deadlineDate && (
                      <div className="flex items-center text-red-600 dark:text-red-400 text-[10px] font-black bg-red-50 dark:bg-red-900/20 px-5 py-3 rounded-2xl inline-block uppercase tracking-widest">
                        <IconClock className="mr-3 w-4 h-4" />
                        LIMIT: {new Date(item.deadlineDate).toLocaleDateString()}
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 mr-3 uppercase">
                          {item.uploaderId.slice(0, 2)}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Saviour {item.uploaderId} {user.role === 'admin' && `(${item.uploaderBranch.split(' ')[0]})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest text-[10px]">Branch Repos Stats</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3 text-blue-600 dark:text-blue-400">
                    <IconLibrary className="w-4 h-4" />
                  </span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Notes</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{subjectItems.filter(i => i.type === 'note').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mr-3 text-amber-600 dark:text-amber-400">
                    <IconClock className="w-4 h-4" />
                  </span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tests</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{subjectItems.filter(i => i.type === 'test').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-3 text-green-600 dark:text-green-400">
                    <IconReview className="w-4 h-4" />
                  </span>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Active Saviours</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{new Set(subjectItems.map(i => i.uploaderId)).size}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
