import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  User, FriendRequest, Friend, AppData, Group,
  Notification, TabId
} from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

// ─── STORAGE KEYS ───
const USERS_KEY = 'dostos_users';
const SESSION_KEY = 'dostos_session';
const DATA_KEY = (userId: string) => `dostos_data_${userId}`;
const FRIENDS_KEY = (userId: string) => `dostos_friends_${userId}`;
const REQUESTS_KEY = 'dostos_requests';
const GROUPS_KEY = 'dostos_groups';
const SHARED_KEY = 'dostos_shared';

// ─── DEFAULT DATA ───
function defaultAppData(): AppData {
  return {
    kesfet: [],
    arenaLigler: [],
    challenges: [],
    leaderboard: [],
    expenses: [],
    subscriptions: [],
    giftfunds: [],
    bbqs: [],
    projects: [],
    feed: [],
    music: [],
    games: [],
    albums: [],
    inventory: [],
    debts: [],
    notifications: [],
    history: [],
    members: 0,
  };
}

const COLORS = [
  'var(--purple)', 'var(--blue)', 'var(--green)', 'var(--accent)',
  'var(--cyan)', 'var(--pink)', 'var(--gold)',
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ─── CONTEXT ───
interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string, displayName: string) => boolean;
  logout: () => void;
  // Data
  data: AppData;
  saveData: () => void;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  // Friends
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  sendFriendRequest: (toUsername: string) => boolean;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  removeFriend: (userId: string) => void;
  // Groups
  currentGroup: Group | null;
  groups: Group[];
  createGroup: (name: string) => void;
  joinGroup: (groupId: string) => boolean;
  switchGroup: (group: Group | null) => void;
  // Shared data
  sharedData: AppData;
  // Notifications
  addNotification: (text: string, icon?: string) => void;
  clearNotifications: () => void;
  // Utils
  generateId: () => string;
  escapeHtml: (text: string | null | undefined) => string;
  allUsers: User[];
  refreshRequests: () => void;
  // Active tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── LOAD / SAVE HELPERS ───
function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveSession(user: User | null) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

