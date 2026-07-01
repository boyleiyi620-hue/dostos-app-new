import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Wrench, CheckSquare, Check, Plus } from 'lucide-react';

export default function TabWorkshop() {
  const { data, setData, addNotification, escapeHtml } = useApp();
  const [showBbqAdd, setShowBbqAdd] = useState(false);
  const [showProjectAdd, setShowProjectAdd] = useState(false);
  const [showInvAdd, setShowInvAdd] = useState(false);
  const [bbqForm, setBbqForm] = useState({ name: 'Pazar Mangalı', meat: 'Biftek', items: 'Et, ekmek, salata', status: 'Planlandı' });
  const [projForm, setProjForm] = useState({ name: '', icon: '📋', status: 'Devam' });
  const [invForm, setInvForm] = useState({ name: '', emoji: '🔧', owner: 'Grup', status: 'Müsait' });
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  const addBBQ = () => {
    if (!bbqForm.name.trim()) return;
    const newBbq = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      ...bbqForm,
      location: 'Park',
      participants: [],
    };
    setData(prev => ({ ...prev, bbqs: [...prev.bbqs, newBbq] }));
    addNotification(`🔥 "${bbqForm.name}" mangalı planlandı.`);
    setShowBbqAdd(false);
  };

  const addProject = () => {
    if (!projForm.name.trim()) return;
    const newProj = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...projForm, tasks: [] };
    setData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
    addNotification(`📋 "${projForm.name}" projesi oluşturuldu.`);
    setProjForm({ name: '', icon: '📋', status: 'Devam' });
    setShowProjectAdd(false);
  };

  const addInventory = () => {
    if (!invForm.name.trim()) return;
    const newInv = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...invForm };
    setData(prev => ({ ...prev, inventory: [...prev.inventory, newInv] }));
    addNotification(`🔧 "${invForm.name}" ekipmanı eklendi.`);
    setInvForm({ name: '', emoji: '🔧', owner: 'Grup', status: 'Müsait' });
    setShowInvAdd(false);
  };

  const toggleTask = (projId: string, taskIdx: number) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projId ? { ...p, tasks: p.tasks.map((t, i) => i === taskIdx ? { ...t, done: !t.done } : t) } : p
      ),
    }));
  };

  const addTask = (projId: string) => {
    const text = taskInputs[projId];
    if (!text?.trim()) return;
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projId ? { ...p, tasks: [...p.tasks, { text, done: false }] } : p
      ),
    }));
    setTaskInputs(prev => ({ ...prev, [projId]: '' }));
  };

  return (
    <div>
      {/* BBQ */}
      <div className="section-title">
        <h3><span className="icon-box" style={{ fontSize: 16 }}>🔥</span>Mangal Şefi <span className="count-badge">{data.bbqs.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowBbqAdd(true)}><Plus size={14} /> Ekle</button>
      </div>
      {data.bbqs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: 48 }}>🔥</div>
          <div>Mangal etkinliği yok.</div>
          <div className="empty-state-hint">Hemen bir mangal partisi planlayın!</div>
        </div>
      ) : (
        data.bbqs.map(bbq => (
          <div key={bbq.id} className="glass-card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">🔥 {escapeHtml(bbq.name)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid rgba(251,191,36,0.2)' }}>{escapeHtml(bbq.status)}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs mt-2 py-2 px-3 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span>🍖 {escapeHtml(bbq.meat)}</span>
              <span>📋 {escapeHtml(bbq.items)}</span>
            </div>
          </div>
        ))
      )}

      {/* Projects */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><CheckSquare size={16} /></span>Proje Panosu <span className="count-badge">{data.projects.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowProjectAdd(true)}><Plus size={14} /> Proje</button>
      </div>
      {data.projects.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} className="empty-state-icon" />
          <div>Proje yok.</div>
          <div className="empty-state-hint">Birlikte yapacağınız projeleri yönetin.</div>
        </div>
      ) : (
        data.projects.map(proj => {
          const total = proj.tasks.length;
          const done = proj.tasks.filter(t => t.done).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={proj.id} className="glass-card">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">{escapeHtml(proj.icon || '📋')} {escapeHtml(proj.name)}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.2)' }}>{escapeHtml(proj.status)} ({pct}%)</span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, var(--accent), var(--gold))', transition: 'width 0.6s' }} />
              </div>
              {proj.tasks.map((task, ti) => (
                <div key={ti} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => toggleTask(proj.id, ti)}
                    style={{ width: 22, height: 22, borderRadius: '50%', border: task.done ? 'none' : '2px solid var(--border)', background: task.done ? 'var(--green)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 10 }}
                  >{task.done && <Check size={10} />}</button>
                  <span className={`text-sm flex-1 ${task.done ? 'line-through' : ''}`} style={{ color: task.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{escapeHtml(task.text)}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input className="glass-input flex-1 text-sm" placeholder="Yeni görev..." value={taskInputs[proj.id] || ''} onChange={e => setTaskInputs(prev => ({ ...prev, [proj.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTask(proj.id)} />
                <button className="btn-gradient btn-sm" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                  onClick={() => addTask(proj.id)}><Plus size={14} /></button>
              </div>
            </div>
          );
        })
      )}

      {/* Inventory */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Wrench size={16} /></span>Ekipman & Malzeme <span className="count-badge">{data.inventory.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowInvAdd(true)}><Plus size={14} /> Ekle</button>
      </div>
      {data.inventory.length === 0 ? (
        <div className="empty-state">
          <Wrench size={48} className="empty-state-icon" />
          <div>Henüz ekipman yok.</div>
          <div className="empty-state-hint">Ortak malzemeleri, ekipmanları takip edin.</div>
        </div>
      ) : (
        data.inventory.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center" style={{
              width: 38, height: 38, borderRadius: 12,
              background: item.status === 'Müsait' ? 'var(--green-dim)' : item.status === 'Kullanımda' ? 'var(--blue-dim)' : 'var(--red-dim)',
              color: item.status === 'Müsait' ? 'var(--green)' : item.status === 'Kullanımda' ? 'var(--blue)' : 'var(--red)',
              fontSize: 14
            }}>{item.status === 'Müsait' ? '✓' : item.status === 'Kullanımda' ? '👤' : '!'}</div>
            <div className="flex-1">
              <div className="text-xs font-bold">{escapeHtml(item.emoji || '🔧')} {escapeHtml(item.name)}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sahibi: {escapeHtml(item.owner)}</div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: 0.3,
              background: item.status === 'Müsait' ? 'var(--green-dim)' : item.status === 'Kullanımda' ? 'var(--blue-dim)' : 'var(--red-dim)',
              color: item.status === 'Müsait' ? 'var(--green)' : item.status === 'Kullanımda' ? 'var(--blue)' : 'var(--red)',
              border: `1px solid ${item.status === 'Müsait' ? 'rgba(34,197,94,0.2)' : item.status === 'Kullanımda' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>{escapeHtml(item.status)}</span>
          </div>
        ))
      )}

      {/* MODALLAR */}
      {showBbqAdd && (
        <div className="modal-overlay" onClick={() => setShowBbqAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4">🔥 Mangal Etkinliği</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" value={bbqForm.name} onChange={e => setBbqForm({ ...bbqForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ET TÜRÜ</label>
            <select className="glass-input mb-3" value={bbqForm.meat} onChange={e => setBbqForm({ ...bbqForm, meat: e.target.value })}>
              <option>Biftek</option><option>Köfte</option><option>Tavuk</option><option>Karışık</option>
            </select>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>GETİRİLECEKLER</label>
            <input className="glass-input mb-4" value={bbqForm.items} onChange={e => setBbqForm({ ...bbqForm, items: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowBbqAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addBBQ}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {showProjectAdd && (
        <div className="modal-overlay" onClick={() => setShowProjectAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Proje</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>PROJE ADI</label>
            <input className="glass-input mb-3" placeholder="Ev Boyama" value={projForm.name} onChange={e => setProjForm({ ...projForm, name: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowProjectAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addProject}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {showInvAdd && (
        <div className="modal-overlay" onClick={() => setShowInvAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Ekipman</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" placeholder="Kamp Ocağı" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>EMOJI</label>
            <input className="glass-input mb-3" placeholder="🔧" maxLength={2} value={invForm.emoji} onChange={e => setInvForm({ ...invForm, emoji: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SAHİBİ</label>
            <input className="glass-input mb-3" placeholder="Grup" value={invForm.owner} onChange={e => setInvForm({ ...invForm, owner: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowInvAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addInventory}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
