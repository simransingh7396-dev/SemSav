
import { User } from '../types';

export interface SystemLog {
  id: string;
  timestamp: number;
  type: 'SMS' | 'AUTH' | 'SYSTEM';
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

const LOGS_KEY = 'openverse_system_logs';
const OTP_STORAGE_KEY = 'openverse_active_otps';

export const MockBackend = {
  // Generate a random 4 digit code
  generateCode: () => Math.floor(1000 + Math.random() * 9000).toString(),

  getLogs: (): SystemLog[] => {
    const logs = localStorage.getItem(LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  },

  addLog: (type: 'SMS' | 'AUTH' | 'SYSTEM', details: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS') => {
    const logs = MockBackend.getLogs();
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      details,
      status
    };
    // Keep last 50 logs
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
    return newLog;
  },

  // Simulate sending SMS via a Gateway
  sendOtp: async (mobile: string): Promise<{ success: boolean; code?: string; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Validation
        if (!mobile || mobile.length !== 10) {
            MockBackend.addLog('SMS', `Failed delivery to ${mobile}: Invalid Number`, 'FAILED');
            resolve({ success: false, message: "Invalid Mobile Number" });
            return;
        }

        const code = MockBackend.generateCode();
        
        // Store OTP with expiry (simulated by just storing it)
        const activeOtps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
        activeOtps[mobile] = code;
        localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(activeOtps));

        // Log the "Network" call
        MockBackend.addLog('SMS', `OTP ${code} sent to +91-${mobile} via SecureGateway`, 'SUCCESS');
        
        console.log(`[BACKEND SMS GATEWAY] :: Sending ${code} to ${mobile}`);

        resolve({ success: true, code, message: "OTP Sent Successfully" });
      }, 1500); // Simulate network latency
    });
  },

  verifyOtp: async (mobile: string, inputCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const activeOtps = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
            const validCode = activeOtps[mobile];

            if (validCode && validCode === inputCode) {
                // Clear OTP after use
                delete activeOtps[mobile];
                localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(activeOtps));
                MockBackend.addLog('AUTH', `Mobile verification success for ${mobile}`, 'SUCCESS');
                resolve(true);
            } else {
                MockBackend.addLog('AUTH', `Failed verification for ${mobile}. Expected ${validCode}, got ${inputCode}`, 'FAILED');
                resolve(false);
            }
        }, 800);
    });
  }
};
