import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from '@/lib/firebase';
import type {
  User, FriendRequest, Friend, AppData, Group,
  Notification, TabId, SharedFeedItem
} from '@/types';

// ─── HELPERS ───
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

function escapeHtml(text: string | null | undefined): string {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/** 6 karakterlik okunabilir grup kodu üretir (büyük harf + rakam) */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── STORAGE KEYS ───
const SESSION_KEY = 'dostos_session';

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

// ─── CONTEXT TYPE ───
interface AppContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  data: AppData;
  saveData: (newData?: AppData) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  sendFriendRequest: (toUsername: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  currentGroup: Group | null;
  groups: Group[];
  createGroup: (name: string) => Promise<void>;
  joinGroup: (roomCode: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<void>;
  switchGroup: (group: Group | null) => void;
  sharedData: AppData;
  sharedFeed: SharedFeedItem[];
  sendToFriends: (type: string, content: object) => Promise<void>;
  markFeedRead: (itemId: string) => Promise<void>;
  refreshSharedFeed: () => Promise<void>;
  addNotification: (text: string, icon?: string) => void;
  clearNotifications: () => void;
  generateId: () => string;
  escapeHtml: (text: string | null | undefined) => string;
  allUsers: User[];
  refreshRequests: () => Promise<void>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─── PROVIDER ───
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [data, setData] = useState<AppData>(defaultAppData());
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [sharedData, setSharedData] = useState<AppData>(defaultAppData());
  const [sharedFeed, setSharedFeed] = useState<SharedFeedItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('kesfet');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const friendsRef = useRef<Friend[]>([]);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => { friendsRef.current = friends; }, [friends]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // ─── LOAD USER DATA WHEN LOGGED IN ───
  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    Promise.all([
      loadUserData(currentUser.id),
      loadAllUsers(),
      loadGroups(currentUser.id),
      loadSharedFeed(currentUser.id),
    ]).finally(() => setIsLoading(false));
  }, [currentUser?.id]);

  // ─── REALTIME: FRIEND REQUESTS ───
  useEffect(() => {
    if (!currentUser) return;

    // Gelen istekler
    const incomingQ = query(
      collection(db, 'friend_requests'),
      where('to_user_id', '==', currentUser.id),
      where('status', '==', 'pending')
    );
    const unsubIncoming = onSnapshot(incomingQ, async (snap) => {
      const incoming: FriendRequest[] = [];
      for (const d of snap.docs) {
        const r = d.data();
        // Gönderen kullanıcı bilgisini al
        let fromUsername = r.from_username || '';
        let fromDisplayName = r.from_display_name || '';
        if (!fromUsername) {
          const senderDoc = await getDoc(doc(db, 'users', r.from_user_id));
          if (senderDoc.exists()) {
            const s = senderDoc.data();
            fromUsername = s.username || '';
            fromDisplayName = s.display_name || '';
          }
        }
        incoming.push({
          id: d.id,
          fromUserId: r.from_user_id,
          fromUsername,
          fromDisplayName,
          toUserId: r.to_user_id,
          status: r.status,
          createdAt: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }
      setFriendRequests(incoming);
    });

    // Gönderilen istekler
    const sentQ = query(
      collection(db, 'friend_requests'),
      where('from_user_id', '==', currentUser.id),
      where('status', '==', 'pending')
    );
    const unsubSent = onSnapshot(sentQ, (snap) => {
      const sent: FriendRequest[] = snap.docs.map(d => {
        const r = d.data();
        return {
          id: d.id,
          fromUserId: r.from_user_id,
          fromUsername: r.from_username || '',
          fromDisplayName: r.from_display_name || '',
          toUserId: r.to_user_id,
          status: r.status,
          createdAt: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      setSentRequests(sent);
    });

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, [currentUser?.id]);

  // ─── REALTIME: SHARED FEED ───
  useEffect(() => {
    if (!currentUser) return;

    const feedQ = query(
      collection(db, 'shared_feed'),
      where('to_user_id', '==', currentUser.id),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(feedQ, async (snap) => {
      const items: SharedFeedItem[] = [];
      for (const d of snap.docs) {
        const f = d.data();
        items.push({
          id: d.id,
          fromUserId: f.from_user_id,
          fromUsername: f.from_username || '',
          fromDisplayName: f.from_display_name || '',
          toUserId: f.to_user_id,
          type: f.type,
          content: f.content || {},
          read: f.read || false,
          createdAt: f.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }
      setSharedFeed(items);
    });

    return () => unsub();
  }, [currentUser?.id]);

  // ─── REALTIME: FRIENDS ───
  useEffect(() => {
    if (!currentUser) return;

    const friendsQ = query(
      collection(db, 'friends'),
      where('user_id', '==', currentUser.id)
    );

    const unsub = onSnapshot(friendsQ, async (snap) => {
      if (snap.empty) {
        setFriends([]);
        friendsRef.current = [];
        return;
      }
      const friendIds = snap.docs.map(d => d.data().friend_id as string);
      // Kullanıcı detaylarını al
      const friendsList: Friend[] = [];
      for (const fid of friendIds) {
        const userDoc = await getDoc(doc(db, 'users', fid));
        if (userDoc.exists()) {
          const u = userDoc.data();
          friendsList.push({
            userId: userDoc.id,
            username: u.username || '',
            displayName: u.display_name || '',
            avatar: u.avatar || '',
            color: u.color || 'var(--accent)',
            since: new Date().toLocaleString('tr-TR'),
          });
        }
      }
      setFriends(friendsList);
      friendsRef.current = friendsList;
    });

    return () => unsub();
  }, [currentUser?.id]);

  // ─── LOAD FUNCTIONS ───
  const loadUserData = async (userId: string) => {
    try {
      const appDataDoc = await getDoc(doc(db, 'app_data', userId));
      if (appDataDoc.exists()) {
        const d = appDataDoc.data();
        if (d.data) setData(d.data as AppData);
      }
    } catch (error) {
      console.error('[loadUserData] Error:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users: User[] = snap.docs.map(d => {
        const u = d.data();
        return {
          id: d.id,
          username: u.username || '',
          password: u.password || '',
          displayName: u.display_name || '',
          avatar: u.avatar || '',
          color: u.color || 'var(--accent)',
          createdAt: u.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      setAllUsers(users);
    } catch (error) {
      console.error('[loadAllUsers] Error:', error);
    }
  };

  const loadGroups = async (userId: string) => {
    try {
      // Kullanıcının üye olduğu grupları bul
      const memberQ = query(
        collection(db, 'group_members'),
        where('user_id', '==', userId)
      );
      const memberSnap = await getDocs(memberQ);
      const groupIds = memberSnap.docs.map(d => d.data().group_id as string);

      const groupsList: Group[] = [];
      for (const gid of groupIds) {
        const gDoc = await getDoc(doc(db, 'groups', gid));
        if (gDoc.exists()) {
          const g = gDoc.data();
          // Üyeleri al
          const membersQ = query(collection(db, 'group_members'), where('group_id', '==', gid));
          const membersSnap = await getDocs(membersQ);
          const members = membersSnap.docs.map(m => m.data().user_id as string);
          groupsList.push({
            id: gDoc.id,
            name: g.name || '',
            createdBy: g.created_by || '',
            members,
            createdAt: g.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            roomCode: g.room_code || gDoc.id,
          } as Group & { roomCode: string });
        }
      }
      setGroups(groupsList);
    } catch (error) {
      console.error('[loadGroups] Error:', error);
    }
  };

  const loadSharedFeed = async (userId: string) => {
    try {
      const feedQ = query(
        collection(db, 'shared_feed'),
        where('to_user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      const snap = await getDocs(feedQ);
      const items: SharedFeedItem[] = snap.docs.map(d => {
        const f = d.data();
        return {
          id: d.id,
          fromUserId: f.from_user_id,
          fromUsername: f.from_username || '',
          fromDisplayName: f.from_display_name || '',
          toUserId: f.to_user_id,
          type: f.type,
          content: f.content || {},
          read: f.read || false,
          createdAt: f.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
      setSharedFeed(items);
    } catch (error) {
      console.error('[loadSharedFeed] Error:', error);
    }
  };

  // ─── AUTH ───
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();
      const usersQ = query(
        collection(db, 'users'),
        where('username', '==', cleanUsername),
        where('password', '==', password),
        limit(1)
      );
      const snap = await getDocs(usersQ);
      if (snap.empty) {
        console.error('[login] User not found or wrong password');
        return false;
      }
      const userDoc = snap.docs[0];
      const u = userDoc.data();
      const user: User = {
        id: userDoc.id,
        username: u.username,
        password: u.password,
        displayName: u.display_name,
        avatar: u.avatar,
        color: u.color,
        createdAt: u.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('[login] Error:', error);
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();
      const cleanDisplayName = displayName.trim() || cleanUsername;

      // Kullanıcı adı var mı kontrol et
      const existQ = query(
        collection(db, 'users'),
        where('username', '==', cleanUsername),
        limit(1)
      );
      const existSnap = await getDocs(existQ);
      if (!existSnap.empty) {
        console.log('[register] Username already exists:', cleanUsername);
        return false;
      }

      // Yeni kullanıcı oluştur
      const newUserRef = doc(collection(db, 'users'));
      const userData = {
        username: cleanUsername,
        password: password,
        display_name: cleanDisplayName,
        avatar: cleanDisplayName[0].toUpperCase(),
        color: randomColor(),
        created_at: serverTimestamp(),
      };
      await setDoc(newUserRef, userData);

      // app_data oluştur
      await setDoc(doc(db, 'app_data', newUserRef.id), {
        user_id: newUserRef.id,
        data: defaultAppData(),
        updated_at: serverTimestamp(),
      });

      const user: User = {
        id: newUserRef.id,
        username: cleanUsername,
        password: password,
        displayName: cleanDisplayName,
        avatar: cleanDisplayName[0].toUpperCase(),
        color: userData.color,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      await loadAllUsers();
      console.log('[register] Registration successful for:', cleanUsername);
      return true;
    } catch (error) {
      console.error('[register] Unexpected error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setData(defaultAppData());
    setFriends([]);
    setFriendRequests([]);
    setSentRequests([]);
    setSharedFeed([]);
    setGroups([]);
    setCurrentGroup(null);
  }, []);

  // ─── DATA PERSISTENCE ───
  const persistData = useCallback(async (newData: AppData) => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      await setDoc(doc(db, 'app_data', user.id), {
        user_id: user.id,
        data: newData,
        updated_at: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('[persistData] Error:', error);
    }
  }, []);

  const saveData = useCallback(async (newData?: AppData) => {
    if (newData) {
      setData(newData);
      await persistData(newData);
    } else {
      setData(prev => {
        persistData(prev);
        return prev;
      });
    }
  }, [persistData]);

  // ─── SHARED FEED ───
  const sendToFriends = useCallback(async (type: string, content: object) => {
    const user = currentUserRef.current;
    if (!user) return;
    const currentFriends = friendsRef.current;
    if (currentFriends.length === 0) {
      console.log('[sendToFriends] No friends to send to');
      return;
    }
    try {
      const batch = writeBatch(db);
      for (const friend of currentFriends) {
        const ref = doc(collection(db, 'shared_feed'));
        batch.set(ref, {
          from_user_id: user.id,
          from_username: user.username,
          from_display_name: user.displayName || user.username,
          to_user_id: friend.userId,
          type,
          content: {
            ...content,
            senderName: user.displayName || user.username,
            senderUsername: user.username,
            sentAt: new Date().toISOString(),
          },
          read: false,
          created_at: serverTimestamp(),
        });
      }
      await batch.commit();
      console.log('[sendToFriends] Sent to', currentFriends.length, 'friends');
    } catch (error) {
      console.error('[sendToFriends] Error:', error);
    }
  }, []);

  const markFeedRead = useCallback(async (itemId: string) => {
    try {
      await updateDoc(doc(db, 'shared_feed', itemId), { read: true });
      setSharedFeed(prev =>
        prev.map(item => item.id === itemId ? { ...item, read: true } : item)
      );
    } catch (error) {
      console.error('[markFeedRead] Error:', error);
    }
  }, []);

  const refreshSharedFeed = useCallback(async () => {
    const user = currentUserRef.current;
    if (user) await loadSharedFeed(user.id);
  }, []);

  // ─── FRIENDS ───
  const sendFriendRequest = useCallback(async (toUsername: string): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user) return false;

    try {
      const cleanTarget = toUsername.toLowerCase().trim();

      // Hedef kullanıcıyı bul
      const targetQ = query(
        collection(db, 'users'),
        where('username', '==', cleanTarget),
        limit(1)
      );
      const targetSnap = await getDocs(targetQ);
      if (targetSnap.empty) {
        console.log('[sendFriendRequest] User not found:', cleanTarget);
        return false;
      }
      const targetDoc = targetSnap.docs[0];
      const targetUser = targetDoc.data();
      const targetId = targetDoc.id;

      if (targetId === user.id) return false;

      // Zaten arkadaş mı?
      const alreadyFriend = friendsRef.current.find(f => f.userId === targetId);
      if (alreadyFriend) return false;

      // Zaten istek var mı? (her iki yönde)
      const existQ1 = query(
        collection(db, 'friend_requests'),
        where('from_user_id', '==', user.id),
        where('to_user_id', '==', targetId),
        where('status', '==', 'pending'),
        limit(1)
      );
      const existQ2 = query(
        collection(db, 'friend_requests'),
        where('from_user_id', '==', targetId),
        where('to_user_id', '==', user.id),
        where('status', '==', 'pending'),
        limit(1)
      );
      const [snap1, snap2] = await Promise.all([getDocs(existQ1), getDocs(existQ2)]);
      if (!snap1.empty || !snap2.empty) {
        console.log('[sendFriendRequest] Request already exists');
        return false;
      }

      // İstek gönder
      await addDoc(collection(db, 'friend_requests'), {
        from_user_id: user.id,
        from_username: user.username,
        from_display_name: user.displayName || user.username,
        to_user_id: targetId,
        to_username: targetUser.username,
        status: 'pending',
        created_at: serverTimestamp(),
      });

      console.log('[sendFriendRequest] Request sent to:', cleanTarget);
      return true;
    } catch (error) {
      console.error('[sendFriendRequest] Error:', error);
      return false;
    }
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    const user = currentUserRef.current;
    if (!user) return;

    try {
      const reqDoc = await getDoc(doc(db, 'friend_requests', requestId));
      if (!reqDoc.exists()) return;
      const req = reqDoc.data();

      // İsteği kabul et
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'accepted' });

      // Her iki yönde arkadaşlık kaydı oluştur
      const batch = writeBatch(db);
      const f1Ref = doc(collection(db, 'friends'));
      const f2Ref = doc(collection(db, 'friends'));
      batch.set(f1Ref, {
        user_id: user.id,
        friend_id: req.from_user_id,
        created_at: serverTimestamp(),
      });
      batch.set(f2Ref, {
        user_id: req.from_user_id,
        friend_id: user.id,
        created_at: serverTimestamp(),
      });
      await batch.commit();
      console.log('[acceptFriendRequest] Accepted:', requestId);
    } catch (error) {
      console.error('[acceptFriendRequest] Error:', error);
    }
  }, []);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'rejected' });
    } catch (error) {
      console.error('[rejectFriendRequest] Error:', error);
    }
  }, []);

  const removeFriend = useCallback(async (friendUserId: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      // Her iki yönde arkadaşlık kaydını sil
      const q1 = query(
        collection(db, 'friends'),
        where('user_id', '==', user.id),
        where('friend_id', '==', friendUserId)
      );
      const q2 = query(
        collection(db, 'friends'),
        where('user_id', '==', friendUserId),
        where('friend_id', '==', user.id)
      );
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const batch = writeBatch(db);
      [...s1.docs, ...s2.docs].forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) {
      console.error('[removeFriend] Error:', error);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    // Realtime listener zaten güncel tutuyor, ama manuel yenileme için
    const user = currentUserRef.current;
    if (!user) return;
    // Realtime listener aktif olduğu için ekstra işlem gerekmez
  }, []);

  // ─── GROUPS ───
  const createGroup = useCallback(async (name: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      // Benzersiz oda kodu üret
      let roomCode = generateRoomCode();
      // Çakışma kontrolü
      let attempts = 0;
      while (attempts < 5) {
        const codeQ = query(collection(db, 'groups'), where('room_code', '==', roomCode), limit(1));
        const codeSnap = await getDocs(codeQ);
        if (codeSnap.empty) break;
        roomCode = generateRoomCode();
        attempts++;
      }

      const groupRef = doc(collection(db, 'groups'));
      await setDoc(groupRef, {
        name,
        created_by: user.id,
        room_code: roomCode,
        created_at: serverTimestamp(),
      });

      // Üye olarak ekle
      await addDoc(collection(db, 'group_members'), {
        group_id: groupRef.id,
        user_id: user.id,
        joined_at: serverTimestamp(),
      });

      // Paylaşılan veri oluştur
      await setDoc(doc(db, 'shared_data', groupRef.id), {
        group_id: groupRef.id,
        data: defaultAppData(),
        updated_at: serverTimestamp(),
      });

      const group: Group = {
        id: groupRef.id,
        name,
        createdBy: user.id,
        members: [user.id],
        createdAt: new Date().toISOString(),
        roomCode,
      } as Group & { roomCode: string };

      setGroups(prev => [...prev, group]);
      setCurrentGroup(group);
    } catch (error) {
      console.error('[createGroup] Error:', error);
    }
  }, []);

  const joinGroup = useCallback(async (roomCode: string): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user) return false;
    try {
      const cleanCode = roomCode.trim().toUpperCase();
      // Oda koduna göre grubu bul
      const groupQ = query(
        collection(db, 'groups'),
        where('room_code', '==', cleanCode),
        limit(1)
      );
      const groupSnap = await getDocs(groupQ);
      if (groupSnap.empty) {
        console.log('[joinGroup] Group not found with code:', cleanCode);
        return false;
      }
      const groupDoc = groupSnap.docs[0];
      const groupId = groupDoc.id;
      const g = groupDoc.data();

      // Zaten üye mi?
      const existQ = query(
        collection(db, 'group_members'),
        where('group_id', '==', groupId),
        where('user_id', '==', user.id),
        limit(1)
      );
      const existSnap = await getDocs(existQ);
      if (existSnap.empty) {
        await addDoc(collection(db, 'group_members'), {
          group_id: groupId,
          user_id: user.id,
          joined_at: serverTimestamp(),
        });
      }

      await loadGroups(user.id);

      // Aktif grup olarak ayarla
      const membersQ = query(collection(db, 'group_members'), where('group_id', '==', groupId));
      const membersSnap = await getDocs(membersQ);
      const members = membersSnap.docs.map(m => m.data().user_id as string);

      const joinedGroup: Group = {
        id: groupId,
        name: g.name || '',
        createdBy: g.created_by || '',
        members,
        createdAt: g.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        roomCode: g.room_code || cleanCode,
      } as Group & { roomCode: string };

      setCurrentGroup(joinedGroup);
      return true;
    } catch (error) {
      console.error('[joinGroup] Error:', error);
      return false;
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      const q = query(
        collection(db, 'group_members'),
        where('group_id', '==', groupId),
        where('user_id', '==', user.id)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (currentGroup?.id === groupId) setCurrentGroup(null);
    } catch (error) {
      console.error('[leaveGroup] Error:', error);
    }
  }, [currentGroup]);

  const switchGroup = useCallback((group: Group | null) => {
    setCurrentGroup(group);
    if (group) {
      getDoc(doc(db, 'shared_data', group.id)).then(d => {
        if (d.exists()) {
          const sd = d.data();
          if (sd.data) setSharedData(sd.data as AppData);
        }
      });
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
      leaveGroup,
      switchGroup,
      sharedData,
      sharedFeed,
      sendToFriends,
      markFeedRead,
      refreshSharedFeed,
      addNotification,
      clearNotifications,
      generateId,
      escapeHtml,
      allUsers,
      refreshRequests,
      activeTab,
      setActiveTab,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}
