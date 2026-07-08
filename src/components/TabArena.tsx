import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Trophy, Plus, Users, Trash2, Edit2, Calendar } from 'lucide-react';

export default function TabArena() {
  const { data, setData, addNotification, escapeHtml } = useApp();
  const [showLigAdd, setShowLigAdd] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState<string | null>(null);
  const [showStandingsModal, setShowStandingsModal] = useState<string | null>(null);
  const [ligName, setLigName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [editingLigId, setEditingLigId] = useState<string | null>(null);

  const addLig = () => {
    if (!ligName.trim()) return;
    if (editingLigId) {
      setData(prev => ({
        ...prev,
        arenaLigler: prev.arenaLigler.map(l => l.id === editingLigId ? { ...l, name: ligName } : l)
      }));
      addNotification('🏆 Lig güncellendi.');
      setEditingLigId(null);
    } else {
      const newLig = {
        id: Date.now().toString(36),
        name: ligName,
        standings: [],
        matches: [],
      };
      setData(prev => ({ ...prev, arenaLigler: [...prev.arenaLigler, newLig] }));
      addNotification(`🏆 "${ligName}" ligi oluşturuldu.`);
    }
    setLigName('');
    setShowLigAdd(false);
  };

  const deleteLig = (id: string) => {
    if (confirm('Bu ligi silmek istediğinize emin misiniz?')) {
      setData(prev => ({ ...prev, arenaLigler: prev.arenaLigler.filter(l => l.id !== id) }));
      addNotification('🗑️ Lig silindi.');
    }
  };

  const addTeamToLig = (ligId: string) => {
    if (!newTeamName.trim()) return;
    setData(prev => ({
      ...prev,
      arenaLigler: prev.arenaLigler.map(l =>
        l.id === ligId ? { ...l, standings: [...(l.standings || []), { team: newTeamName, o: 0, g: 0, b: 0, m: 0, p: 0 }] } : l
      ),
    }));
    setNewTeamName('');
  };

  const addMatch = (ligId: string) => {
    const home = (document.getElementById('m_home') as HTMLSelectElement).value;
    const away = (document.getElementById('m_away') as HTMLSelectElement).value;
    const hScore = parseInt((document.getElementById('m_homeScore') as HTMLInputElement).value) || 0;
    const aScore = parseInt((document.getElementById('m_awayScore') as HTMLInputElement).value) || 0;
    const date = (document.getElementById('m_date') as HTMLInputElement).value || new Date().toISOString().split('T')[0];

    if (home === away) {
      addNotification('❌ Aynı takımlar maç yapamaz!');
      return;
    }

    const newMatch = { id: Date.now().toString(36), home, away, homeScore: hScore, awayScore: aScore, date };

    setData(prev => ({
      ...prev,
      arenaLigler: prev.arenaLigler.map(l => {
        if (l.id !== ligId) return l;
        const updatedStandings = [...(l.standings || [])].map(s => {
          const up = { ...s };
          if (s.team === home) {
            up.o = (up.o || 0) + 1;
            if (hScore > aScore) up.g = (up.g || 0) + 1;
            else if (hScore === aScore) up.b = (up.b || 0) + 1;
            else up.m = (up.m || 0) + 1;
          }
          if (s.team === away) {
            up.o = (up.o || 0) + 1;
            if (aScore > hScore) up.g = (up.g || 0) + 1;
            else if (aScore === hScore) up.b = (up.b || 0) + 1;
            else up.m = (up.m || 0) + 1;
          }
          up.p = (up.g || 0) * 3 + (up.b || 0) * 1;
          return up;
        });
        return { ...l, matches: [...(l.matches || []), newMatch], standings: updatedStandings };
      }),
    }));

    addNotification('⚽ Maç eklendi ve puanlar güncellendi.');
    setShowMatchModal(null);
  };

  const deleteMatch = (ligId: string, matchId: string) => {
    if (confirm('Bu maçı silmek istediğinize emin misiniz? Puanlar geri alınmayacaktır.')) {
      setData(prev => ({
        ...prev,
        arenaLigler: prev.arenaLigler.map(l =>
          l.id === ligId ? { ...l, matches: l.matches.filter(m => m.id !== matchId) } : l
        ),
      }));
      addNotification('🗑️ Maç silindi.');
    }
  };

  return (
    <div className="tab-content animate-in">
      <div className="section-header">
        <h3><span className="icon-box"><Trophy size={16} /></span>Liglerim <span className="count-badge">{data.arenaLigler.length}</span></h3>
        <button className="btn-gradient btn-sm" onClick={() => { setEditingLigId(null); setLigName(''); setShowLigAdd(true); }}><Plus size={14} /> Yeni Lig</button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {data.arenaLigler.length === 0 ? (
          <div className="empty-state">Henüz bir lig oluşturmadınız.</div>
        ) : (
          data.arenaLigler.map(lig => (
            <div key={lig.id} className="glass-card">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm flex items-center gap-2">🏆 {escapeHtml(lig.name)}</h4>
                <div className="flex gap-1">
                  <button className="btn-icon" onClick={() => { setEditingLigId(lig.id); setLigName(lig.name); setShowLigAdd(true); }}><Edit2 size={12} /></button>
                  <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteLig(lig.id)}><Trash2 size={12} /></button>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <button className="btn-gradient btn-sm flex-1 justify-center" style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
                  onClick={() => setShowStandingsModal(lig.id)}>📊 Puan Durumu</button>
                <button className="btn-gradient btn-sm flex-1 justify-center" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}
                  onClick={() => setShowMatchModal(lig.id)}>⚽ Maç Ekle</button>
              </div>

              {lig.matches?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Son Maçlar</div>
                  {lig.matches.slice(-3).reverse().map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
                      <div className="flex-1 text-right font-semibold">{escapeHtml(m.home)}</div>
                      <div className="px-3 font-extrabold text-accent">{m.homeScore} - {m.awayScore}</div>
                      <div className="flex-1 text-left font-semibold">{escapeHtml(m.away)}</div>
                      <button className="btn-icon ml-2" style={{ color: 'var(--red)', padding: 2 }} onClick={() => deleteMatch(lig.id, m.id)}><Trash2 size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lig Ekle/Düzenle Modal */}
      {showLigAdd && (
        <div className="modal-overlay" onClick={() => setShowLigAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4">{editingLigId ? 'Ligi Düzenle' : '🏆 Yeni Lig'}</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>LİG ADI</label>
            <input className="glass-input mb-4" placeholder="Şampiyonlar Ligi" value={ligName} onChange={e => setLigName(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowLigAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addLig}>{editingLigId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Maç Ekle Modal */}
      {showMatchModal && (() => {
        const lig = data.arenaLigler.find(l => l.id === showMatchModal);
        if (!lig) return null;
        return (
          <div className="modal-overlay" onClick={() => setShowMatchModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold mb-4">⚽ Maç Ekle - {escapeHtml(lig.name)}</h3>
              {(!lig.standings || lig.standings.length < 2) ? (
                <div className="text-center p-4">Maç eklemek için önce en az 2 takım eklemelisiniz.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>EV SAHİBİ</label>
                      <select className="glass-input" id="m_home">
                        {lig.standings.map(s => <option key={s.team} value={s.team}>{escapeHtml(s.team)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>DEPLASMAN</label>
                      <select className="glass-input" id="m_away">
                        {lig.standings.map(s => <option key={s.team} value={s.team}>{escapeHtml(s.team)}</option>)}
                      </select>
                    </div>
                  </div>
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
                        <td className="py-1 text-center">{s.o || 0}</td>
                        <td className="py-1 text-center">{s.g || 0}</td>
                        <td className="py-1 text-center">{s.b || 0}</td>
                        <td className="py-1 text-center">{s.m || 0}</td>
                        <td className="py-1 text-center font-extrabold" style={{ color: 'var(--accent)' }}>{s.p || 0}</td>
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
