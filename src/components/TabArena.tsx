import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Trophy, Zap, Plus, Users, Swords } from 'lucide-react';

export default function TabArena() {
  const { data, setData, addNotification, escapeHtml } = useApp();
  const [showLigAdd, setShowLigAdd] = useState(false);
  const [showChallengeAdd, setShowChallengeAdd] = useState(false);
  const [showLeaderboardAdd, setShowLeaderboardAdd] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState<string | null>(null);
  const [showStandingsModal, setShowStandingsModal] = useState<string | null>(null);
  const [showTeamAddInline, setShowTeamAddInline] = useState<string | null>(null);
  const [ligForm, setLigForm] = useState({ name: '', detail: '', icon: '⚽', status: 'Aktif' });
  const [chForm, setChForm] = useState({ title: '', desc: '', target: '', status: 'Aktif' });
  const [lbForm, setLbForm] = useState({ name: '', score: '', avatar: '' });
  const [newTeamName, setNewTeamName] = useState('');

  const addLig = () => {
    if (!ligForm.name.trim()) return;
    const newLig = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: ligForm.name,
      detail: ligForm.detail,
      icon: ligForm.icon || '⚽',
      status: ligForm.status,
      participants: [],
      matches: [],
      standings: [],
    };
    setData(prev => ({ ...prev, arenaLigler: [...prev.arenaLigler, newLig] }));
    addNotification(`🏆 "${ligForm.name}" ligi oluşturuldu.`);
    setLigForm({ name: '', detail: '', icon: '⚽', status: 'Aktif' });
    setShowLigAdd(false);
  };

  const addChallenge = () => {
    if (!chForm.title.trim()) return;
    const newCh = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: chForm.title,
      desc: chForm.desc,
      target: chForm.target,
      status: chForm.status,
      progress: 'Başlamadı',
      participants: [],
    };
    setData(prev => ({ ...prev, challenges: [...prev.challenges, newCh] }));
    addNotification(`⚡ "${chForm.title}" meydan okuması oluşturuldu.`);
    setChForm({ title: '', desc: '', target: '', status: 'Aktif' });
    setShowChallengeAdd(false);
  };

  const addLeaderboard = () => {
    if (!lbForm.name.trim() || !lbForm.score) return;
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: lbForm.name,
      score: Number(lbForm.score),
      avatar: lbForm.avatar || lbForm.name[0],
    };
    setData(prev => ({ ...prev, leaderboard: [...prev.leaderboard, entry] }));
    addNotification(`👤 "${lbForm.name}" lider tablosuna eklendi.`);
    setLbForm({ name: '', score: '', avatar: '' });
    setShowLeaderboardAdd(false);
  };

  const addTeamToLig = (ligId: string) => {
    if (!newTeamName.trim()) return;
    setData(prev => ({
      ...prev,
      arenaLigler: prev.arenaLigler.map(l =>
        l.id === ligId
          ? { ...l, standings: [...l.standings, { team: newTeamName, o: 0, g: 0, b: 0, m: 0, p: 0 }] }
          : l
      ),
    }));
    addNotification(`📊 "${newTeamName}" takımı eklendi.`);
    setNewTeamName('');
    setShowTeamAddInline(null);
  };

  const addMatch = (ligId: string) => {
    const lig = data.arenaLigler.find(l => l.id === ligId);
    if (!lig) return;
    const home = (document.getElementById('m_home') as HTMLSelectElement)?.value;
    const away = (document.getElementById('m_away') as HTMLSelectElement)?.value;
    const homeScore = Number((document.getElementById('m_homeScore') as HTMLInputElement)?.value) || 0;
    const awayScore = Number((document.getElementById('m_awayScore') as HTMLInputElement)?.value) || 0;
    const date = (document.getElementById('m_date') as HTMLInputElement)?.value || new Date().toLocaleDateString('tr-TR');
    if (!home || !away || home === away) {
      addNotification('Geçerli takımlar seçin.', 'fa-exclamation-circle');
      return;
    }
    const newMatch = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), home, away, homeScore, awayScore, date };
    setData(prev => ({
      ...prev,
      arenaLigler: prev.arenaLigler.map(l =>
        l.id === ligId ? { ...l, matches: [...(l.matches || []), newMatch] } : l
      ),
    }));
    addNotification(`⚽ ${home} ${homeScore} - ${awayScore} ${away}`);
    setShowMatchModal(null);
  };

  const sortedLeaderboard = [...data.leaderboard].sort((a, b) => b.score - a.score);
  const top3 = sortedLeaderboard.slice(0, 3);
  const rest = sortedLeaderboard.slice(3);

  return (
    <div>
      {/* LIGLER */}
      <div className="section-title">
        <h3><span className="icon-box"><Trophy size={16} /></span>Liglerim <span className="count-badge">{data.arenaLigler.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowLigAdd(true)}><Plus size={14} /> Ekle</button>
      </div>

      {data.arenaLigler.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} className="empty-state-icon" />
          <div>Lig yok.</div>
          <div className="empty-state-hint">Hemen bir lig oluşturun ve turnuvaya başlayın!</div>
        </div>
      ) : (
        data.arenaLigler.map(lig => (
          <div key={lig.id} className="glass-card" style={{ borderLeft: '3px solid var(--gold)' }}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{escapeHtml(lig.icon || '⚽')} {escapeHtml(lig.name)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.2)' }}>
                {escapeHtml(lig.status || 'Aktif')}
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{escapeHtml(lig.detail || '')}</div>

            {/* Mini Puan Durumu */}
            {lig.standings && lig.standings.length > 0 && (
              <table className="w-full text-xs mt-2" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th className="text-left py-1">Takım</th><th className="py-1">O</th><th className="py-1">G</th><th className="py-1">B</th><th className="py-1">M</th><th className="py-1">P</th>
                  </tr>
                </thead>
                <tbody>
                  {lig.standings.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <td className="text-left py-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{escapeHtml(s.team)}</td>
                      <td className="py-1 text-center">{s.o || 0}</td>
                      <td className="py-1 text-center">{s.g || 0}</td>
                      <td className="py-1 text-center">{s.b || 0}</td>
                      <td className="py-1 text-center">{s.m || 0}</td>
                      <td className="py-1 text-center font-extrabold" style={{ color: 'var(--accent)' }}>{s.p || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* HIZLI TAKIM EKLE */}
            {showTeamAddInline === lig.id ? (
              <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                <input className="glass-input flex-1 text-sm" placeholder="Takım adı..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} autoFocus />
                <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), #16a34a)', color: '#fff' }}
                  onClick={() => addTeamToLig(lig.id)}>Ekle</button>
                <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => { setShowTeamAddInline(null); setNewTeamName(''); }}>İptal</button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3" onClick={e => e.stopPropagation()}>
                <button className="btn-gradient btn-sm" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', fontSize: 11 }}
                  onClick={() => setShowMatchModal(lig.id)}>⚽ Maç Ekle</button>
                <button className="btn-gradient btn-sm" style={{ background: 'linear-gradient(135deg, var(--blue), #2563eb)', color: '#fff', fontSize: 11 }}
                  onClick={() => setShowTeamAddInline(lig.id)}><Plus size={12} /> Takım Ekle</button>
                <button className="btn-gradient btn-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 11 }}
                  onClick={() => setShowStandingsModal(lig.id)}>📊 Puan Durumu</button>
              </div>
            )}
          </div>
        ))
      )}

      {/* CHALLENGES */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Zap size={16} /></span>Meydan Okumalar <span className="count-badge">{data.challenges.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowChallengeAdd(true)}><Plus size={14} /> Ekle</button>
      </div>

      {data.challenges.length === 0 ? (
        <div className="empty-state">
          <Zap size={48} className="empty-state-icon" />
          <div>Meydan okuma yok.</div>
          <div className="empty-state-hint">Arkadaşlarına meydan oku, rekabet başlasın!</div>
        </div>
      ) : (
        data.challenges.map(ch => (
          <div key={ch.id} className="glass-card">
            <div className="flex items-center gap-3">
              <div className="card-icon" style={{ color: 'var(--green)', background: 'var(--green-dim)', borderColor: 'rgba(34,197,94,0.2)' }}>
                <Swords size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{escapeHtml(ch.title)}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{escapeHtml(ch.desc || '')}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: ch.status === 'Aktif' ? 'var(--green-dim)' : 'var(--gold-dim)', color: ch.status === 'Aktif' ? 'var(--green)' : 'var(--gold)', border: `1px solid ${ch.status === 'Aktif' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)'}`, whiteSpace: 'nowrap' }}>
                {escapeHtml(ch.status || 'Aktif')}
              </span>
            </div>
          </div>
        ))
      )}

      {/* LEADERBOARD */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Users size={16} /></span>Lider Panosu <span className="count-badge">{data.leaderboard.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowLeaderboardAdd(true)}><Plus size={14} /> Oyuncu</button>
      </div>

      {data.leaderboard.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-state-icon" />
          <div>Lider tablosu boş.</div>
          <div className="empty-state-hint">Oyuncu ekleyerek rekabeti başlatın!</div>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 py-5 mb-4">
              {top3.length >= 2 && (
                <div className="flex flex-col items-center gap-2">
                  <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: '3px solid #cbd5e1', background: 'rgba(203,213,225,0.1)', color: '#cbd5e1' }}>
                    {escapeHtml(top3[1].avatar || top3[1].name[0])}
                  </div>
                  <span className="text-xs font-bold text-center max-w-[80px] truncate">{escapeHtml(top3[1].name)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{top3[1].score} PP</span>
                  <div style={{ width: 60, height: 60, borderRadius: '8px 8px 4px 4px', background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>2</div>
                </div>
              )}
              <div className="flex flex-col items-center gap-2">
                <div style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, border: '3px solid var(--gold)', background: 'var(--gold-dim)', color: 'var(--gold)', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
                  {escapeHtml(top3[0].avatar || top3[0].name[0])}
                  <span style={{ position: 'absolute', top: -14, fontSize: 16, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🥇</span>
                </div>
                <span className="text-xs font-bold text-center max-w-[80px] truncate">{escapeHtml(top3[0].name)}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{top3[0].score} PP</span>
                <div style={{ width: 60, height: 80, borderRadius: '8px 8px 4px 4px', background: 'linear-gradient(180deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>1</div>
              </div>
              {top3.length >= 3 && (
                <div className="flex flex-col items-center gap-2">
                  <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: '3px solid #fb923c', background: 'rgba(251,146,60,0.1)', color: '#fb923c' }}>
                    {escapeHtml(top3[2].avatar || top3[2].name[0])}
                  </div>
                  <span className="text-xs font-bold text-center max-w-[80px] truncate">{escapeHtml(top3[2].name)}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{top3[2].score} PP</span>
                  <div style={{ width: 60, height: 45, borderRadius: '8px 8px 4px 4px', background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-card))', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>3</div>
                </div>
              )}
            </div>
          )}
          {/* Rest */}
          {rest.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="w-7 text-center font-black text-sm" style={{ color: 'var(--text-muted)' }}>{idx + 4}</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0, color: 'var(--text-primary)', border: '2px solid var(--border)' }}>
                {escapeHtml(p.avatar || p.name[0])}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{escapeHtml(p.name)}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>🏆 {p.score} PP</div>
              </div>
              <span className="font-extrabold text-sm" style={{ color: 'var(--accent)' }}>{p.score}</span>
            </div>
          ))}
        </>
      )}

      {/* ─── MODALLAR ─── */}
      {/* Lig Ekle */}
      {showLigAdd && (
        <div className="modal-overlay" onClick={() => setShowLigAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Lig</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>LİG ADI</label>
            <input className="glass-input mb-3" placeholder="Halı Saha Ligi" value={ligForm.name} onChange={e => setLigForm({ ...ligForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>DETAY</label>
            <input className="glass-input mb-3" placeholder="6 takım, 10 maç" value={ligForm.detail} onChange={e => setLigForm({ ...ligForm, detail: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>İKON</label>
            <input className="glass-input mb-4" placeholder="⚽" value={ligForm.icon} onChange={e => setLigForm({ ...ligForm, icon: e.target.value })} maxLength={2} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowLigAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addLig}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Ekle */}
      {showChallengeAdd && (
        <div className="modal-overlay" onClick={() => setShowChallengeAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Meydan Okuma</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>BAŞLIK</label>
            <input className="glass-input mb-3" placeholder="Ahmet vs Mehmet" value={chForm.title} onChange={e => setChForm({ ...chForm, title: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AÇIKLAMA</label>
            <input className="glass-input mb-3" placeholder="Bu hafta kim daha çok koşar?" value={chForm.desc} onChange={e => setChForm({ ...chForm, desc: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowChallengeAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addChallenge}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Ekle */}
      {showLeaderboardAdd && (
        <div className="modal-overlay" onClick={() => setShowLeaderboardAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Oyuncu</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>İSİM</label>
            <input className="glass-input mb-3" placeholder="Ahmet" value={lbForm.name} onChange={e => setLbForm({ ...lbForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>PUAN</label>
            <input className="glass-input mb-3" type="number" placeholder="2450" value={lbForm.score} onChange={e => setLbForm({ ...lbForm, score: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AVATAR</label>
            <input className="glass-input mb-4" placeholder="A" maxLength={2} value={lbForm.avatar} onChange={e => setLbForm({ ...lbForm, avatar: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowLeaderboardAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addLeaderboard}>Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* Maç Ekle Modal */}
      {showMatchModal && (() => {
        const lig = data.arenaLigler.find(l => l.id === showMatchModal);
        if (!lig) return null;
        const teams = (lig.standings || []).map(s => s.team).filter(Boolean);
        return (
          <div className="modal-overlay" onClick={() => setShowMatchModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold mb-4">⚽ {escapeHtml(lig.name)} - Maç Ekle</h3>
              {teams.length === 0 ? (
                <div className="empty-state">
                  <div>Önce takım eklemelisiniz.</div>
                  <button className="btn-gradient mt-3" style={{ background: 'linear-gradient(135deg, var(--blue), #2563eb)', color: '#fff' }}
                    onClick={() => { setShowMatchModal(null); setShowTeamAddInline(lig.id); }}><Plus size={14} /> Takım Ekle</button>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>EV SAHİBİ</label>
                  <select className="glass-input mb-3" id="m_home">
                    {teams.map(t => <option key={t} value={t}>{escapeHtml(t)}</option>)}
                  </select>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>DEPLASMAN</label>
                  <select className="glass-input mb-3" id="m_away">
                    {teams.map(t => <option key={t} value={t}>{escapeHtml(t)}</option>)}
                  </select>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SKOR (EV)</label>
                  <input className="glass-input mb-3" type="number" id="m_homeScore" defaultValue={0} />
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SKOR (DEP)</label>
                  <input className="glass-input mb-3" type="number" id="m_awayScore" defaultValue={0} />
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>TARİH</label>
                  <input className="glass-input mb-4" type="date" id="m_date" />
                  <div className="flex gap-2 justify-end">
                    <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      onClick={() => setShowMatchModal(null)}>İptal</button>
                    <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--green), #16a34a)', color: '#fff' }}
                      onClick={() => addMatch(showMatchModal)}>Maç Ekle</button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Puan Durumu Modal */}
      {showStandingsModal && (() => {
        const lig = data.arenaLigler.find(l => l.id === showStandingsModal);
        if (!lig) return null;
        return (
          <div className="modal-overlay" onClick={() => setShowStandingsModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold mb-4">📊 {escapeHtml(lig.name)} - Puan Durumu</h3>
              <div className="flex gap-2 mb-4">
                <input className="glass-input flex-1" placeholder="Yeni takım adı" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                  onClick={() => addTeamToLig(lig.id)}><Plus size={14} /> Ekle</button>
              </div>
              {lig.standings?.length ? (
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                      <th className="text-left py-1">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>P</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lig.standings.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <td className="text-left py-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{escapeHtml(s.team)}</td>
                        <td className="py-1 text-center"><input className="glass-input" style={{ width: 40, padding: 4 }} type="number" defaultValue={s.o || 0} /></td>
                        <td className="py-1 text-center"><input className="glass-input" style={{ width: 40, padding: 4 }} type="number" defaultValue={s.g || 0} /></td>
                        <td className="py-1 text-center"><input className="glass-input" style={{ width: 40, padding: 4 }} type="number" defaultValue={s.b || 0} /></td>
                        <td className="py-1 text-center"><input className="glass-input" style={{ width: 40, padding: 4 }} type="number" defaultValue={s.m || 0} /></td>
                        <td className="py-1 text-center font-extrabold" style={{ color: 'var(--accent)' }}><input className="glass-input" style={{ width: 40, padding: 4 }} type="number" defaultValue={s.p || 0} /></td>
                        <td className="py-1 text-center">
                          <button className="btn-gradient btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: 10 }}
                            onClick={() => {
                              setData(prev => ({
                                ...prev,
                                arenaLigler: prev.arenaLigler.map(l =>
                                  l.id === lig.id ? { ...l, standings: l.standings.filter((_, i) => i !== idx) } : l
                                ),
                              }));
                            }}>Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <Users size={32} className="empty-state-icon" style={{ fontSize: 32 }} />
                  <div>Henüz takım yok.</div>
                </div>
              )}
              <button className="btn-gradient mt-4 w-full justify-center" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowStandingsModal(null)}>Kapat</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
