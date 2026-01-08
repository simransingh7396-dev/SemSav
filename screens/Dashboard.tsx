
import React from 'react';
import { ContentItem, User } from '../types';
import { SUBJECTS } from '../constants';
import { getGoogleCalendarUrl } from '../services/calendar';
import { IconBell, IconClock, IconLibrary, IconPdf, IconCalendarPlus } from '../components/Icons';

interface DashboardProps {
  items: ContentItem[];
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ items, user }) => {
  const branchFilteredItems = user.role === 'admin' 
    ? items 
    : items.filter(i => 
        i.uploaderBranch === user.branch || 
        i.uploaderBranch === 'Central Administration' || 
        i.uploaderId === 'ADMIN'
      );
    
  const verifiedItems = branchFilteredItems.filter(i => i.isVerified).sort((a, b) => b.timestamp - a.timestamp);
  
  const priorityItems = verifiedItems.filter(i => 
    i.type === 'cancellation' || i.type === 'test' || (i.type === 'deadline' && i.deadlineDate)
  );

  const recentAlerts = priorityItems.filter(i => {
    if (!i.deadlineDate) return true;
    const d = new Date(i.deadlineDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime() > Date.now();
  }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  const upcomingDeadlines = verifiedItems.filter(i => 
    (i.type === 'deadline' || i.type === 'test') && 
    i.deadlineDate && 
    (() => {
        const d = new Date(i.deadlineDate);
        d.setHours(23, 59, 59, 999);
        return d.getTime() > Date.now();
    })()
  ).sort((a, b) => {
    return new Date(a.deadlineDate!).getTime() - new Date(b.deadlineDate!).getTime();
  }).slice(0, 5);

  const getSubject = (id: string) => SUBJECTS.find(s => s.id === id);

  const getAlertLabel = (type: string) => {
    switch(type) {
      case 'cancellation': return 'Class Dropped';
      case 'test': return 'Exam / Test Alert';
      case 'deadline': return 'Submission Due';
      default: return 'Urgent Update';
    }
  };

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
    const subject = getSubject(item.subjectId);
    const url = getGoogleCalendarUrl(item, subject?.code || 'ACAD');
    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Invalid date format. Calendar sync failed.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2 space-y-12">
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Verified Archives</h2>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                {user.role === 'admin' ? 'Global Administration View' : `Exclusively for ${user.branch} Students`}
              </p>
            </div>
            <div className="bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              Peer Validated
            </div>
          </div>

          <div className="space-y-6">
            {verifiedItems.length === 0 ? (
              <div className="bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-800">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No verified updates available.</p>
                <p className="text-slate-600 text-[10px] mt-2 font-black uppercase tracking-widest italic">Check the review queue to help verify pending items.</p>
              </div>
            ) : (
              verifiedItems.map(item => {
                const sub = getSubject(item.subjectId);
                return (
                  <div key={item.id} className="bg-slate-900 rounded-[2.5rem] p-8 shadow-lg border border-slate-800 hover:border-indigo-500/30 transition-all group relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`${sub?.color || 'bg-slate-700'} text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-sm`}>
                          {sub?.name || item.subjectId}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(item.type === 'deadline' || item.type === 'test') && (
                          <button 
                            onClick={(e) => handleCalendarSync(e, item)}
                            className="bg-emerald-900/30 text-emerald-400 p-2 rounded-lg hover:bg-emerald-900/80 transition-colors z-20 relative"
                            title="Sync to Calendar"
                          >
                            <IconCalendarPlus className="w-4 h-4" />
                          </button>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                            item.type === 'cancellation' ? 'bg-red-900/30 text-red-400' :
                            item.type === 'deadline' ? 'bg-amber-900/30 text-amber-400' :
                            'bg-indigo-900/30 text-indigo-400'
                        }`}>
                            {item.type}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 font-medium mb-6 leading-relaxed italic border-l-2 border-slate-800 pl-4">
                      "{item.content}"
                    </p>
                    
                    {item.file && (
                       <button 
                          onClick={() => openPdf(item.file!.data)}
                          className="mb-4 inline-flex items-center bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 px-5 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-indigo-500/20"
                        >
                          <IconPdf className="mr-2 w-4 h-4" /> View Attachment
                        </button>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        By Saviour {item.uploaderId.slice(0, 4)}... {user.role === 'admin' && `(${item.uploaderBranch})`}
                      </span>
                      <div className="flex items-center space-x-1 text-emerald-500">
                        <span className="text-lg">▲</span>
                        <span className="text-xs font-black">{item.upvotes}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-[2.5rem] p-8 border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-6">
            <IconBell className="text-indigo-400 w-6 h-6" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Priority Alerts</h3>
          </div>
          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No active alerts.</p>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-2xl border transition-all ${alert.isVerified ? 'bg-slate-900/50 border-white/5' : 'bg-amber-900/10 border-amber-500/20'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      alert.type === 'cancellation' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'
                    }`}>
                      {getAlertLabel(alert.type)}
                    </span>
                    <div className="flex items-center space-x-2">
                       {(alert.type === 'deadline' || alert.type === 'test') && (
                          <button 
                            onClick={(e) => handleCalendarSync(e, alert)}
                            className="text-emerald-500 hover:text-emerald-400 transition-colors"
                            title="Sync to Calendar"
                          >
                            <IconCalendarPlus className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-[9px] font-black text-slate-500">
                          {new Date(alert.timestamp).toLocaleDateString()}
                        </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm font-bold leading-tight">{alert.title}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
          <div className="flex items-center space-x-3 mb-6">
            <IconClock className="text-amber-500 w-6 h-6" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Timeline</h3>
          </div>
          <div className="space-y-4">
             {upcomingDeadlines.length === 0 ? (
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No upcoming deadlines.</p>
            ) : (
              upcomingDeadlines.map(item => (
                <div key={item.id} className={`flex items-start justify-between p-4 rounded-2xl transition-colors border group ${item.isVerified ? 'bg-slate-900 hover:bg-slate-800 border-transparent hover:border-slate-700' : 'bg-indigo-900/10 border-indigo-500/20'}`}>
                  <div className="flex items-start space-x-4">
                    <div className="bg-slate-800 text-slate-400 w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                      <span className="text-xs font-black uppercase">{new Date(item.deadlineDate!).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-sm font-black text-white">{new Date(item.deadlineDate!).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-slate-200 text-sm font-bold line-clamp-1">{item.title}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        {getSubject(item.subjectId)?.code || item.subjectId} • {item.type}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleCalendarSync(e, item)}
                    className="opacity-0 group-hover:opacity-100 bg-emerald-500/10 text-emerald-500 p-2 rounded-lg hover:bg-emerald-500/20 transition-all"
                    title="Add to Google Calendar"
                  >
                    <IconCalendarPlus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
