import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Wrench, CheckSquare, Check, Plus, Trash2, Edit2 } from 'lucide-react';

export default function TabWorkshop() {
  const { data, setData, addNotification, escapeHtml } = useApp();
  const [showBbqAdd, setShowBbqAdd] = useState(false);
  const [showProjectAdd, setShowProjectAdd] = useState(false);
  const [showInvAdd, setShowInvAdd] = useState(false);
  const [bbqForm, setBbqForm] = useState({ name: '', meat: 'Biftek', items: '', status: 'Planlandı' });
  const [projForm, setProjForm] = useState({ name: '', icon: '📋', status: 'Devam' });
  const [invForm, setInvForm] = useState({ name: '', emoji: '🔧', owner: 'Grup', status: 'Müsait' });
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const addBBQ = () => {
    if (!bbqForm.name.trim()) return;
    if (editingId) {
      setData(prev => ({
        ...prev,
        bbqs: prev.bbqs.map(b => b.id === editingId ? { ...b, ...bbqForm } : b)
      }));
      addNotification('🔥 Mangal güncellendi.');
      setEditingId(null);
    } else {
      const newBbq = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        ...bbqForm,
        location: 'Park',
        participants: [],
      };
      setData(prev => ({ ...prev, bbqs: [...prev.bbqs, newBbq] }));
      addNotification(`🔥 "${bbqForm.name}" mangalı planlandı.`);
    }
    setBbqForm({ name: '', meat: 'Biftek', items: '', status: 'Planlandı' });
    setShowBbqAdd(false);
  };

  const deleteBBQ = (id: string) => {
    if (confirm('Bu mangalı silmek istediğinize emin misiniz?')) {
      setData(prev => ({ ...prev, bbqs: prev.bbqs.filter(b => b.id !== id) }));
      addNotification('🗑️ Mangal silindi.');
    }
  };

  const addProject = () => {
    if (!projForm.name.trim()) return;
    if (editingId) {
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === editingId ? { ...p, ...projForm } : p)
      }));
      addNotification('📋 Proje güncellendi.');
      setEditingId(null);
    } else {
      const newProj = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...projForm, tasks: [] };
      setData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
      addNotification(`📋 "${projForm.name}" projesi oluşturuldu.`);
    }
    setProjForm({ name: '', icon: '📋', status: 'Devam' });
    setShowProjectAdd(false);
  };

  const deleteProject = (id: string) => {
    if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
      setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
      addNotification('🗑️ Proje silindi.');
    }
  };

  const addInventory = () => {
    if (!invForm.name.trim()) return;
    if (editingId) {
      setData(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.id === editingId ? { ...i, ...invForm } : i)
      }));
      addNotification('🔧 Ekipman güncellendi.');
      setEditingId(null);
    } else {
      const newInv = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...invForm };
      setData(prev => ({ ...prev, inventory: [...prev.inventory, newInv] }));
      addNotification(`🔧 "${invForm.name}" ekipmanı eklendi.`);
    }
    setInvForm({ name: '', emoji: '🔧', owner: 'Grup', status: 'Müsait' });
    setShowInvAdd(false);
  };

  const deleteInventory = (id: string) => {
    if (confirm('Bu ekipmanı silmek istediğinize emin misiniz?')) {
      setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
      addNotification('🗑️ Ekipman silindi.');
    }
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
    <div className="tab-content animate-in">
      <div className="section-header">
        <h2><span className="icon-box"><Wrench size={16} /></span>Atölye</h2>
        <div className="flex gap-2">
          <button className="btn-gradient btn-sm" onClick={() => { setEditingId(null); setBbqForm({ name: '', meat: 'Biftek', items: '', status: 'Planlandı' }); setShowBbqAdd(true); }}>🔥 Mangal</button>
          <button className="btn-gradient btn-sm" onClick={() => { setEditingId(null); setProjForm({ name: '', icon: '📋', status: 'Devam' }); setShowProjectAdd(true); }}>📋 Proje</button>
          <button className="btn-gradient btn-sm" onClick={() => { setEditingId(null); setInvForm({ name: '', emoji: '🔧', owner: 'Grup', status: 'Müsait' }); setShowInvAdd(true); }}>🔧 Ekipman</button>
        </div>
      </div>

      {/* MANGAL LİSTESİ */}
      <div className="section-title">🔥 Aktif Mangallar</div>
      {data.bbqs.length === 0 ? (
        <div className="empty-state">Henüz mangal planı yok.</div>
      ) : (
        data.bbqs.map(bbq => (
          <div key={bbq.id} className="glass-card mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-sm">{escapeHtml(bbq.name)}</h4>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>🍖 {escapeHtml(bbq.meat)} • 📍 {escapeHtml(bbq.location)}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn-icon" onClick={() => { setEditingId(bbq.id); setBbqForm({ name: bbq.name, meat: bbq.meat, items: bbq.items || '', status: bbq.status || 'Planlandı' }); setShowBbqAdd(true); }}><Edit2 size={12} /></button>
                <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteBBQ(bbq.id)}><Trash2 size={12} /></button>
              </div>
            </div>
            {bbq.items && <div className="text-xs p-2 rounded bg-black/20 border border-white/5 mb-2">📝 {escapeHtml(bbq.items)}</div>}
          </div>
        ))
      )}

      {/* PROJE LİSTESİ */}
      <div className="section-title">📋 Projeler</div>
      {data.projects.length === 0 ? (
        <div className="empty-state">Henüz proje yok.</div>
      ) : (
        data.projects.map(proj => (
          <div key={proj.id} className="glass-card mb-3">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{escapeHtml(proj.icon)}</span>
                <h4 className="font-bold text-sm">{escapeHtml(proj.name)}</h4>
              </div>
              <div className="flex gap-1">
                <button className="btn-icon" onClick={() => { setEditingId(proj.id); setProjForm({ name: proj.name, icon: proj.icon, status: proj.status }); setShowProjectAdd(true); }}><Edit2 size={12} /></button>
                <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteProject(proj.id)}><Trash2 size={12} /></button>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {proj.tasks.map((task, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded bg-white/5 cursor-pointer" onClick={() => toggleTask(proj.id, idx)}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${task.done ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>
                    {task.done && <Check size={10} color="white" />}
                  </div>
                  <span style={{ textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.5 : 1 }}>{escapeHtml(task.text)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="glass-input text-xs" placeholder="Görev ekle..." value={taskInputs[proj.id] || ''} onChange={e => setTaskInputs(prev => ({ ...prev, [proj.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addTask(proj.id)} />
              <button className="btn-gradient p-2" onClick={() => addTask(proj.id)}><Plus size={14} /></button>
            </div>
          </div>
        ))
      )}

      {/* ENVANTER LİSTESİ */}
      <div className="section-title">🔧 Ekipman & Envanter</div>
      {data.inventory.length === 0 ? (
        <div className="empty-state">Henüz ekipman yok.</div>
      ) : (
        data.inventory.map(item => (
          <div key={item.id} className="glass-card flex items-center justify-between mb-2 p-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">{escapeHtml(item.emoji)}</span>
              <div>
                <div className="font-bold text-sm">{escapeHtml(item.name)}</div>
                <div className="text-xs opacity-60">Sahibi: {escapeHtml(item.owner)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                backgroundColor: item.status === 'Müsait' ? 'var(--green-dim)' : item.status === 'Kullanımda' ? 'var(--blue-dim)' : 'var(--red-dim)',
                color: item.status === 'Müsait' ? 'var(--green)' : item.status === 'Kullanımda' ? 'var(--blue)' : 'var(--red)',
                border: `1px solid ${item.status === 'Müsait' ? 'rgba(34,197,94,0.2)' : item.status === 'Kullanımda' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>{escapeHtml(item.status)}</span>
              <div className="flex gap-1">
                <button className="btn-icon" onClick={() => { setEditingId(item.id); setInvForm({ name: item.name, emoji: item.emoji, owner: item.owner, status: item.status }); setShowInvAdd(true); }}><Edit2 size={12} /></button>
                <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteInventory(item.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* MODALLAR */}
      {showBbqAdd && (
        <div className="modal-overlay" onClick={() => setShowBbqAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4">🔥 {editingId ? 'Mangalı Düzenle' : 'Mangal Etkinliği'}</h3>
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
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addBBQ}>{editingId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}
      {showProjectAdd && (
        <div className="modal-overlay" onClick={() => setShowProjectAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> {editingId ? 'Projeyi Düzenle' : 'Yeni Proje'}</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>PROJE ADI</label>
            <input className="glass-input mb-3" placeholder="Ev Boyama" value={projForm.name} onChange={e => setProjForm({ ...projForm, name: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowProjectAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addProject}>{editingId ? 'Güncelle' : 'Oluştur'}</button>
            </div>
          </div>
        </div>
      )}
      {showInvAdd && (
        <div className="modal-overlay" onClick={() => setShowInvAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> {editingId ? 'Ekipmanı Düzenle' : 'Ekipman'}</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" placeholder="Kamp Ocağı" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>EMOJI</label>
            <input className="glass-input mb-3" placeholder="🔧" maxLength={2} value={invForm.emoji} onChange={e => setInvForm({ ...invForm, emoji: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SAHİBİ</label>
            <input className="glass-input mb-3" placeholder="Grup" value={invForm.owner} onChange={e => setInvForm({ ...invForm, owner: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>DURUM</label>
            <select className="glass-input mb-3" value={invForm.status} onChange={e => setInvForm({ ...invForm, status: e.target.value })}>
              <option>Müsait</option><option>Kullanımda</option><option>Kayıp/Bozuk</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowInvAdd(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }} onClick={addInventory}>{editingId ? 'Güncelle' : 'Ekle'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
