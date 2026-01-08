
import { ContentItem, User, Subject } from '../types';
import { UPVOTE_THRESHOLD, KARMA_REWARD } from '../constants';

type Listener = (items: ContentItem[]) => void;
const listeners: Set<Listener> = new Set();

const STORAGE_KEY = 'openverse_content';
const USER_KEY = 'openverse_user';
const USERS_LIST_KEY = 'openverse_users_list';
const SUBJECTS_KEY = 'openverse_subjects';

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'cs101', name: 'Computer Networks', code: 'CS101', color: 'bg-blue-500' },
  { id: 'cs102', name: 'Machine Learning', code: 'CS102', color: 'bg-purple-500' },
  { id: 'cs103', name: 'Operating Systems', code: 'CS103', color: 'bg-green-500' },
];

let itemsCache: ContentItem[] = [];
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OpenVerseDB', 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('store')) {
        request.result.createObjectStore('store');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getIDB = async (key: string): Promise<any> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('store', 'readonly');
      const request = tx.objectStore('store').get(key);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (e) {
    console.error('IDB Get Error', e);
    return null;
  }
};

const setIDB = async (key: string, value: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const request = tx.objectStore('store').put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('IDB Set Error', e);
  }
};

const initStore = async () => {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const stored = await getIDB(STORAGE_KEY);
    if (stored) {
      itemsCache = stored.map((item: any) => ({
        ...item,
        votedUsers: item.votedUsers || []
      }));
    } else {
      const oldData = localStorage.getItem(STORAGE_KEY);
      if (oldData) {
        itemsCache = JSON.parse(oldData).map((item: any) => ({
            ...item,
            votedUsers: item.votedUsers || []
        }));
        await setIDB(STORAGE_KEY, itemsCache);
      }
    }
    isInitialized = true;
    notifyListeners();
  })();
  return initPromise;
};

initStore();

const notifyListeners = () => {
  listeners.forEach(l => l([...itemsCache]));
};

export const MockStore = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener([...itemsCache]);
    return () => {
      listeners.delete(listener);
    };
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(USERS_LIST_KEY);
    return data ? JSON.parse(data) : [];
  },

  getSubjects: (): Subject[] => {
    const data = localStorage.getItem(SUBJECTS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SUBJECTS;
  },

  addSubject: (subject: Subject) => {
    const subjects = MockStore.getSubjects();
    const updated = [...subjects, subject];
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('subjects_updated'));
  },

  deleteSubject: (id: string) => {
    const subjects = MockStore.getSubjects();
    const updated = subjects.filter(s => s.id !== id);
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('subjects_updated'));
  },

  addItem: async (item: Omit<ContentItem, 'id' | 'timestamp' | 'upvotes' | 'downvotes' | 'isVerified' | 'uploaderBranch' | 'votedUsers'>) => {
    await initStore();
    const users = MockStore.getAllUsers();
    const uploader = users.find(u => u.enrollmentId === item.uploaderId);
    
    const branch = item.uploaderId === 'ADMIN' ? 'Central Administration' : (uploader?.branch || 'Unknown');
    
    const newItem: ContentItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      isVerified: false,
      uploaderBranch: branch,
      votedUsers: []
    };
    
    itemsCache = [...itemsCache, newItem];
    await setIDB(STORAGE_KEY, itemsCache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
    notifyListeners();
    
    if (item.uploaderId !== 'ADMIN') {
        MockStore.addXP(item.uploaderId, 20);
    }
  },

  deleteItem: async (id: string, requestorId: string, isAdmin: boolean = false) => {
    await initStore();
    
    const itemToDelete = itemsCache.find(i => i.id === id);
    if (!itemToDelete) {
        console.warn(`Delete failed: Item ${id} not found.`);
        return false;
    }

    const isOwner = itemToDelete.uploaderId === requestorId;
    
    if (!isAdmin && !isOwner) {
        console.warn(`Delete failed: Permission denied for ${requestorId} on item ${id}.`);
        return false;
    }

    itemsCache = itemsCache.filter(i => i.id !== id);

    await setIDB(STORAGE_KEY, itemsCache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
    notifyListeners();
    return true;
  },

  vote: async (id: string, type: 'up' | 'down', userId: string, userRole: string = 'student') => {
    await initStore();
    const items = [...itemsCache];
    const itemIndex = items.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const item = items[itemIndex];
    if (!item.votedUsers) item.votedUsers = [];
    
    if (userRole !== 'admin' && item.votedUsers.includes(userId)) return;

    if (type === 'up') {
      item.upvotes += 1;
    } else {
      item.downvotes += 1;
    }

    item.votedUsers.push(userId);

    if (item.downvotes >= 5) {
      itemsCache = itemsCache.filter(i => i.id !== id);
      await setIDB(STORAGE_KEY, itemsCache);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
      notifyListeners();
      return;
    }

    if (item.upvotes >= UPVOTE_THRESHOLD && !item.isVerified) {
      item.isVerified = true;
      MockStore.rewardKarma(item.uploaderId, KARMA_REWARD);
      MockStore.addXP(item.uploaderId, 100); 
    }

    items[itemIndex] = item;
    itemsCache = items;
    await setIDB(STORAGE_KEY, itemsCache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
    notifyListeners();
  },

  forceVerify: async (id: string) => {
    await initStore();
    const items = [...itemsCache];
    const itemIndex = items.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const item = items[itemIndex];
    if (!item.isVerified) {
        item.isVerified = true;
        if (item.upvotes < UPVOTE_THRESHOLD) {
            item.upvotes = UPVOTE_THRESHOLD;
        }
        MockStore.rewardKarma(item.uploaderId, KARMA_REWARD);
        MockStore.addXP(item.uploaderId, 100); 

        items[itemIndex] = item;
        itemsCache = items;
        await setIDB(STORAGE_KEY, itemsCache);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsCache));
        notifyListeners();
    }
  },

  addXP: (enrollmentId: string, amount: number) => {
    const users = MockStore.getAllUsers();
    const updatedUsers = users.map(u => {
      if (u.enrollmentId === enrollmentId) {
        let newXp = u.xp + amount;
        let newLevel = u.level;
        while (newXp >= 500) {
          newXp -= 500;
          newLevel += 1;
        }
        return { ...u, xp: newXp, level: newLevel };
      }
      return u;
    });
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updatedUsers));
    MockStore.syncCurrentUser(enrollmentId, updatedUsers);
  },

  rewardKarma: (enrollmentId: string, amount: number) => {
    const users = MockStore.getAllUsers();
    const updatedUsers = users.map(u => 
      u.enrollmentId === enrollmentId ? { ...u, karmaPoints: u.karmaPoints + amount } : u
    );
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updatedUsers));
    MockStore.syncCurrentUser(enrollmentId, updatedUsers);
  },

  syncCurrentUser: (enrollmentId: string, allUsers: User[]) => {
    const current = localStorage.getItem(USER_KEY);
    if (current) {
      const u: User = JSON.parse(current);
      if (u.enrollmentId === enrollmentId) {
        const updated = allUsers.find(au => au.enrollmentId === enrollmentId);
        if (updated) {
          localStorage.setItem(USER_KEY, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('user_updated', { detail: updated }));
        }
      }
    }
  },

  updateUserProfile: (enrollmentId: string, updates: Partial<User>) => {
    const users = MockStore.getAllUsers();
    const updatedUsers = users.map(u => 
      u.enrollmentId === enrollmentId ? { ...u, ...updates } : u
    );
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(updatedUsers));
    MockStore.syncCurrentUser(enrollmentId, updatedUsers);
  }
};
