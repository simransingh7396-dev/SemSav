
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { MockBackend } from '../services/mockBackend';

interface AuthProps {
  onLogin: (user: User) => void;
}

interface StorageUser extends User {
  password?: string;
}

const BRANCHES = [
  "Computer Science (CSE)",
  "Electronics (ECE)",
  "Mechanical (ME)",
  "Civil (CE)",
  "Information Technology (IT)",
  "Electrical (EEE)",
  "Chemical (CHE)"
];

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type FlowStep = 'DETAILS' | 'OTP' | 'RESET';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [step, setStep] = useState<FlowStep>('DETAILS');
  
  const [enrollmentId, setEnrollmentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  
  const [otp, setOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (otpNotification) {
      const timer = setTimeout(() => setOtpNotification(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [otpNotification]);

  const validateEnrollment = (id: string) => {
    const regex = /^\d{2}[A-Z]{2,5}\d{3}$/;
    return regex.test(id);
  };

  const resetForm = () => {
    setEnrollmentId('');
    setPassword('');
    setConfirmPassword('');
    setMobile('');
    setOtp('');
    setError('');
    setSuccessMsg('');
    setStep('DETAILS');
    setOtpNotification(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const requestOtp = async (phone: string) => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('Connecting to SMS Gateway...');
    
    try {
        const response = await MockBackend.sendOtp(phone);
        if (response.success && response.code) {
            setOtpNotification(response.code);
            setSuccessMsg('OTP Sent! Check your mobile (or notification above).');
            setStep('OTP');
        } else {
            setError(response.message);
        }
    } catch (err) {
        setError('Gateway Error. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanId = enrollmentId.trim().toUpperCase();

    if (cleanId === 'ADMIN' && password === 'admin') {
      onLogin({
        enrollmentId: 'ADMIN',
        role: 'admin',
        branch: 'Central Administration',
        mobile: '0000000000',
        karmaPoints: 99999,
        isAuthenticated: true,
        registrationDate: Date.now(),
        level: 100,
        xp: 99999,
      });
      return;
    }

    const usersListJson = localStorage.getItem('openverse_users_list') || '[]';
    const users: StorageUser[] = JSON.parse(usersListJson);
    const user = users.find(u => u.enrollmentId === cleanId);

    if (user) {
        if (user.password && user.password !== password) {
            setError('Invalid Enrollment ID or Password');
            return;
        }
        const userWithRole = { ...user, role: user.role || 'student' };
        onLogin({ ...userWithRole, isAuthenticated: true });
    } else {
        setError('User not found. Please register first.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'DETAILS') {
        const cleanId = enrollmentId.trim().toUpperCase();
        
        if (!validateEnrollment(cleanId)) {
            setError('Invalid Enrollment ID format (e.g. 24CSE001)');
            return;
        }
        if (mobile.length !== 10) {
            setError('Mobile number must be exactly 10 digits');
            return;
        }
        if (!password) {
            setError('Password is required');
            return;
        }

        const usersListJson = localStorage.getItem('openverse_users_list') || '[]';
        const users: StorageUser[] = JSON.parse(usersListJson);
        
        if (users.some(u => u.enrollmentId === cleanId)) {
            setError('This Enrollment ID is already registered');
            return;
        }

        await requestOtp(mobile);

    } else if (step === 'OTP') {
        setIsLoading(true);
        const isValid = await MockBackend.verifyOtp(mobile, otp);
        setIsLoading(false);

        if (isValid) {
            const cleanId = enrollmentId.trim().toUpperCase();
            const newUser: StorageUser = { 
                enrollmentId: cleanId, 
                mobile, 
                branch,
                password,
                karmaPoints: 0, 
                isAuthenticated: false,
                registrationDate: Date.now(),
                level: 1,
                xp: 0,
                role: 'student'
            };

            const usersListJson = localStorage.getItem('openverse_users_list') || '[]';
            const users: StorageUser[] = JSON.parse(usersListJson);
            localStorage.setItem('openverse_users_list', JSON.stringify([...users, newUser]));

            switchMode('LOGIN');
            setSuccessMsg('Registration verified & successful! Please login.');
        } else {
            setError('Incorrect OTP. Verification Failed.');
        }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (step === 'DETAILS') {
          const cleanId = enrollmentId.trim().toUpperCase();
          const usersListJson = localStorage.getItem('openverse_users_list') || '[]';
          const users: StorageUser[] = JSON.parse(usersListJson);
          const user = users.find(u => u.enrollmentId === cleanId);

          if (!user) {
              setError('User not found.');
              return;
          }
          if (user.mobile !== mobile) {
              setError('Mobile number does not match our records for this ID.');
              return;
          }

          await requestOtp(mobile);

      } else if (step === 'OTP') {
          setIsLoading(true);
          const isValid = await MockBackend.verifyOtp(mobile, otp);
          setIsLoading(false);

          if (isValid) {
              setStep('RESET');
              setSuccessMsg('Identity Verified. Set your new password.');
              setOtp('');
          } else {
              setError('Invalid OTP.');
          }
      } else if (step === 'RESET') {
          if (!password || password !== confirmPassword) {
              setError('Passwords do not match or are empty.');
              return;
          }

          const cleanId = enrollmentId.trim().toUpperCase();
          const usersListJson = localStorage.getItem('openverse_users_list') || '[]';
          let users: StorageUser[] = JSON.parse(usersListJson);
          
          users = users.map(u => {
              if (u.enrollmentId === cleanId) {
                  return { ...u, password: password };
              }
              return u;
          });

          localStorage.setItem('openverse_users_list', JSON.stringify(users));
          switchMode('LOGIN');
          setSuccessMsg('Password reset successful. Please login with new credentials.');
      }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 relative">
      
      {otpNotification && (
        <div 
            onClick={() => { setOtp(otpNotification); setOtpNotification(null); }}
            className="fixed top-6 right-0 left-0 mx-auto w-[90%] max-w-sm bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl z-[100] cursor-pointer border border-slate-700 animate-in slide-in-from-top-4"
        >
            <div className="flex items-start space-x-3">
                <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0">
                    💬
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Messages • Now</p>
                    </div>
                    <p className="text-sm font-medium leading-snug">
                        Your Semester Saviours verification code is <span className="font-black text-white text-lg tracking-widest">{otpNotification}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Tap to Auto-fill</p>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-300">
        <div className="text-center mb-10">
          <div className="inline-block w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-indigo-600 font-black text-3xl">Ss</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Semester Saviours</h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            {mode === 'LOGIN' && 'Access the Collaborative Hub'}
            {mode === 'REGISTER' && 'Join the Student Network'}
            {mode === 'FORGOT_PASSWORD' && 'Recover Account Access'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wide">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl text-xs font-bold uppercase tracking-wide">
            {successMsg}
          </div>
        )}

        {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Enrollment ID</label>
                    <input 
                    type="text" 
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                    placeholder="e.g. 24CSE001 or ADMIN"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Password</label>
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                    placeholder="••••••••"
                    />
                    <div className="text-right mt-2">
                        <button type="button" onClick={() => switchMode('FORGOT_PASSWORD')} className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest">
                            Forgot Password?
                        </button>
                    </div>
                </div>
                <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs mt-4 transform active:scale-95"
                >
                    Authenticate
                </button>
                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-xs font-medium">New Student?</p>
                    <button type="button" onClick={() => switchMode('REGISTER')} className="mt-1 text-indigo-600 font-black hover:underline uppercase tracking-widest text-xs">
                        Initialize Registration
                    </button>
                </div>
            </form>
        )}

        {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
                {step === 'DETAILS' && (
                    <>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Enrollment ID</label>
                            <input 
                            required
                            type="text" 
                            value={enrollmentId}
                            onChange={(e) => setEnrollmentId(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="e.g. 24CSE001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Branch</label>
                            <select 
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            >
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Mobile Number</label>
                            <input 
                            required
                            type="tel" 
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="10 digit number"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Create Password</label>
                            <input 
                            required
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="••••••••"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs mt-4 transform active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Sending OTP...' : 'Verify Mobile & Register'}
                        </button>
                    </>
                )}

                {step === 'OTP' && (
                    <>
                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm">Enter the 4-digit code sent to</p>
                            <p className="font-bold text-indigo-600">{mobile}</p>
                        </div>
                        <div className="flex justify-center">
                            <input 
                                autoFocus
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,4))}
                                className="w-32 text-center text-3xl tracking-[0.5em] px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all font-black text-gray-800"
                                placeholder="----"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest text-xs mt-6 transform active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Confirm Registration'}
                        </button>
                    </>
                )}
                
                <div className="mt-6 text-center">
                    <button type="button" onClick={() => switchMode('LOGIN')} className="text-gray-400 font-bold hover:text-gray-600 uppercase tracking-widest text-[10px]">
                        Cancel & Return to Login
                    </button>
                </div>
            </form>
        )}

        {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
                {step === 'DETAILS' && (
                    <>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Enrollment ID</label>
                            <input 
                            required
                            type="text" 
                            value={enrollmentId}
                            onChange={(e) => setEnrollmentId(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="e.g. 24CSE001"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Registered Mobile</label>
                            <input 
                            required
                            type="tel" 
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="10 digit number"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs mt-4 transform active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Locating Account...' : 'Send Recovery OTP'}
                        </button>
                    </>
                )}

                {step === 'OTP' && (
                    <>
                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm">Enter the recovery code sent to</p>
                            <p className="font-bold text-indigo-600">******{mobile.slice(-4)}</p>
                        </div>
                        <div className="flex justify-center">
                            <input 
                                autoFocus
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,4))}
                                className="w-32 text-center text-3xl tracking-[0.5em] px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all font-black text-gray-800"
                                placeholder="----"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs mt-6 transform active:scale-95 disabled:opacity-50"
                        >
                             {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </>
                )}

                {step === 'RESET' && (
                    <>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">New Password</label>
                            <input 
                            required
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="New secure password"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Confirm Password</label>
                            <input 
                            required
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold placeholder:font-normal"
                            placeholder="Repeat password"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest text-xs mt-4 transform active:scale-95"
                        >
                            Reset Password
                        </button>
                    </>
                )}

                <div className="mt-6 text-center">
                    <button type="button" onClick={() => switchMode('LOGIN')} className="text-gray-400 font-bold hover:text-gray-600 uppercase tracking-widest text-[10px]">
                        Cancel Recovery
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
