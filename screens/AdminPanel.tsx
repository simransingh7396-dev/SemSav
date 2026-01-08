
import React, { useState, useEffect } from 'react';
import { User, ContentItem } from '../types';
import { MockStore } from '../services/store';
import { MockBackend, SystemLog } from '../services/mockBackend';
import { IconUser, IconLibrary, IconReview } from '../components/Icons';

interface AdminPanelProps {
  user: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    setUsers(MockStore.getAllUsers());
    // Subscribe to get item stats
    const unsubscribe = MockStore.subscribe((data) => {
        setItems(data);
    });

    // Load logs
    setLogs(MockBackend.getLogs());

    // Poll logs every 5 seconds
    const logInterval = setInterval(() => {
        setLogs(MockBackend.getLogs());
    }, 2000);

    return () => {
        unsubscribe();
        clearInterval(logInterval);
    };
  }, []);

  const totalStudents = users.length;
  const totalPosts = items.length;
  const verifiedPosts = items.filter(i => i.isVerified).length;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[3rem] p-12 text-white shadow-2xl border border-slate-700">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">System Administration</h2>
        <p className="opacity-80 text-lg font-medium">Global Overview & Backend Controls</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black">{totalStudents}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Students</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black">{totalPosts}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Contributions</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black">{verifiedPosts}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Verified Content</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SMS Gateway Logs */}
          <div className="lg:col-span-2 bg-slate-950 rounded-[2.5rem] p-8 shadow-sm border border-slate-800">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Backend System Logs</h3>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gateway Online</span>
                </div>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] pr-2 space-y-3">
                {logs.length === 0 ? (
                    <p className="text-slate-600 text-xs font-mono p-4">SYSTEM_IDLE: No logs recorded.</p>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 font-mono text-xs flex items-start space-x-3">
                            <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                log.type === 'SMS' ? 'bg-indigo-900/50 text-indigo-400' : 
                                log.type === 'AUTH' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-300'
                            }`}>
                                {log.type}
                            </span>
                            <span className={`flex-1 ${log.status === 'FAILED' ? 'text-red-400' : 'text-slate-300'}`}>
                                {log.details}
                            </span>
                            {log.status === 'SUCCESS' && <span className="text-emerald-500">✓</span>}
                            {log.status === 'FAILED' && <span className="text-red-500">✕</span>}
                        </div>
                    ))
                )}
            </div>
          </div>

          {/* Student List (Compact) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Student Directory</h3>
             <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {users.map(u => (
                    <div key={u.enrollmentId} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0">
                        <div>
                            <div className="font-black text-slate-800 dark:text-slate-200 text-sm">{u.enrollmentId}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{u.branch.split(' ')[0]}</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${u.isAuthenticated ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                    </div>
                ))}
             </div>
          </div>
      </div>
    </div>
  );
};

export default AdminPanel;
