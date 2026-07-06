export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  avatar: string;
  color: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friend {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  color: string;
  since: string;
}

// Arkadaşlardan gelen paylaşımlar
export interface SharedFeedItem {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  toUserId: string;
  type: string; // 'kesfet' | 'feed' | 'game' | 'music' | 'expense' | 'bbq' | 'challenge'
  content: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface KesfetItem {
  id: string;
  title: string;
  date: string;
  location: string;
  budget: string;
  participants: Participant[];
  authorId?: string;
  authorName?: string;
  groupId?: string;
  status?: 'pending' | 'approved' | 'skipped';
  approvedBy?: string[];
  rejectedBy?: string[];
}

export interface ArenaLig {
  id: string;
  name: string;
  detail: string;
  icon: string;
  status: string;
  participants: Participant[];
  matches: Match[];
  standings: Standing[];
  groupId?: string;
}

export interface Match {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  date: string;
}

export interface Standing {
  team: string;
  o: number;
  g: number;
  b: number;
  m: number;
  p: number;
}

export interface Challenge {
  id: string;
  title: string;
  desc: string;
  target: string;
  status: string;
  progress: string;
  participants: Participant[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  type: 'gelir' | 'gider';
  payer: string;
  members: number;
  groupId?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
}

export interface Debt {
  id: string;
  from: string;
  to: string;
  amount: number;
  reason: string;
  status: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  next: string;
  status: string;
}

export interface GiftFund {
  id: string;
  name: string;
  target: number;
  current: number;
}

export interface BBQ {
  id: string;
  name: string;
  status: string;
  meat: string;
  items: string;
  location: string;
  participants: Participant[];
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  status: string;
  tasks: ProjectTask[];
}

export interface ProjectTask {
  text: string;
  done: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji: string;
  owner: string;
  status: string;
}

export interface FeedPost {
  id: string;
  author: string;
  text: string;
  time: string;
  color: string;
  avatar: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
}

export interface Game {
  id: string;
  name: string;
  players: number;
  location: string;
  icon: string;
  status: string;
  participants: Participant[];
}

export interface Album {
  id: string;
  name: string;
  emoji: string;
  photos: string[];
}

export interface Participant {
  name: string;
  status: 'coming' | 'notcoming' | 'maybe';
  value?: string;
}

export interface AppData {
  kesfet: KesfetItem[];
  arenaLigler: ArenaLig[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  expenses: Expense[];
  subscriptions: Subscription[];
  giftfunds: GiftFund[];
  bbqs: BBQ[];
  projects: Project[];
  feed: FeedPost[];
  music: MusicTrack[];
  games: Game[];
  albums: Album[];
  inventory: InventoryItem[];
  debts: Debt[];
  notifications: Notification[];
  history: HistoryEntry[];
  members: number;
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  icon: string;
  read?: boolean;
}

export interface HistoryEntry {
  title: string;
  date: string;
  status: 'approved' | 'skipped';
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  roomCode?: string;
}

export type TabId = 'kesfet' | 'arena' | 'kasa' | 'atolye' | 'canli';
