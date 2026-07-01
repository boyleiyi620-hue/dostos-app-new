import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Music, Gamepad2, Images, Plus, ThumbsUp, MessageCircle, Trash2 } from 'lucide-react';

export default function TabLive() {
  const { data, setData, addNotification, escapeHtml, currentUser } = useApp();
  const [showFeedAdd, setShowFeedAdd] = useState(false);
  const [showMusicAdd, setShowMusicAdd] = useState(false);
  const [showGameAdd, setShowGameAdd] = useState(false);
  const [showAlbumAdd, setShowAlbumAdd] = useState(false);
  const [feedForm, setFeedForm] = useState({ author: '', text: '', color: 'var(--gold-dim)' });
  const [musicForm, setMusicForm] = useState({ title: '', artist: '' });
  const [gameForm, setGameForm] = useState({ name: '', players: '', location: '', icon: '🎮', status: 'Planlandı' });
  const [albumForm, setAlbumForm] = useState({ name: '', emoji: '📷' });
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);

  const addFeed = () => {
    if (!feedForm.text.trim()) return;
    const author = feedForm.author || currentUser?.displayName || currentUser?.username || 'Anonim';
    const newPost = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      author,
      text: feedForm.text,
      time: 'Şimdi',
      color: feedForm.color || 'var(--gold-dim)',
      avatar: author[0],
    };
    setData(prev => ({ ...prev, feed: [...prev.feed, newPost] }));
    addNotification(`📝 ${author} yeni bir gönderi paylaştı.`);
    setFeedForm({ author: '', text: '', color: 'var(--gold-dim)' });
    setShowFeedAdd(false);
  };

  const addMusic = () => {
    if (!musicForm.title.trim()) return;
    const newTrack = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...musicForm };
    setData(prev => ({ ...prev, music: [...prev.music, newTrack] }));
    addNotification(`🎵 "${musicForm.title}" kuyruğa eklendi.`);
    setMusicForm({ title: '', artist: '' });
    setShowMusicAdd(false);
  };

  const addGame = () => {
    if (!gameForm.name.trim()) return;
    const newGame = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...gameForm, players: Number(gameForm.players) || 0, participants: [] };
    setData(prev => ({ ...prev, games: [...prev.games, newGame] }));
    addNotification(`🎮 "${gameForm.name}" turnuvası oluşturuldu.`);
    setGameForm({ name: '', players: '', location: '', icon: '🎮', status: 'Planlandı' });
    setShowGameAdd(false);
  };

  const addAlbum = () => {
    if (!albumForm.name.trim()) return;
    const newAlbum = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...albumForm, photos: [] as string[] };
    setData(prev => ({ ...prev, albums: [...prev.albums, newAlbum] }));
    addNotification(`📁 "${albumForm.name}" albümü oluşturuldu.`);
    setAlbumForm({ name: '', emoji: '📷' });
    setShowAlbumAdd(false);
  };

  const handlePhotoUpload = (albumId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      let loaded = 0;
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setData(prev => ({
            ...prev,
            albums: prev.albums.map(a => a.id === albumId ? { ...a, photos: [...a.photos, ev.target?.result as string] } : a),
          }));
          loaded++;
          if (loaded === files.length) addNotification(`📸 ${loaded} fotoğraf yüklendi.`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const activeAlbum = data.albums.find(a => a.id === openAlbum);

  return (
    <div>
      {/* Feed */}
      <div className="section-title">
        <h3><span className="icon-box"><Zap size={16} /></span>Canlı Akış <span className="count-badge">{data.feed.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowFeedAdd(true)}><Plus size={14} /> Gönderi</button>
      </div>
      {data.feed.length === 0 ? (
        <div className="empty-state">
          <Zap size={48} className="empty-state-icon" />
          <div>Gönderi yok.</div>
          <div className="empty-state-hint">Grubunla anı paylaşmaya başla!</div>
        </div>
      ) : (
        data.feed.slice().reverse().map(post => (
          <div key={post.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: '50%', background: post.color || 'var(--bg-elevated)', fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', border: '2px solid var(--border)' }}>
              {escapeHtml(post.avatar || post.author[0])}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm leading-relaxed"><strong style={{ color: 'var(--text-primary)' }}>{escapeHtml(post.author)}</strong> {escapeHtml(post.text)}</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>⏱ {escapeHtml(post.time)}</div>
              <div className="flex gap-4 mt-1">
                <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => addNotification(`👍 ${post.author} gönderisini beğendin.`)}><ThumbsUp size={12} /> Beğen</button>
                <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => addNotification(`💬 ${post.author} gönderisine yorum yaptın.`)}><MessageCircle size={12} /> Yorum</button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Albums */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Images size={16} /></span>O An Duvarı <span className="count-badge">{data.albums.length}</span></h3>
        <div className="flex gap-2">
          <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent-glow), rgba(251,191,36,0.05))', color: 'var(--accent)', border: '1px solid rgba(249,115,22,0.15)' }}
            onClick={() => setShowAlbumAdd(true)}>📁 Albüm</button>
        </div>
      </div>
      {data.albums.length === 0 ? (
        <div className="empty-state">
          <Images size={48} className="empty-state-icon" />
          <div>Henüz albüm yok.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.albums.map(album => (
            <div key={album.id} className="aspect-square rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', transition: 'all 0.3s' }}
              onClick={() => setOpenAlbum(album.id)}>
              {album.photos?.[0] ? (
                <img src={album.photos[0]} className="w-full h-full object-cover" alt={album.name} />
              ) : (
                <span style={{ fontSize: 36, color: 'var(--text-muted)' }}>{album.emoji || '📁'}</span>
              )}
              <div className="absolute bottom-0 left-0 right-0 pt-6 pb-1.5 px-1.5 text-center"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                <span className="text-[10px] font-bold text-white truncate block">{escapeHtml(album.name)}</span>
              </div>
              {album.photos?.length ? (
                <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>{album.photos.length}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Album Detail Modal */}
      {activeAlbum && (
        <div className="modal-overlay" onClick={() => setOpenAlbum(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-extrabold">📷 {escapeHtml(activeAlbum.name)}</h3>
              <button className="btn-gradient btn-sm" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', fontSize: 11 }}
                onClick={() => handlePhotoUpload(activeAlbum.id)}>📷 Fotoğraf Ekle</button>
            </div>
            {!activeAlbum.photos?.length ? (
              <div className="empty-state">
                <Images size={32} className="empty-state-icon" />
                <div>Henüz fotoğraf yok.</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {activeAlbum.photos.map((photo, pidx) => (
                  <div key={pidx} className="aspect-square rounded-lg overflow-hidden relative group">
                    <img src={photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" onClick={() => window.open(photo, '_blank')} />
                    <button className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.7)', fontSize: 10 }}
                      onClick={() => setData(prev => ({
                        ...prev,
                        albums: prev.albums.map(a => a.id === activeAlbum.id ? { ...a, photos: a.photos.filter((_, i) => i !== pidx) } : a),
                      }))}><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-gradient mt-4 w-full justify-center" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => setOpenAlbum(null)}>Kapat</button>
          </div>
        </div>
      )}

      {/* Music */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Music size={16} /></span>Müzik Kuyruğu <span className="count-badge">{data.music.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowMusicAdd(true)}><Plus size={14} /> Şarkı</button>
      </div>
      {data.music.length === 0 ? (
        <div className="empty-state">
          <Music size={48} className="empty-state-icon" />
          <div>Kuyruk boş.</div>
          <div className="empty-state-hint">Şarkı ekleyerek ortak çalma listesi oluşturun.</div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '8px 16px' }}>
          {data.music.map((song, idx) => (
            <div key={song.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="w-6 text-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{idx + 1}</span>
              <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{escapeHtml(song.title)} <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{escapeHtml(song.artist)}</span></span>
              <button className="p-1" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => addNotification(`🎵 "${song.title}" kuyruğa eklendi.`)}><Plus size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Games */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Gamepad2 size={16} /></span>Oyun Gecesi <span className="count-badge">{data.games.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowGameAdd(true)}><Plus size={14} /> Turnuva</button>
      </div>
      {data.games.length === 0 ? (
        <div className="empty-state">
          <Gamepad2 size={48} className="empty-state-icon" />
          <div>Turnuva yok.</div>
          <div className="empty-state-hint">Oyun gecesi için turnuva oluşturun!</div>
        </div>
      ) : (
        data.games.map(game => (
          <div key={game.id} className="glass-card">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-bold">{escapeHtml(game.icon || '🎮')} {escapeHtml(game.name)}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{game.players} kişi · {escapeHtml(game.status)}</div>
                {game.location && <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>📍 {escapeHtml(game.location)}</div>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.2)', whiteSpace: 'nowrap' }}>
                {escapeHtml(game.status)}
              </span>
            </div>
          </div>
        ))
      )}

      {/* MODALLAR */}
      {showFeedAdd && (
        <div className="modal-overlay" onClick={() => setShowFeedAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Gönderi</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>YAZAR</label>
            <input className="glass-input mb-3" placeholder={currentUser?.displayName || 'Ahmet'} value={feedForm.author} onChange={e => setFeedForm({ ...feedForm, author: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>İÇERİK</label>
            <textarea className="glass-input mb-4" rows={3} placeholder="Maça gidiyorum, kim var?" value={feedForm.text} onChange={e => setFeedForm({ ...feedForm, text: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowFeedAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addFeed}>Paylaş</button>
            </div>
          </div>
        </div>
      )}

      {showMusicAdd && (
        <div className="modal-overlay" onClick={() => setShowMusicAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Şarkı Ekle</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ŞARKI</label>
            <input className="glass-input mb-3" placeholder="Blinding Lights" value={musicForm.title} onChange={e => setMusicForm({ ...musicForm, title: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SANATÇI</label>
            <input className="glass-input mb-4" placeholder="The Weeknd" value={musicForm.artist} onChange={e => setMusicForm({ ...musicForm, artist: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowMusicAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addMusic}>Ekle</button>
            </div>
          </div>
        </div>
      )}

      {showGameAdd && (
        <div className="modal-overlay" onClick={() => setShowGameAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Turnuva</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" placeholder="FIFA 24 Turnuvası" value={gameForm.name} onChange={e => setGameForm({ ...gameForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>OYUNCU SAYISI</label>
            <input className="glass-input mb-3" type="number" placeholder="4" value={gameForm.players} onChange={e => setGameForm({ ...gameForm, players: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>KONUM</label>
            <input className="glass-input mb-4" placeholder="Nerede?" value={gameForm.location} onChange={e => setGameForm({ ...gameForm, location: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowGameAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addGame}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {showAlbumAdd && (
        <div className="modal-overlay" onClick={() => setShowAlbumAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Albüm</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" placeholder="Kamp 2024" value={albumForm.name} onChange={e => setAlbumForm({ ...albumForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>EMOJI</label>
            <input className="glass-input mb-4" placeholder="🏕️" maxLength={2} value={albumForm.emoji} onChange={e => setAlbumForm({ ...albumForm, emoji: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowAlbumAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addAlbum}>Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
