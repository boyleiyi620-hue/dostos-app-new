import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  User, FriendRequest, Friend, AppData, Group,
  Notification, TabId, SharedFeedItem
} from '@/types';

// ─── SUPABASE CLIENT ───
const SUPABASE_URL = 'https://zblamvvtyrksobxhhggl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpibGFtdnZ0eXJrc29ieGhoZ2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTUxOTMsImV4cCI6MjA5ODQzMTE5M30.NuXZALkTncx6631gvDSzchR8VVZvRk64x__DuesTc_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  // Ref for friends (to use in callbacks without stale closure)
  const friendsRef = useRef<Friend[]>([]);
  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  // Load user data when logged in
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

  // Realtime subscription for shared feed
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`shared_feed_${currentUser.id}`)
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
          // Add notification
          addNotificationLocal(`📨 Arkadaşından yeni ${getTypeLabel(item.type)} geldi!`, 'fa-share');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Realtime subscription for friend requests
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`friend_requests_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${currentUser.id}`,
        },
        () => {
          refreshRequestsState(currentUser.id);
          addNotificationLocal('👋 Yeni arkadaşlık isteği aldın!', 'fa-user-plus');
        }
      )
      .subscribe();

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
      // Load user's personal data
      const { data: appDataRes } = await supabase
        .from('app_data')
        .select('data')
        .eq('user_id', userId)
        .single();

      if (appDataRes?.data) {
        setData(appDataRes.data as AppData);
      }

      // Load friends
      const { data: friendsRes } = await supabase
        .from('friends')
        .select('friend_id, users!friends_friend_id_fkey(id, username, display_name, avatar, color)')
        .eq('user_id', userId);

      if (friendsRes) {
        const friendsList = friendsRes.map((f: any) => ({
          userId: f.friend_id,
          username: f.users.username,
          displayName: f.users.display_name,
          avatar: f.users.avatar,
          color: f.users.color,
          since: new Date().toLocaleString('tr-TR'),
        }));
        setFriends(friendsList);
        friendsRef.current = friendsList;
      }

      // Load friend requests
      await refreshRequestsState(userId);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data: usersRes } = await supabase.from('users').select('*');
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
      console.error('Error loading users:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data: groupsRes } = await supabase.from('groups').select('*');
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
      console.error('Error loading groups:', error);
    }
  };

  const loadSharedFeed = async (userId: string) => {
    try {
      const { data: feedRes } = await supabase
        .from('shared_feed')
        .select(`
          *,
          sender:users!shared_feed_from_user_id_fkey(username, display_name)
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedRes) {
        const items: SharedFeedItem[] = feedRes.map((f: any) => ({
          id: f.id,
          fromUserId: f.from_user_id,
          fromUsername: f.sender?.username || '',
          fromDisplayName: f.sender?.display_name || '',
          toUserId: f.to_user_id,
          type: f.type,
          content: f.content,
          read: f.read,
          createdAt: f.created_at,
        }));
        setSharedFeed(items);
      }
    } catch (error) {
      console.error('Error loading shared feed:', error);
    }
  };

  const refreshRequestsState = async (userId?: string) => {
    const uid = userId || currentUser?.id;
    if (!uid) return;

    try {
      // Incoming requests
      const { data: incomingRes } = await supabase
        .from('friend_requests')
        .select('*, users!friend_requests_from_user_id_fkey(username, display_name)')
        .eq('to_user_id', uid)
        .eq('status', 'pending');

      if (incomingRes) {
        const incoming = incomingRes.map((r: any) => ({
          id: r.id,
          fromUserId: r.from_user_id,
          fromUsername: r.users.username,
          fromDisplayName: r.users.display_name,
          toUserId: r.to_user_id,
          status: r.status,
          createdAt: r.created_at,
        }));
        setFriendRequests(incoming);
      }

      // Outgoing requests
      const { data: outgoingRes } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('from_user_id', uid)
        .eq('status', 'pending');

      if (outgoingRes) {
        setSentRequests(outgoingRes.map((r: any) => ({
          id: r.id,
          fromUserId: r.from_user_id,
          fromUsername: '',
          fromDisplayName: '',
          toUserId: r.to_user_id,
          status: r.status,
          createdAt: r.created_at,
        })));
      }
    } catch (error) {
      console.error('Error refreshing requests:', error);
    }
  };

  // ─── AUTH ───
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .eq('password', password)
        .single();

      if (error || !users) return false;

      const user: User = {
        id: users.id,
        username: users.username,
        password: users.password,
        displayName: users.display_name,
        avatar: users.avatar,
        color: users.color,
        createdAt: users.created_at,
      };

      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName: string): Promise<boolean> => {
    try {
      const cleanUsername = username.toLowerCase().trim();

      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) return false;

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          username: cleanUsername,
          password,
          display_name: displayName.trim() || cleanUsername,
          avatar: (displayName.trim() || cleanUsername)[0].toUpperCase(),
          color: randomColor(),
        }])
        .select()
        .single();

      if (error || !newUser) return false;

      // Create app_data entry
      await supabase
        .from('app_data')
        .insert([{
          user_id: newUser.id,
          data: defaultAppData(),
        }]);

      const user: User = {
        id: newUser.id,
        username: newUser.username,
        password: newUser.password,
        displayName: newUser.display_name,
        avatar: newUser.avatar,
        color: newUser.color,
        createdAt: newUser.created_at,
      };

      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Register error:', error);
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
    if (!currentUser) return;
    try {
      await supabase
        .from('app_data')
        .upsert({
          user_id: currentUser.id,
          data: newData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      // Also save to shared if in a group
      if (currentGroup) {
        await supabase
          .from('shared_data')
          .update({ data: newData, updated_at: new Date().toISOString() })
          .eq('group_id', currentGroup.id);
        setSharedData(newData);
      }
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  }, [currentUser, currentGroup]);

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

  // ─── SHARED FEED (arkadaşlara paylaşım) ───
  const sendToFriends = useCallback(async (type: string, content: object) => {
    if (!currentUser) return;

    const currentFriends = friendsRef.current;
    if (currentFriends.length === 0) return;

    try {
      // Tüm arkadaşlara gönder
      const inserts = currentFriends.map(friend => ({
        from_user_id: currentUser.id,
        to_user_id: friend.userId,
        type,
        content: {
          ...content,
          senderName: currentUser.displayName || currentUser.username,
          senderUsername: currentUser.username,
          sentAt: new Date().toISOString(),
        },
        read: false,
      }));

      await supabase.from('shared_feed').insert(inserts);
    } catch (error) {
      console.error('Error sending to friends:', error);
    }
  }, [currentUser]);

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
      console.error('Error marking feed read:', error);
    }
  }, []);

  const refreshSharedFeed = useCallback(async () => {
    if (currentUser) {
      await loadSharedFeed(currentUser.id);
    }
  }, [currentUser]);

  // ─── FRIENDS ───
  const sendFriendRequest = useCallback(async (toUsername: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', toUsername.toLowerCase().trim())
        .maybeSingle();

      if (!targetUser || targetUser.id === currentUser.id) return false;

      // Check if already friends
      const alreadyFriend = friendsRef.current.find(f => f.userId === targetUser.id);
      if (alreadyFriend) return false;

      // Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('from_user_id', currentUser.id)
        .eq('to_user_id', targetUser.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) return false;

      // Create request
      const { error } = await supabase.from('friend_requests').insert([{
        from_user_id: currentUser.id,
        to_user_id: targetUser.id,
        status: 'pending',
      }]);

      if (error) return false;

      await refreshRequestsState();
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  }, [currentUser]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    if (!currentUser) return;

    try {
      const { data: req } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!req) return;

      // Update request status
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      // Add friendship both ways
      await supabase.from('friends').insert([
        { user_id: currentUser.id, friend_id: req.from_user_id },
        { user_id: req.from_user_id, friend_id: currentUser.id },
      ]);

      await loadUserData(currentUser.id);
      await refreshRequestsState();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  }, [currentUser]);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      await refreshRequestsState();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  }, []);

  const removeFriend = useCallback(async (userId: string) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`);

      await loadUserData(currentUser.id);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }, [currentUser]);

  const refreshRequests = useCallback(async () => {
    if (currentUser) {
      await refreshRequestsState(currentUser.id);
    }
  }, [currentUser]);

  // ─── GROUPS ───
  const createGroup = useCallback(async (name: string) => {
    if (!currentUser) return;

    try {
      const { data: newGroup } = await supabase
        .from('groups')
        .insert([{
          name,
          created_by: currentUser.id,
        }])
        .select()
        .single();

      if (!newGroup) return;

      // Add creator as member
      await supabase.from('group_members').insert([{
        group_id: newGroup.id,
        user_id: currentUser.id,
      }]);

      // Create shared data for group
      await supabase.from('shared_data').insert([{
        group_id: newGroup.id,
        data: defaultAppData(),
      }]);

      const group: Group = {
        id: newGroup.id,
        name: newGroup.name,
        createdBy: newGroup.created_by,
        members: [currentUser.id],
        createdAt: newGroup.created_at,
      };

      setGroups(prev => [...prev, group]);
      setCurrentGroup(group);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }, [currentUser]);

  const joinGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const { data: group } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (!group) return false;

      // Check if already member
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('group_members').insert([{
          group_id: groupId,
          user_id: currentUser.id,
        }]);
      }

      await loadGroups();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  }, [currentUser]);

  const switchGroup = useCallback((group: Group | null) => {
    setCurrentGroup(group);
    if (group) {
      supabase
        .from('shared_data')
        .select('data')
        .eq('group_id', group.id)
        .single()
        .then(({ data }) => {
          if (data?.data) {
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
        .then(({ data }) => {
          if (data?.data) {
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