function loadAppData(userId: string): AppData {
  try {
    const raw = localStorage.getItem(DATA_KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultAppData();
      for (const key in def) {
        if (!(key in parsed)) parsed[key] = (def as any)[key];
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return defaultAppData();
}

function saveAppData(userId: string, data: AppData) {
  localStorage.setItem(DATA_KEY(userId), JSON.stringify(data));
}

function loadFriends(userId: string): Friend[] {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveFriends(userId: string, friends: Friend[]) {
  localStorage.setItem(FRIENDS_KEY(userId), JSON.stringify(friends));
}

function loadRequests(): FriendRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveRequests(requests: FriendRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveGroups(groups: Group[]) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

function loadSharedData(): AppData {
  try {
    const raw = localStorage.getItem(SHARED_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultAppData();
}

function saveSharedData(data: AppData) {
  localStorage.setItem(SHARED_KEY, JSON.stringify(data));
}

function loadCurrentGroup(): Group | null {
  try {
    const raw = localStorage.getItem('dostos_current_group');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveCurrentGroup(group: Group | null) {
  if (group) localStorage.setItem('dostos_current_group', JSON.stringify(group));
  else localStorage.removeItem('dostos_current_group');
}

// ─── PROVIDER ───
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(loadSession);
  const [data, setData] = useState<AppData>(() => currentUser ? loadAppData(currentUser.id) : defaultAppData());
  const [friends, setFriends] = useState<Friend[]>(() => currentUser ? loadFriends(currentUser.id) : []);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => loadRequests().filter(r => r.toUserId === currentUser?.id && r.status === 'pending'));
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>(() => loadRequests().filter(r => r.fromUserId === currentUser?.id && r.status === 'pending'));
  const [groups, setGroups] = useState<Group[]>(loadGroups);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(loadCurrentGroup);
  const [sharedData, setSharedData] = useState<AppData>(loadSharedData);
  const [activeTab, setActiveTab] = useState<TabId>('kesfet');

  // Load data when user changes
  useEffect(() => {
    if (currentUser) {
      setData(loadAppData(currentUser.id));
      setFriends(loadFriends(currentUser.id));
      refreshRequestsState(currentUser.id);
    }
  }, [currentUser]);

  function refreshRequestsState(userId?: string) {
    const all = loadRequests();
    const uid = userId || currentUser?.id;
    if (!uid) return;
    setFriendRequests(all.filter(r => r.toUserId === uid && r.status === 'pending'));
    setSentRequests(all.filter(r => r.fromUserId === uid && r.status === 'pending'));
  }

  // ─── AUTH ───
  const login = useCallback((username: string, password: string): boolean => {
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return false;
    setCurrentUser(user);
    saveSession(user);
    setData(loadAppData(user.id));
    setFriends(loadFriends(user.id));
    refreshRequestsState(user.id);
    return true;
  }, []);

  const register = useCallback((username: string, password: string, displayName: string): boolean => {
    const users = loadUsers();
    if (users.find(u => u.username === username)) return false;
    const user: User = {
      id: generateId(),
      username,
      password,
      displayName: displayName || username,
      avatar: (displayName || username)[0].toUpperCase(),
      color: randomColor(),
      createdAt: new Date().toLocaleString('tr-TR'),
    };
    users.push(user);
    saveUsers(users);
    setCurrentUser(user);
    saveSession(user);
    const newData = defaultAppData();
    saveAppData(user.id, newData);
    setData(newData);
    setFriends([]);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    saveSession(null);
    setData(defaultAppData());
    setFriends([]);
    setFriendRequests([]);
    setSentRequests([]);
  }, []);

  // ─── DATA PERSISTENCE ───
  const persistData = useCallback((newData: AppData) => {
    if (currentUser) {
      saveAppData(currentUser.id, newData);
    }
    // Also save to shared if in a group
    if (currentGroup) {
      saveSharedData(newData);
      setSharedData(newData);
    }
  }, [currentUser, currentGroup]);

  const saveData = useCallback(() => {
    setData(prev => {
      persistData(prev);
      return prev;
    });
  }, [persistData]);

  // ─── FRIENDS ───
  const sendFriendRequest = useCallback((toUsername: string): boolean => {
    if (!currentUser) return false;
    const users = loadUsers();
    const target = users.find(u => u.username === toUsername);
    if (!target || target.id === currentUser.id) return false;
    const allReqs = loadRequests();
    if (allReqs.find(r => r.fromUserId === currentUser.id && r.toUserId === target.id && r.status === 'pending')) return false;
    const req: FriendRequest = {
      id: generateId(),
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromDisplayName: currentUser.displayName,
      toUserId: target.id,
      status: 'pending',
      createdAt: new Date().toLocaleString('tr-TR'),
    };
    allReqs.push(req);
    saveRequests(allReqs);
    refreshRequestsState();
    return true;
  }, [currentUser]);

  const acceptFriendRequest = useCallback((requestId: string) => {
    if (!currentUser) return;
    const allReqs = loadRequests();
    const req = allReqs.find(r => r.id === requestId);
    if (!req) return;
    req.status = 'accepted';
    saveRequests(allReqs);

    const users = loadUsers();
    const fromUser = users.find(u => u.id === req.fromUserId);
    if (!fromUser) return;

    // Add to current user's friends
    const myFriends = loadFriends(currentUser.id);
    myFriends.push({
      userId: fromUser.id,
      username: fromUser.username,
      displayName: fromUser.displayName,
      avatar: fromUser.avatar,
      color: fromUser.color,
      since: new Date().toLocaleString('tr-TR'),
    });
    saveFriends(currentUser.id, myFriends);
    setFriends(myFriends);

    // Add to other user's friends
    const theirFriends = loadFriends(fromUser.id);
    theirFriends.push({
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      color: currentUser.color,
      since: new Date().toLocaleString('tr-TR'),
    });
    saveFriends(fromUser.id, theirFriends);

    refreshRequestsState();
  }, [currentUser]);

  const rejectFriendRequest = useCallback((requestId: string) => {
    const allReqs = loadRequests();
    const req = allReqs.find(r => r.id === requestId);
    if (req) {
      req.status = 'rejected';
      saveRequests(allReqs);
    }
    refreshRequestsState();
  }, []);

  const removeFriend = useCallback((userId: string) => {
    if (!currentUser) return;
    const myFriends = loadFriends(currentUser.id).filter(f => f.userId !== userId);
    saveFriends(currentUser.id, myFriends);
    setFriends(myFriends);
    const theirFriends = loadFriends(userId);
    saveFriends(userId, theirFriends.filter(f => f.userId !== currentUser.id));
  }, [currentUser]);

  const refreshRequests = useCallback(() => {
    refreshRequestsState();
  }, []);

  // ─── GROUPS ───
  const createGroup = useCallback((name: string) => {
    if (!currentUser) return;
    const group: Group = {
      id: generateId(),
      name,
      createdBy: currentUser.id,
      members: [currentUser.id],
      createdAt: new Date().toLocaleString('tr-TR'),
    };
    const allGroups = loadGroups();
    allGroups.push(group);
    saveGroups(allGroups);
    setGroups(allGroups);
    setCurrentGroup(group);
    saveCurrentGroup(group);
  }, [currentUser]);

  const joinGroup = useCallback((groupId: string): boolean => {
    if (!currentUser) return false;
    const allGroups = loadGroups();
    const group = allGroups.find(g => g.id === groupId);
    if (!group) return false;
    if (!group.members.includes(currentUser.id)) {
      group.members.push(currentUser.id);
      saveGroups(allGroups);
      setGroups(allGroups);
    }
    setCurrentGroup(group);
    saveCurrentGroup(group);
    return true;
  }, [currentUser]);

  const switchGroup = useCallback((group: Group | null) => {
    setCurrentGroup(group);
    saveCurrentGroup(group);
    if (group) {
      const sd = loadSharedData();
      setSharedData(sd);
    }
  }, []);

  // ─── NOTIFICATIONS ───
  const addNotification = useCallback((text: string, icon: string = 'fa-bell') => {
    const notif: Notification = {
      id: generateId(),
      text,
      time: new Date().toLocaleString('tr-TR'),
      icon,
      read: false,
    };
    setData(prev => {
      const newNotifs = [...prev.notifications, notif];
      if (newNotifs.length > 50) newNotifs.shift();
      const updated = { ...prev, notifications: newNotifs };
      persistData(updated);
      return updated;
    });
  }, [persistData]);

  const clearNotifications = useCallback(() => {
    setData(prev => {
      const updated = { ...prev, notifications: [] };
      persistData(updated);
      return updated;
    });
  }, [persistData]);

  // ─── ALL USERS ───
  const allUsers = loadUsers();

  // ─── SYNC DATA ───
  useEffect(() => {
    if (currentGroup) {
      setSharedData(loadSharedData());
    }
  }, [currentGroup, data]);

  return (
    <AppContext.Provider value={{
      currentUser,
      login,
      register,
      logout,
      data,
      saveData,
      setData,
      friends,
      friendRequests,
      sentRequests,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      removeFriend,
      currentGroup,
      groups,
      createGroup,
      joinGroup,
      switchGroup,
      sharedData,
      addNotification,
      clearNotifications,
      generateId,
      escapeHtml,
      allUsers,
      refreshRequests,
      activeTab,
      setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  );
}
