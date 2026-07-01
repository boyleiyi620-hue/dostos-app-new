import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Coins, HandCoins, Repeat, Gift, Plus, Check } from 'lucide-react';

export default function TabWallet() {
  const { data, setData, addNotification, escapeHtml, currentUser, currentGroup } = useApp();
  const [showExpense, setShowExpense] = useState(false);
  const [showDebt, setShowDebt] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', amount: '', type: 'gider' as 'gelir' | 'gider', payer: '', members: '1' });
  const [debtForm, setDebtForm] = useState({ from: '', to: '', amount: '', reason: '', status: 'Bekliyor' });
  const [subForm, setSubForm] = useState({ name: '', amount: '', next: '', status: 'Aktif' });
  const [giftForm, setGiftForm] = useState({ name: '', target: '', current: '' });

  const total = data.expenses.reduce((s, e) => s + (e.type === 'gelir' ? e.amount : -e.amount), 0);
  const income = data.expenses.filter(e => e.type === 'gelir').reduce((s, e) => s + e.amount, 0);
  const expense = data.expenses.filter(e => e.type === 'gider').reduce((s, e) => s + e.amount, 0);
  const totalOwed = data.debts.filter(d => d.status !== 'Ödendi').reduce((s, d) => s + d.amount, 0);
  const totalPaid = data.debts.filter(d => d.status === 'Ödendi').reduce((s, d) => s + d.amount, 0);

  const addExpense = () => {
    if (!expForm.title.trim() || !expForm.amount) return;
    const newExp = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: expForm.title,
      amount: Number(expForm.amount),
      type: expForm.type,
      payer: expForm.payer || currentUser?.displayName || 'Grup',
      members: Number(expForm.members) || 1,
      authorId: currentUser?.id,
      authorName: currentUser?.displayName || currentUser?.username,
      groupId: currentGroup?.id,
      createdAt: new Date().toLocaleString('tr-TR'),
    };
    setData(prev => ({ ...prev, expenses: [...prev.expenses, newExp] }));
    addNotification(`${expForm.type === 'gelir' ? '💰' : '💸'} "${expForm.title}" ${expForm.type === 'gelir' ? 'gelir' : 'gider'} olarak eklendi: ₺${expForm.amount}`);
    setExpForm({ title: '', amount: '', type: 'gider', payer: '', members: '1' });
    setShowExpense(false);
  };

  const addDebt = () => {
    if (!debtForm.from || !debtForm.to || !debtForm.amount || debtForm.from === debtForm.to) return;
    const newDebt = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      ...debtForm,
      amount: Number(debtForm.amount),
    };
    setData(prev => ({ ...prev, debts: [...prev.debts, newDebt] }));
    addNotification(`📝 ${debtForm.from} → ${debtForm.to} borç kaydı: ₺${debtForm.amount}`);
    setDebtForm({ from: '', to: '', amount: '', reason: '', status: 'Bekliyor' });
    setShowDebt(false);
  };

  const addSub = () => {
    if (!subForm.name.trim() || !subForm.amount) return;
    const newSub = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...subForm, amount: Number(subForm.amount) };
    setData(prev => ({ ...prev, subscriptions: [...prev.subscriptions, newSub] }));
    addNotification(`🔄 "${subForm.name}" aboneliği eklendi.`);
    setSubForm({ name: '', amount: '', next: '', status: 'Aktif' });
    setShowSub(false);
  };

  const addGift = () => {
    if (!giftForm.name.trim() || !giftForm.target) return;
    const newGift = { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...giftForm, target: Number(giftForm.target), current: Number(giftForm.current) || 0 };
    setData(prev => ({ ...prev, giftfunds: [...prev.giftfunds, newGift] }));
    addNotification(`🎁 "${giftForm.name}" hediye fonu oluşturuldu.`);
    setGiftForm({ name: '', target: '', current: '' });
    setShowGift(false);
  };

  const markDebtPaid = (id: string) => {
    setData(prev => ({
      ...prev,
      debts: prev.debts.map(d => d.id === id ? { ...d, status: 'Ödendi' as const } : d),
    }));
    const debt = data.debts.find(d => d.id === id);
    if (debt) addNotification(`✅ ${debt.from} → ${debt.to} borcu ödendi.`);
  };

  const addToGiftFund = (id: string) => {
    const amount = prompt('Katkı miktarı (₺):', '50');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      setData(prev => ({
        ...prev,
        giftfunds: prev.giftfunds.map(f => f.id === id ? { ...f, current: f.current + Number(amount) } : f),
      }));
      const fund = data.giftfunds.find(f => f.id === id);
      if (fund) addNotification(`🎁 "${fund.name}" fonuna ₺${amount} eklendi.`);
    }
  };

  const recent5 = data.expenses.slice(-5);
  const maxAmount = recent5.length ? Math.max(...recent5.map(e => e.amount)) : 1;

  return (
    <div>
      {/* Wallet Balance */}
      <div className="wallet-balance">
        <div className="amount">₺ {total.toLocaleString('tr-TR')}</div>
        <div className="label">
          📊 Grup Cüzdanı · {currentGroup ? currentGroup.name : 'Kişisel'}
          {currentUser && <span> · {currentUser.displayName}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-item"><div className="number" style={{ color: 'var(--green)' }}>{income.toLocaleString('tr-TR')}</div><div className="label">Gelir</div></div>
        <div className="stat-item"><div className="number" style={{ color: 'var(--red)' }}>{expense.toLocaleString('tr-TR')}</div><div className="label">Gider</div></div>
        <div className="stat-item"><div className="number">{data.expenses.length}</div><div className="label">İşlem</div></div>
      </div>

      {/* Mini Chart */}
      <div className="glass-card" style={{ marginBottom: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-sm">💰 Gelir / Gider</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Son {recent5.length} işlem</span>
        </div>
        <div className="flex items-end gap-1.5 h-20 py-2">
          {recent5.map((e, i) => {
            const h = maxAmount > 0 ? (e.amount / maxAmount) * 60 : 4;
            const color = e.type === 'gelir'
              ? 'linear-gradient(180deg, var(--green), #16a34a)'
              : 'linear-gradient(180deg, var(--red), #dc2626)';
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold">{e.amount}</span>
                <div style={{ height: `${h}px`, background: color, borderRadius: '6px 6px 0 0', width: '100%', minHeight: 4, transition: 'height 0.6s' }} />
                <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>{e.title.substring(0, 6)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses */}
      <div className="section-title">
        <h3><span className="icon-box"><Coins size={16} /></span>İşlemler <span className="count-badge">{data.expenses.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowExpense(true)}><Plus size={14} /> Ekle</button>
      </div>

      {data.expenses.length === 0 ? (
        <div className="empty-state">
          <Coins size={48} className="empty-state-icon" />
          <div>Hiç işlem yok.</div>
          <div className="empty-state-hint">Grup harcamalarını takip etmeye başlayın.</div>
        </div>
      ) : (
        data.expenses.slice().reverse().map(exp => (
          <div key={exp.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 12, background: exp.type === 'gelir' ? 'var(--green-dim)' : 'var(--red-dim)', color: exp.type === 'gelir' ? 'var(--green)' : 'var(--red)', fontSize: 14 }}>
              {exp.type === 'gelir' ? '↑' : '↓'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">{escapeHtml(exp.title)}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{escapeHtml(exp.payer || 'Grup')} · {exp.members || 1} kişi {exp.authorName ? `· ${exp.authorName}` : ''}</div>
            </div>
            <div className={`font-extrabold text-sm ${exp.type === 'gelir' ? 'text-green-500' : 'text-red-500'}`}>
              {exp.type === 'gelir' ? '+' : '-'}₺{exp.amount}
            </div>
          </div>
        ))
      )}

      {/* Debts */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><HandCoins size={16} /></span>Borç Takibi <span className="count-badge">{data.debts.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowDebt(true)}><Plus size={14} /> Borç</button>
      </div>

      {data.debts.length > 0 && (
        <div className="stats-grid mb-3">
          <div className="stat-item"><div className="number" style={{ color: 'var(--red)' }}>₺{totalOwed}</div><div className="label">Bekleyen</div></div>
          <div className="stat-item"><div className="number" style={{ color: 'var(--green)' }}>₺{totalPaid}</div><div className="label">Ödenen</div></div>
          <div className="stat-item"><div className="number">{data.debts.length}</div><div className="label">Kayıt</div></div>
        </div>
      )}

      {data.debts.length === 0 ? (
        <div className="empty-state">
          <HandCoins size={48} className="empty-state-icon" />
          <div>Henüz borç kaydı yok.</div>
          <div className="empty-state-hint">Kim kime ne kadar borçlu takip edin.</div>
        </div>
      ) : (
        data.debts.map(debt => (
          <div key={debt.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 12, background: debt.status === 'Ödendi' ? 'var(--green-dim)' : 'var(--red-dim)', color: debt.status === 'Ödendi' ? 'var(--green)' : 'var(--red)', fontSize: 14 }}>
              {debt.status === 'Ödendi' ? '✓' : '!'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold">{escapeHtml(debt.from)} → {escapeHtml(debt.to)}</div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{escapeHtml(debt.reason || 'Borç')}</div>
            </div>
            <div className={`font-extrabold text-sm ${debt.status === 'Ödendi' ? 'line-through opacity-50 text-green-500' : 'text-red-500'}`}>
              ₺{debt.amount}
            </div>
            {debt.status !== 'Ödendi' && (
              <button className="p-1 rounded-lg hover:bg-white/5" style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => markDebtPaid(debt.id)} title="Ödendi"><Check size={14} /></button>
            )}
          </div>
        ))
      )}

      {/* Subscriptions */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Repeat size={16} /></span>Abonelikler <span className="count-badge">{data.subscriptions.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowSub(true)}><Plus size={14} /> Ekle</button>
      </div>

      {data.subscriptions.length === 0 ? (
        <div className="empty-state">
          <Repeat size={48} className="empty-state-icon" />
          <div>Abonelik yok.</div>
        </div>
      ) : (
        data.subscriptions.map(sub => (
          <div key={sub.id} className="glass-card">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-bold">{escapeHtml(sub.name)}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sıradaki: {escapeHtml(sub.next || 'Belirtilmemiş')} · ₺{sub.amount}/kişi</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 14px', borderRadius: 9999, background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.2)' }}>
                {escapeHtml(sub.status || 'Aktif')}
              </span>
            </div>
          </div>
        ))
      )}

      {/* Gift Funds */}
      <div className="section-title mt-6">
        <h3><span className="icon-box"><Gift size={16} /></span>Hediye Fonu <span className="count-badge">{data.giftfunds.length}</span></h3>
        <button className="btn-gradient btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
          onClick={() => setShowGift(true)}><Plus size={14} /> Oluştur</button>
      </div>

      {data.giftfunds.length === 0 ? (
        <div className="empty-state">
          <Gift size={48} className="empty-state-icon" />
          <div>Hediye fonu yok.</div>
          <div className="empty-state-hint">Bir arkadaşınız için hediye toplayın!</div>
        </div>
      ) : (
        data.giftfunds.map(fund => {
          const progress = Math.min(100, (fund.current / fund.target) * 100);
          return (
            <div key={fund.id} className="glass-card">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">{escapeHtml(fund.name)}</span>
                <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>₺{fund.current} / ₺{fund.target}</span>
              </div>
              <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border)' }}>
                <div style={{ width: `${progress}%`, height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg, var(--gold), #f59e0b)', transition: 'width 0.6s' }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>%{Math.round(progress)} tamamlandı</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Kalan: ₺{Math.max(0, fund.target - fund.current)}</span>
              </div>
              <button className="btn-gradient mt-2" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff', fontSize: 11 }}
                onClick={() => addToGiftFund(fund.id)}>Katkı Yap</button>
            </div>
          );
        })
      )}

      {/* ─── MODALLAR ─── */}
      {showExpense && (
        <div className="modal-overlay" onClick={() => setShowExpense(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni İşlem</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AÇIKLAMA</label>
            <input className="glass-input mb-3" placeholder="Halı Saha" value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>TUTAR</label>
            <input className="glass-input mb-3" type="number" placeholder="400" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>TÜR</label>
            <select className="glass-input mb-3" value={expForm.type} onChange={e => setExpForm({ ...expForm, type: e.target.value as 'gelir' | 'gider' })}>
              <option value="gider">Gider</option><option value="gelir">Gelir</option>
            </select>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ÖDEYEN</label>
            <input className="glass-input mb-3" placeholder={currentUser?.displayName || 'Ahmet'} value={expForm.payer} onChange={e => setExpForm({ ...expForm, payer: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>KİŞİ SAYISI</label>
            <input className="glass-input mb-4" type="number" placeholder="6" value={expForm.members} onChange={e => setExpForm({ ...expForm, members: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowExpense(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addExpense}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showDebt && (
        <div className="modal-overlay" onClick={() => setShowDebt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Yeni Borç</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>BORÇLU</label>
            <input className="glass-input mb-3" placeholder="Ahmet" value={debtForm.from} onChange={e => setDebtForm({ ...debtForm, from: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ALACAKLI</label>
            <input className="glass-input mb-3" placeholder="Mehmet" value={debtForm.to} onChange={e => setDebtForm({ ...debtForm, to: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>TUTAR</label>
            <input className="glass-input mb-3" type="number" placeholder="200" value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SEBEP</label>
            <input className="glass-input mb-4" placeholder="Halı saha masrafı" value={debtForm.reason} onChange={e => setDebtForm({ ...debtForm, reason: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowDebt(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addDebt}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showSub && (
        <div className="modal-overlay" onClick={() => setShowSub(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Abonelik</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>AD</label>
            <input className="glass-input mb-3" placeholder="Netflix" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ÜCRET</label>
            <input className="glass-input mb-3" type="number" placeholder="30" value={subForm.amount} onChange={e => setSubForm({ ...subForm, amount: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>SIRADAKİ</label>
            <input className="glass-input mb-4" placeholder="Can" value={subForm.next} onChange={e => setSubForm({ ...subForm, next: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowSub(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addSub}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {showGift && (
        <div className="modal-overlay" onClick={() => setShowGift(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold mb-4"><Plus size={20} style={{ color: 'var(--accent)', display: 'inline' }} /> Hediye Fonu</h3>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>FON ADI</label>
            <input className="glass-input mb-3" placeholder="Mehmet'in Doğum Günü" value={giftForm.name} onChange={e => setGiftForm({ ...giftForm, name: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>HEDEF</label>
            <input className="glass-input mb-3" type="number" placeholder="1000" value={giftForm.target} onChange={e => setGiftForm({ ...giftForm, target: e.target.value })} />
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>MEVCUT</label>
            <input className="glass-input mb-4" type="number" placeholder="0" value={giftForm.current} onChange={e => setGiftForm({ ...giftForm, current: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button className="btn-gradient" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => setShowGift(false)}>İptal</button>
              <button className="btn-gradient" style={{ background: 'linear-gradient(135deg, var(--accent), #f59e0b)', color: '#fff' }}
                onClick={addGift}>Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
