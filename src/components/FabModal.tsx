import { useApp } from '@/context/AppContext';
import { X, Swords, Flame, Coins, Compass } from 'lucide-react';

export default function FabModal({ onClose }: { onClose: () => void }) {
  const { setActiveTab, addNotification } = useApp();

  const actions = [
    { icon: Swords, label: 'Maç Ayarla', color: 'var(--green)', action: () => { setActiveTab('arena'); addNotification('⚡ Arena sekmesine yönlendirildiniz.'); onClose(); } },
    { icon: Flame, label: 'Mangal Başlat', color: 'var(--accent)', action: () => { setActiveTab('atolye'); addNotification('🔥 Atölye sekmesine yönlendirildiniz.'); onClose(); } },
    { icon: Coins, label: 'Borç Gör', color: 'var(--gold)', action: () => { setActiveTab('kasa'); addNotification('💰 Kasa sekmesine yönlendirildiniz.'); onClose(); } },
    { icon: Compass, label: 'Nereye Gitsek?', color: 'var(--blue)', action: () => { setActiveTab('kesfet'); addNotification('🧭 Keşfet sekmesine yönlendirildiniz.'); onClose(); } },
  ];

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-end', padding: 0 }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'linear-gradient(180deg, #111827, #0b0f1a)',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        padding: '20px 24px 32px',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 10, margin: '0 auto 18px' }} />
        <div className="text-center font-extrabold text-lg mb-4 tracking-tight">⚡ Hızlı İşlemler</div>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button key={i} onClick={a.action} className="p-4 rounded-xl text-center transition-all hover:-translate-y-1"
                style={{ background: 'linear-gradient(145deg, var(--bg-card), rgba(255,255,255,0.02))', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <Icon size={28} style={{ color: a.color, margin: '0 auto 6px', display: 'block' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{a.label}</span>
              </button>
            );
          })}
        </div>
        <button className="btn-gradient mt-4 w-full justify-center" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          onClick={onClose}><X size={14} /> Kapat</button>
      </div>
    </div>
  );
}
