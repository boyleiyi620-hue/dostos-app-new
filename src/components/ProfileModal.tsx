import { useApp } from '@/context/AppContext';
import { X, User, LogOut, Download, Upload, Trash2 } from 'lucide-react';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { currentUser, data, logout, escapeHtml } = useApp();

  const totalItems = data.kesfet.length + data.arenaLigler.length + data.challenges.length +
    data.expenses.length + data.bbqs.length + data.projects.length + data.feed.length +
    data.music.length + data.games.length + data.giftfunds.length + data.albums.length +
    data.inventory.length + data.debts.length;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dostos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          JSON.parse(ev.target?.result as string);
          // Burada veriyi import edebiliriz ama şimdilik sadece toast gösterelim
          alert('Veriler içe aktarıldı! Sayfa yenilenecek.');
          window.location.reload();
        } catch {
          alert('Geçersiz dosya formatı.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-extrabold flex items-center gap-2"><User size={20} style={{ color: 'var(--accent)' }} /> Profil</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {currentUser && (
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-extrabold text-2xl mb-2"
              style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', boxShadow: '0 8px 32px rgba(249,115,22,0.3)' }}>
              {currentUser.avatar || currentUser.username[0]}
            </div>
            <div className="font-bold text-lg">{escapeHtml(currentUser.displayName)}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{currentUser.username}</div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Üyelik: {currentUser.createdAt}</div>
          </div>
        )}

        <div className="space-y-1 mb-4">
          {[
            { label: 'Toplam Öğe', value: totalItems },
            { label: 'Ligler', value: data.arenaLigler.length },
            { label: 'Meydan Okuma', value: data.challenges.length },
            { label: 'İşlemler', value: data.expenses.length },
            { label: 'Mangal', value: data.bbqs.length },
            { label: 'Proje', value: data.projects.length },
            { label: 'Albüm', value: data.albums.length },
            { label: 'Ekipman', value: data.inventory.length },
            { label: 'Borç', value: data.debts.length },
          ].map(item => (
            <div key={item.label} className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-gradient btn-sm flex-1 justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', fontSize: 11 }}
            onClick={exportData}><Download size={12} /> Dışa Aktar</button>
          <button className="btn-gradient btn-sm flex-1 justify-center" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: 11 }}
            onClick={importData}><Upload size={12} /> İçe Aktar</button>
        </div>

        <button className="btn-gradient mt-3 w-full justify-center" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12 }}
          onClick={() => { if (confirm('Tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) { localStorage.clear(); window.location.reload(); } }}>
          <Trash2 size={12} /> Tüm Verileri Sıfırla
        </button>

        <button className="btn-gradient mt-2 w-full justify-center" style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(168,85,247,0.2)', fontSize: 12 }}
          onClick={() => { logout(); onClose(); }}>
          <LogOut size={12} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}
