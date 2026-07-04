import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  User, FriendRequest, Friend, AppData, Group,
  Notification, TabId, SharedFeedItem
} from '@/types';

// ─── SUPABASE CLIENT ───
const SUPABASE_URL = 'https://zblamvvtyrksobxhhggl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpibGFtdnZ0eXJrc29ieGhoZ2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxOTMsImV4cCI6MjA5ODQzMTE5M30.NuXZALkTncx6631gvDSzchR8VVZvRk64x__DuesTc_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

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
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  // Data
  data: AppData;
  saveData: (newData?: AppData) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  // Friends
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  sendFriendRequest: (toUsername: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  // Groups
  currentGroup: Group | null;
  groups: Group[];
  createGroup: (name: string) => Promise<void>;
  joinGroup: (groupId: string) => Promise<boolean>;
  switchGroup: (group: Group | null) => void;
  // Shared data
  sharedData: AppData;
  // Shared feed (arkadaş paylaşımları)
  sharedFeed: SharedFeedItem[];
  sendToFriends: (type: string, content: object) => Promise<void>;
  markFeedRead: (itemId: string) => Promise<void>;
  refreshSharedFeed: () => Promise<void>;
  // Notifications
  addNotification: (text: string, icon?: string) => void;
  clearNotifications: () => void;
  // Utils
  generateId: () => string;
  escapeHtml: (text: string | null | undefined) => string;
  allUsers: User[];
  refreshRequests: () => Promise<void>;
  // Active tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  // Loading
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

  // Refs for use in callbacks without stale closure
  const friendsRef = useRef<Friend[]>([]);
  const currentUserRef = useRef<User | null>(null);
  
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ─── LOAD USER DATA WHEN LOGGED IN ───
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      Promise.all([
        loadUserData(currentUser.id),
        loadAllUsers(),
        loadGroups(),
        loadSharedFeed(currentUser.id),
      ]).finally(() => setIsLoading(false));
    }
  }, [currentUser?.id]);

  // ─── PERIODIC REFRESH OF FRIEND REQUESTS ───
  useEffect(() => {
    if (!currentUser) return;

    // Poll for friend requests every 15 seconds as a fallback for realtime
    const interval = setInterval(() => {
      refreshRequestsState(currentUser.id);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // ─── REALTIME SUBSCRIPTION: SHARED FEED ───
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `shared_feed_${currentUser.id}`;
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_feed',
          filter: `to_user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const item = payload.new as any;
          const feedItem: SharedFeedItem = {
            id: item.id,
            fromUserId: item.from_user_id,
            fromUsername: item.from_username || '',
            fromDisplayName: item.from_display_name || '',
            toUserId: item.to_user_id,
            type: item.type,
            content: item.content,
            read: item.read,
            createdAt: item.created_at,
          };
          setSharedFeed(prev => [feedItem, ...prev]);
          addNotificationLocal(`📨 Arkadaşından yeni ${getTypeLabel(item.type)} geldi!`, 'fa-share');
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Shared feed subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // ─── REALTIME SUBSCRIPTION: FRIEND REQUESTS ───
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `friend_requests_${currentUser.id}`;
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('[Realtime] New friend request received:', payload);
          refreshRequestsState(currentUser.id);
          const newRequest = payload.new as any;
          supabase
            .from('users')
            .select('username, display_name')
            .eq('id', newRequest.from_user_id)
            .single()
            .then(({ data: sender }) => {
              const senderName = sender?.display_name || sender?.username || 'Birisi';
              addNotificationLocal(`👋 ${senderName} sana arkadaşlık isteği gönderdi!`, 'fa-user-plus');
            });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${currentUser.id}`,
        },
        () => {
          refreshRequestsState(currentUser.id);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Friend requests subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      kesfet: 'öneri',
      feed: 'gönderi',
      game: 'oyun daveti',
      music: 'müzik',
      expense: 'harcama',
      bbq: 'mangal daveti',
      challenge: 'meydan okuma',
    };
    return labels[type] || 'içerik';
  }

  // ─── LOAD FUNCTIONS ───
  const loadUserData = async (userId: string) => {
    try {
      const { data: appDataRes, error: appDataErr } = await supabase
        .from('app_data')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (appDataErr) {
        console.log('[loadUserData] No app_data found, using defaults:', appDataErr.message);
      }

      if (appDataRes?.data) {
        setData(appDataRes.data as AppData);
      }

      const { data: friendsRes, error: friendsErr } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);

      if (friendsErr) {
        console.error('[loadUserData] Error loading friends:', friendsErr);
      } else if (friendsRes && friendsRes.length > 0) {
        const friendIds = friendsRes.map(f => f.friend_id);
        
        const { data: friendUsers, error: friendUsersErr } = await supabase
          .from('users')
          .select('id, username, display_name, avatar, color')
          .in('id', friendIds);

        if (friendUsersErr) {
          console.error('[loadUserData] Error loading friend details:', friendUsersErr);
        } else if (friendUsers) {
          const friendsList = friendUsers.map((u: any) => ({
            userId: u.id,
            username: u.username,
            displayName: u.display_name,
            avatar: u.avatar,
            color: u.color,
            since: new Date().toLocaleString('tr-TR'),
          }));
          setFriends(friendsList);
          friendsRef.current = friendsList;
        }
      }

      await refreshRequestsState(userId);
    } catch (error) {
      console.error('[loadUserData] Error:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data: usersRes, error } = await supabase
        .from('users')
        .select('id, username, password, display_name, avatar, color, created_at');
      
      if (error) {
        console.error('[loadAllUsers] Error:', error);
        return;
      }
      
      if (usersRes) {
        const users = usersRes.map((u: any) => ({
          id: u.id,
          username: u.username,
          password: u.password,
          displayName: u.display_name,
          avatar: u.avatar,
          color: u.color,
          createdAt: u.created_at,
        }));
        setAllUsers(users);
      }
    } catch (error) {
      console.error('[loadAllUsers] Error:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data: groupsRes, error } = await supabase.from('groups').select('*');
      
      if (error) {
        console.error('[loadGroups] Error:', error);
        return;
      }
      
      if (groupsRes) {
        const groupsList = await Promise.all(
          groupsRes.map(async (g: any) => {
            const { data: membersRes } = await supabase
              .from('group_members')
              .select('user_id')
              .eq('group_id', g.id);
            return {
              id: g.id,
              name: g.name,
              createdBy: g.created_by,
              members: membersRes?.map((m: any) => m.user_id) || [],
              createdAt: g.created_at,
            };
          })
        );
        setGroups(groupsList);
      }
    } catch (error) {
      console.error('[loadGroups] Error:', error);
    }
  };

  const loadSharedFeed = async (userId: string) => {
    try {
      const { data: feedRes, error } = await supabase
        .from('shared_feed')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[loadSharedFeed] Error:', error);
        return;
      }

      if (feedRes) {
        const fromUserIds = [...new Set(feedRes.map(f => f.from_user_id))];
        const { data: senders } = await supabase
          .from('users')
          .select('id, username, display_name')
          .in('id', fromUserIds);

        const senderMap = new Map();
        senders?.forEach((s: any) => senderMap.set(s.id, s));

        const items: SharedFeedItem[] = feedRes.map((f: any) => ({
          id: f.id,
          fromUserId: f.from_user_id,
          fromUsername: senderMap.get(f.from_user_id)?.username || '',
          fromDisplayName: senderMap.get(f.from_user_id)?.display_name || '',
          toUserId: f.to_user_id,
          type: f.type,
          content: f.content,
          read: f.read,
          createdAt: f.created_at,
        }));
        setSharedFeed(items);
      }
    } catch (error) {
      console.error('[loadSharedFeed] Error:', error);
    }
  };

  const refreshRequestsState = async (userId?: string) => {
    const uid = userId || currentUserRef.current?.id;
    if (!uid) return;

    try {
      const { data: incomingRes, error: incomingErr } = await supabase
        .from('friend_requests')
        .select('*, sender:users!friend_requests_from_user_id_fkey(username, display_name)')
        .eq('to_user_id', uid)
        .eq('status', 'pending');

      if (incomingErr) {
        console.error('[refreshRequestsState] Incoming error:', incomingErr);
      } else if (incomingRes) {
        const incoming = incomingRes.map((r: any) => ({
          id: r.id,
          fromUserId: r.from_user_id,
          fromUsername: r.sender?.username || '',
          fromDisplayName: r.sender?.display_name || '',
          toUserId: r.to_user_id,
          status: r.status,
          createdAt: r.created_at,
        }));
        setFriendRequests(incoming);
      }

      const { data: outgoingRes, error: outgoingErr } = await supabase
        .from('friend_requests')
        .select('*, receiver:users!friend_requests_to_user_id_fkey(username, display_name)')
        .eq('from_user_id', uid)
        .eq('status', 'pending');

      if (outgoingErr) {
        console.error('[refreshRequestsState] Outgoing error:', outgoingErr);
      } else if (outgoingRes) {
        setSentRequests(outgoingRes.map((r: any) => ({
          id: r.id,
          fromUserId: r.from_user_id,
          fromUsername: currentUserRef.current?.username || '',
          fromDisplayName: currentUserRef.current?.displayName || '',
          toUserId: r.to_user_id,
          toUsername: r.receiver?.username || '',
          toDisplayName: r.receiver?.display_name || '',
          status: r.status,
          createdAt: r.created_at,
        })));
      }
    } catch (error) {
      console.error('[refreshRequestsState] Error:', error);
    }
  };

  // ─── AUTH ───
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();
      
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', password)
        .single();

      if (error || !userData) {
        console.error('[login] Supabase login error:', error?.message || 'User not found');
        return false;
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        password: userData.password,
        displayName: userData.display_name,
        avatar: userData.avatar,
        color: userData.color,
        createdAt: userData.created_at,
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

      // Step 1: Check if user already exists
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) {
        console.error('[register] Error checking existing user:', checkError);
      }

      if (existing) {
        console.log('[register] Username already exists:', cleanUsername);
        return false;
      }

      // Step 2: Create user in Supabase
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          username: cleanUsername,
          password: password,
          display_name: cleanDisplayName,
          avatar: cleanDisplayName[0].toUpperCase(),
          color: randomColor(),
        }])
        .select()
        .single();

      if (insertError || !newUser) {
        console.error('[register] Supabase insert error:', insertError?.message || 'No user returned');
        return false;
      }

      console.log('[register] User created in Supabase:', newUser.id);

      // Step 3: Verify the user was actually created
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', newUser.id)
        .single();

      if (verifyError || !verifyUser) {
        console.error('[register] Verification failed:', verifyError);
        return false;
      }

      // Step 4: Create app_data entry for the new user
      const { error: appDataError } = await supabase
        .from('app_data')
        .insert([{
          user_id: newUser.id,
          data: defaultAppData(),
        }]);

      if (appDataError) {
        console.error('[register] Error creating app_data:', appDataError);
      }

      // Step 5: Set current user and save session
      const user: User = {
        id: verifyUser.id,
        username: verifyUser.username,
        password: verifyUser.password,
        displayName: verifyUser.display_name,
        avatar: verifyUser.avatar,
        color: verifyUser.color,
        createdAt: verifyUser.created_at,
      };

      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      
      // Step 6: Refresh users list
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
      await supabase
        .from('app_data')
        .upsert({
          user_id: user.id,
          data: newData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (currentGroup) {
        await supabase
          .from('shared_data')
          .update({ data: newData, updated_at: new Date().toISOString() })
          .eq('group_id', currentGroup.id);
        setSharedData(newData);
      }
    } catch (error) {
      console.error('[persistData] Error:', error);
    }
  }, [currentGroup]);

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
      const inserts = currentFriends.map(friend => ({
        from_user_id: user.id,
        to_user_id: friend.userId,
        type,
        content: {
          ...content,
          senderName: user.displayName || user.username,
          senderUsername: user.username,
          sentAt: new Date().toISOString(),
        },
        read: false,
      }));

      const { error } = await supabase.from('shared_feed').insert(inserts);
      if (error) {
        console.error('[sendToFriends] Insert error:', error);
        throw error;
      }
      console.log('[sendToFriends] Sent to', inserts.length, 'friends');
    } catch (error) {
      console.error('[sendToFriends] Error:', error);
    }
  }, []);

  const markFeedRead = useCallback(async (itemId: string) => {
    try {
      await supabase
        .from('shared_feed')
        .update({ read: true })
        .eq('id', itemId);

      setSharedFeed(prev =>
        prev.map(item => item.id === itemId ? { ...item, read: true } : item)
      );
    } catch (error) {
      console.error('[markFeedRead] Error:', error);
    }
  }, []);

  const refreshSharedFeed = useCallback(async () => {
    const user = currentUserRef.current;
    if (user) {
      await loadSharedFeed(user.id);
    }
  }, []);

  // ─── FRIENDS ───
  const sendFriendRequest = useCallback(async (toUsername: string): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user) {
      console.error('[sendFriendRequest] No current user');
      return false;
    }

    try {
      const cleanTargetUsername = toUsername.toLowerCase().trim();
      
      const { data: targetUser, error: targetError } = await supabase
        .from('users')
        .select('id, username, display_name')
        .eq('username', cleanTargetUsername)
        .maybeSingle();

      if (targetError) {
        console.error('[sendFriendRequest] Error finding user:', targetError);
        return false;
      }

      if (!targetUser) {
        console.log('[sendFriendRequest] User not found:', cleanTargetUsername);
        return false;
      }

      if (targetUser.id === user.id) {
        console.log('[sendFriendRequest] Cannot send request to self');
        return false;
      }

      const currentFriends = friendsRef.current;
      const alreadyFriend = currentFriends.find(f => f.userId === targetUser.id);
      if (alreadyFriend) {
        console.log('[sendFriendRequest] Already friends with:', cleanTargetUsername);
        return false;
      }

      const { data: existingReq, error: existingError } = await supabase
        .from('friend_requests')
        .select('id, status')
        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${user.id})`)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existingError) {
        console.error('[sendFriendRequest] Error checking existing request:', existingError);
      }

      if (existingReq) {
        console.log('[sendFriendRequest] Request already exists:', existingReq.status);
        return false;
      }

      const { data: newRequest, error: insertError } = await supabase
        .from('friend_requests')
        .insert([{
          from_user_id: user.id,
          to_user_id: targetUser.id,
          status: 'pending',
        }])
        .select()
        .single();

      if (insertError) {
        console.error('[sendFriendRequest] Insert error:', insertError);
        return false;
      }

      console.log('[sendFriendRequest] Request created:', newRequest);
      await refreshRequestsState();
      return true;
    } catch (error) {
      console.error('[sendFriendRequest] Unexpected error:', error);
      return false;
    }
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    const user = currentUserRef.current;
    if (!user) return;

    try {
      const { data: req, error: reqError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (reqError || !req) {
        console.error('[acceptFriendRequest] Request not found:', reqError);
        return;
      }

      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        console.error('[acceptFriendRequest] Update error:', updateError);
        return;
      }

      const { error: friendInsertError } = await supabase.from('friends').insert([
        { user_id: user.id, friend_id: req.from_user_id },
        { user_id: req.from_user_id, friend_id: user.id },
      ]);

      if (friendInsertError) {
        console.error('[acceptFriendRequest] Friends insert error:', friendInsertError);
      }

      await loadUserData(user.id);
      await refreshRequestsState();
      console.log('[acceptFriendRequest] Request accepted:', requestId);
    } catch (error) {
      console.error('[acceptFriendRequest] Error:', error);
    }
  }, []);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) {
        console.error('[rejectFriendRequest] Error:', error);
      }

      await refreshRequestsState();
    } catch (error) {
      console.error('[rejectFriendRequest] Error:', error);
    }
  }, []);

  const removeFriend = useCallback(async (userId: string) => {
    const user = currentUserRef.current;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`);

      if (error) {
        console.error('[removeFriend] Error:', error);
      }

      await loadUserData(user.id);
    } catch (error) {
      console.error('[removeFriend] Error:', error);
    }
  }, []);

  const refreshRequests = useCallback(async () => {
    const user = currentUserRef.current;
    if (user) {
      await refreshRequestsState(user.id);
    }
  }, []);

  // ─── GROUPS ───
  const createGroup = useCallback(async (name: string) => {
    const user = currentUserRef.current;
    if (!user) return;

    try {
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert([{
          name,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error || !newGroup) {
        console.error('[createGroup] Error:', error);
        return;
      }

      await supabase.from('group_members').insert([{
        group_id: newGroup.id,
        user_id: user.id,
      }]);

      await supabase.from('shared_data').insert([{
        group_id: newGroup.id,
        data: defaultAppData(),
      }]);

      const group: Group = {
        id: newGroup.id,
        name: newGroup.name,
        createdBy: newGroup.created_by,
        members: [user.id],
        createdAt: newGroup.created_at,
      };

      setGroups(prev => [...prev, group]);
      setCurrentGroup(group);
    } catch (error) {
      console.error('[createGroup] Error:', error);
    }
  }, []);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    const user = currentUserRef.current;
    if (!user) return false;

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        console.error('[joinGroup] Group not found:', groupError);
        return false;
      }

      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        const { error: joinError } = await supabase.from('group_members').insert([{
          group_id: groupId,
          user_id: user.id,
        }]);
        
        if (joinError) {
          console.error('[joinGroup] Join error:', joinError);
        }
      }

      await loadGroups();
      return true;
    } catch (error) {
      console.error('[joinGroup] Error:', error);
      return false;
    }
  }, []);

  const switchGroup = useCallback((group: Group | null) => {
    setCurrentGroup(group);
    if (group) {
      supabase
        .from('shared_data')
        .select('data')
        .eq('group_id', group.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[switchGroup] Error:', error);
          } else if (data?.data) {
            setSharedData(data.data as AppData);
          }
        });
    }
  }, []);

  // ─── NOTIFICATIONS ───
  const addNotificationLocal = (text: string, icon: string = 'fa-bell') => {
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
      return { ...prev, notifications: newNotifs };
    });
  };

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

  // ─── SYNC DATA ───
  useEffect(() => {
    if (currentGroup) {
      supabase
        .from('shared_data')
        .select('data')
        .eq('group_id', currentGroup.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('[syncData] Error:', error);
          } else if (data?.data) {
            setSharedData(data.data as AppData);
          }
        });
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
