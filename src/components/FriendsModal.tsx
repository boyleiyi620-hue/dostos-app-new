import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, UserPlus, UserCheck, UserX, Users, Crown, Plus, Copy, Check, LogOut } from 'lucide-react';

export default function FriendsModal({ onClose }: { onClose: () => void }) {
  const {
    currentUser, friends, friendRequests, sentRequests,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
    allUsers, createGroup, joinGroup, leaveGroup, currentGroup, groups, switchGroup
  } = useApp();
  const [tab, setTab] = useState<'friends' | 'requests' | 'add' | 'groups'>('friends');
  const [searchUser, setSearchUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSendRequest = async () => {
    if (!searchUser.trim()) return;
    if (searchUser.trim().toLowerCase() === currentUser?.username) {
      showMsg('Kendini ekleyemezsin!', 'error');
      return;
    }
    setLoading(true);
    const ok = await sendFriendRequest(searchUser.trim());
    setLoading(false);
    if (ok) {
      showMsg('Arkadaşlık isteği gönderildi! ✓');
      setSearchUser('');
    } else {
      showMsg('Kullanıcı bulunamadı veya zaten istek gönderildi.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    await createGroup(groupName.trim());
    setLoading(false);
    setGroupName('');
    showMsg('Grup oluşturuldu! ✓');
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    const ok = await joinGroup(joinCode.trim());
    setLoading(false);
    if (ok) {
      setJoinCode('');
      showMsg('Gruba katıldın! ✓');
    } else {
      showMsg('Geçersiz oda kodu.', 'error');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Gruptan ayrılmak istediğinize emin misiniz?')) return;
    setLoading(true);
    await leaveGroup(groupId);
    setLoading(false);
    showMsg('Gruptan ayrıldın.');
  };

  // Önerilenler: arkadaş olmayan, istek gönderilmemiş kullanıcılar
  const otherUsers = allUsers.filter(u =>
    u.id !== currentUser?.id &&
    !friends.find(f => f.userId === u.id) &&
    !friendRequests.find(r => r.fromUserId === u.id) &&
    !sentRequests.find(r => r.toUserId === u.id)
  );

  // Kullanıcının üye olduğu gruplar
  const myGroups = groups.filter(g => g.members.includes(currentUser?.id || ''));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <Users size={20} style={{ color: 'var(--accent)' }} /> Arkadaşlar & Gruplar
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
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
            style={{
              background: msgType === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
              color: msgType === 'success' ? 'var(--green)' : 'var(--red)'
            }}>
            {msg}
          </div>
        )}

        {/* ── Friends Tab ── */}
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
                  <div key={f.userId} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: f.color || 'var(--bg-elevated)', color: '#fff', border: '2px solid var(--border)' }}>
                      {f.avatar || f.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{f.displayName || f.username}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{f.username}</div>
                    </div>
                    <button
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { if (confirm('Arkadaşı silmek istediğinize emin misiniz?')) removeFriend(f.userId); }}>
                      <UserX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Requests Tab ── */}
        {tab === 'requests' && (
          <>
            {friendRequests.length === 0 && sentRequests.length === 0 ? (
              <div className="empty-state">
                <UserCheck size={40} className="empty-state-icon" />
                <div>Bekleyen istek yok.</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {/* Gelen istekler */}
                {friendRequests.length > 0 && (
                  <>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>GELEN İSTEKLER</div>
                    {friendRequests.map(req => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                          style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '2px solid var(--border)' }}>
                          {(req.fromDisplayName || req.fromUsername)[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{req.fromDisplayName || req.fromUsername}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{req.fromUsername}</div>
                        </div>
                        <button
                          className="p-2 rounded-lg hover:bg-green-500/10 transition-colors"
                          style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => acceptFriendRequest(req.id)}>
                          <UserCheck size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => rejectFriendRequest(req.id)}>
                          <UserX size={16} />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Gönderilen istekler */}
                {sentRequests.length > 0 && (
                  <>
                    <div className="text-xs font-bold mt-2" style={{ color: 'var(--text-muted)' }}>GÖNDERİLEN İSTEKLER</div>
                    {sentRequests.map(req => (
                      <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', opacity: 0.8 }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '2px solid var(--border)' }}>
                          {req.toUserId[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">@{req.toUserId}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Bekliyor...</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Add Tab ── */}
        {tab === 'add' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="glass-input flex-1"
                placeholder="Kullanıcı adı..."
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
              />
              <button
                className="btn-gradient"
                style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', opacity: loading ? 0.6 : 1 }}
                onClick={handleSendRequest}
                disabled={loading}>
                <UserPlus size={16} />
              </button>
            </div>

            <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>ÖNERİLEN KULLANICILAR</div>
            <div className="space-y-2 max-h-[35vh] overflow-y-auto">
              {otherUsers.length === 0 ? (
                <div className="text-center text-xs py-4" style={{ color: 'var(--text-muted)' }}>
                  Tüm kullanıcılar zaten arkadaşın veya istek gönderildi!
                </div>
              ) : (
                otherUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: u.color || 'var(--bg-elevated)', color: '#fff', border: '2px solid var(--border)' }}>
                      {u.avatar || u.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{u.displayName || u.username}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>@{u.username}</div>
                    </div>
                    <button
                      className="p-2 rounded-lg hover:bg-orange-500/10 transition-colors"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        const ok = await sendFriendRequest(u.username);
                        if (ok) showMsg(`@${u.username} için istek gönderildi! ✓`);
                        else showMsg('İstek gönderilemedi.', 'error');
                      }}>
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Groups Tab ── */}
        {tab === 'groups' && (
          <div className="space-y-3">
            {/* Aktif grup kartı */}
            {currentGroup && (
              <div className="p-4 rounded-2xl text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,191,36,0.05))', border: '2px solid var(--accent)' }}>
                <div className="absolute top-2 right-2">
                  <Crown size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="font-extrabold text-base mb-1">{currentGroup.name}</div>
                <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Aktif Grup · {currentGroup.members.length} üye
                </div>

                {/* Oda Kodu - net ve büyük göster */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/10 flex flex-col items-center gap-2 mb-3">
                  <div className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    ODA KODU
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-2xl tracking-[0.3em]"
                      style={{ color: 'var(--accent)', letterSpacing: '0.3em' }}>
                      {currentGroup.roomCode || currentGroup.id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentGroup.roomCode || currentGroup.id)}
                      className="p-2 rounded-lg transition-all active:scale-95"
                      style={{ background: 'var(--bg-card)', color: copied ? 'var(--green)' : 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
                      title="Kopyala">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Bu kodu arkadaşlarınla paylaş
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => switchGroup(null)}>
                    Grubu Bırak (Geçici)
                  </button>
                  <button
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', cursor: 'pointer' }}
                    onClick={() => handleLeaveGroup(currentGroup.id)}>
                    <LogOut size={12} /> Gruptan Ayrıl
                  </button>
                </div>
              </div>
            )}

            {/* Yeni Grup Oluştur */}
            <div className="text-xs font-semibold mt-4" style={{ color: 'var(--text-muted)' }}>YENİ GRUP OLUŞTUR</div>
            <div className="flex gap-2">
              <input
                className="glass-input flex-1"
                placeholder="Grup adı..."
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              />
              <button
                className="btn-gradient"
                style={{ background: 'linear-gradient(135deg, var(--green), #16a34a)', color: '#fff', opacity: loading ? 0.6 : 1 }}
                onClick={handleCreateGroup}
                disabled={loading}>
                <Plus size={16} />
              </button>
            </div>

            {/* Oda Koduyla Katıl */}
            <div className="text-xs font-semibold mt-4" style={{ color: 'var(--text-muted)' }}>ODA KODUYLA KATIL</div>
            <div className="flex gap-2">
              <input
                className="glass-input flex-1"
                placeholder="6 haneli oda kodu (örn: AB3X7K)..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoinGroup()}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'monospace', fontWeight: 'bold' }}
              />
              <button
                className="btn-gradient"
                style={{ background: 'linear-gradient(135deg, var(--blue), #2563eb)', color: '#fff', opacity: loading ? 0.6 : 1 }}
                onClick={handleJoinGroup}
                disabled={loading}>
                Katıl
              </button>
            </div>

            {/* Gruplarım */}
            {myGroups.length > 0 && (
              <>
                <div className="text-xs font-semibold mt-6" style={{ color: 'var(--text-muted)' }}>GRUPLARIN</div>
                <div className="space-y-2 max-h-[25vh] overflow-y-auto">
                  {myGroups.map(g => (
                    <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--bg-card)', border: `1px solid ${currentGroup?.id === g.id ? 'var(--accent)' : 'var(--border)'}` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--accent)' }}>
                        <Users size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{g.name}</div>
                        <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {g.roomCode || g.id.slice(0, 8)} · {g.members.length} üye
                        </div>
                      </div>
                      <button
                        className="btn-gradient btn-sm"
                        style={{
                          background: currentGroup?.id === g.id ? 'var(--green-dim)' : 'var(--accent-glow)',
                          color: currentGroup?.id === g.id ? 'var(--green)' : 'var(--accent)',
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                        onClick={() => { switchGroup(g); showMsg('Grup değiştirildi!'); }}>
                        {currentGroup?.id === g.id ? 'Aktif ✓' : 'Seç'}
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
