import { useApp } from '@/context/AppContext';
import { X, Bell, Trash2 } from 'lucide-react';

export default function NotifModal({ onClose }: { onClose: () => void }) {
  const { data, clearNotifications, escapeHtml } = useApp();
  const notifs = data.notifications.slice().reverse();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold flex items-center gap-2"><Bell size={20} style={{ color: 'var(--accent)' }} /> Bildirimler</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{data.notifications.length} bildirim</span>
          {data.notifications.length > 0 && (
            <button className="btn-gradient btn-sm" style={{ background: 'var(--red-dim)', color: 'var(--red)', fontSize: 10 }}
              onClick={() => { if (confirm('Tüm bildirimleri sil?')) clearNotifications(); }}>
              <Trash2 size={10} /> Tümünü Sil
            </button>
          )}
        </div>

        {!notifs.length ? (
          <div className="empty-state">
            <Bell size={40} className="empty-state-icon" />
            <div>Henüz bildirim yok.</div>
            <div className="empty-state-hint">Etkinliklerden gelen bildirimler burada görünecek.</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {notifs.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
                <span className="text-lg">{n.icon === 'fa-bell' ? '🔔' : n.icon?.startsWith('fa-') ? '⚡' : n.icon || '🔔'}</span>
                <div className="flex-1">
                  <div className="text-sm">{escapeHtml(n.text)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{escapeHtml(n.time)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
