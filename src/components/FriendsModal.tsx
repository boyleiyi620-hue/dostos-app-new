import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, UserPlus, UserCheck, UserX, Users, Crown, Plus } from 'lucide-react';

export default function FriendsModal({ onClose }: { onClose: () => void }) {
  const {
    currentUser, friends, friendRequests, sentRequests,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
    allUsers, createGroup, joinGroup, currentGroup, groups, switchGroup
  } = useApp();
  const [tab, setTab] = useState<'friends' | 'requests' | 'add' | 'groups'>('friends');
  const [searchUser, setSearchUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [msg, setMsg] = useState('');

  const handleSendRequest = () => {
    setMsg('');
    if (!searchUser.trim()) return;
    if (searchUser.trim() === currentUser?.username) {
      setMsg('Kendini ekleyemezsin!');
      return;
    }
    const ok = sendFriendRequest(searchUser.trim());
    if (ok) {
      setMsg('Arkadaşlık isteği gönderildi!');
      setSearchUser('');
    } else {
      setMsg('Kullanıcı bulunamadı veya zaten istek gönderildi.');
    }
  };

  const otherUsers = allUsers.filter(u =>
    u.id !== currentUser?.id &&
    !friends.find(f => f.userId === u.id) &&
    !friendRequests.find(r => r.fromUserId === u.id) &&
    !sentRequests.find(r => r.toUserId === u.id)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold flex items-center gap-2"><Users size={20} style={{ color: 'var(--accent)' }} /> Arkadaşlar & Gruplar</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {[
            { id: 'friends' as const, label: `Arkadaşlar (${friends.length})` },
            { id: 'requests' as const, label: `İstekler (${friendRequests.length})` },
            { id: 'add' as const, label: 'Ekle' },
            { id: 'groups' as const, label: 'Gruplar' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); }}
              className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all"
              style={{
                background: tab === t.id ? 'linear-gradient(135deg, var(--accent), #f59e0b)' : 'transparent',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}>{t.label}</button>
          ))}
        </div>

        {/* Message */}
        {msg && (
          <div className="mb-3 p-2 rounded-lg text-xs font-semibold text-center"
            style={{ background: msg.includes('gönderildi') || msg.includes('Oluşturuldu') ? 'var(--green-dim)' : 'var(--red-dim)', color: msg.includes('gönderildi') || msg.includes('Oluşturuldu') ? 'var(--green)' : 'var(--red)' }}>
            {msg}
          </div>
        )}

        {/* Friends Tab */}
        {tab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="empty-state">
                <Users size={40} className="empty-state-icon" />
                <div>Henüz arkadaşın yok.</div>
                <div className="empty-state-hint">"Ekle" sekmesinden arkadaş ekle.</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {friends.map(f => (
                  <div key={f.userId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: f.color || 'var(--bg-elevated)', color: '#fff', border: '2px solid var(--border)' }}>
                      {f.avatar || f.username[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{f.displayName || f.username}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{f.username}</div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { if (confirm('Arkadaşı silmek istediğinize emin misiniz?')) removeFriend(f.userId); }}>
                      <UserX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <>
            {friendRequests.length === 0 ? (
              <div className="empty-state">
                <UserCheck size={40} className="empty-state-icon" />
                <div>Bekleyen istek yok.</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {friendRequests.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '2px solid var(--border)' }}>
                      {(req.fromDisplayName || req.fromUsername)[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{req.fromDisplayName || req.fromUsername}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{req.fromUsername}</div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-green-500/10 transition-colors" style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => acceptFriendRequest(req.id)}><UserCheck size={16} /></button>
                    <button className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => rejectFriendRequest(req.id)}><UserX size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Tab */}
        {tab === 'add' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input className="glass-input flex-1" placeholder="Kullanıcı adı..." value={searchUser} onChange={e => setSearchUser(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendRequest()} />
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={handleSendRequest}><UserPlus size={16} /></button>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>ÖNERİLEN KULLANICILAR</div>
            <div className="space-y-2 max-h-[35vh] overflow-y-auto">
              {otherUsers.length === 0 ? (
                <div className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>Tüm kullanıcılar zaten arkadaşın!</div>
              ) : (
                otherUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: u.color || 'var(--bg-elevated)', color: '#fff', border: '2px solid var(--border)' }}>
                      {u.avatar || u.username[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{u.displayName || u.username}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-orange-500/10 transition-colors" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { setSearchUser(u.username); }}><UserPlus size={16} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {tab === 'groups' && (
          <div className="space-y-3">
            {currentGroup && (
              <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, var(--accent-glow), rgba(251,191,36,0.05))', border: '1px solid rgba(249,115,22,0.2)' }}>
                <Crown size={20} style={{ color: 'var(--accent)', margin: '0 auto' }} />
                <div className="font-bold text-sm mt-1">{currentGroup.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Aktif Grup · {currentGroup.members.length} üye</div>
                <button className="btn-gradient mt-2 w-full justify-center" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11 }}
                  onClick={() => switchGroup(null)}>Gruptan Ayrıl</button>
              </div>
            )}
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>YENİ GRUP OLUŞTUR</div>
            <div className="flex gap-2">
              <input className="glass-input flex-1" placeholder="Grup adı..." value={groupName} onChange={e => setGroupName(e.target.value)} />
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--green), #16a34a)', color: '#fff' }}
                onClick={() => { if (groupName.trim()) { createGroup(groupName.trim()); setGroupName(''); setMsg('Grup oluşturuldu!'); } }}><Plus size={16} /></button>
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>GRUP KODU İLE KATIL</div>
            <div className="flex gap-2">
              <input className="glass-input flex-1" placeholder="Grup ID..." value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--blue), #2563eb)', color: '#fff' }}
                onClick={() => { if (joinGroup(joinCode.trim())) { setJoinCode(''); setMsg('Gruba katıldın!'); } else setMsg('Geçersiz grup kodu.'); }}>Katıl</button>
            </div>
            {groups.length > 0 && (
              <>
                <div className="text-xs font-semibold mt-2" style={{ color: 'var(--text-muted)' }}>GRUPLARIN</div>
                <div className="space-y-2 max-h-[25vh] overflow-y-auto">
                  {groups.filter(g => g.members.includes(currentUser?.id || '')).map(g => (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold" style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}><Users size={18} /></div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{g.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{g.members.length} üye · ID: {g.id.substring(0, 8)}...</div>
                      </div>
                      <button className="btn-gradient btn-sm" style={{ background: currentGroup?.id === g.id ? 'var(--green-dim)' : 'var(--accent-glow)', color: currentGroup?.id === g.id ? 'var(--green)' : 'var(--accent)', fontSize: 10 }}
                        onClick={() => { switchGroup(g); setMsg('Grup değiştirildi!'); }}>
                        {currentGroup?.id === g.id ? 'Aktif' : 'Seç'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
