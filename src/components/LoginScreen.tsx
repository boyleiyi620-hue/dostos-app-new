import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Crown, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Tüm alanları doldurun.');
      return;
    }
    if (mode === 'login') {
      const ok = login(username.trim(), password.trim());
      if (!ok) setError('Kullanıcı adı veya şifre hatalı.');
    } else {
      if (!displayName.trim()) {
        setError('Görünen ad gerekli.');
        return;
      }
      const ok = register(username.trim(), password.trim(), displayName.trim());
      if (!ok) setError('Bu kullanıcı adı zaten alınmış.');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <Crown size={32} />
        </div>
        <h1 className="text-center text-2xl font-extrabold mb-1 tracking-tight">
          Dost<span style={{ color: 'var(--accent)' }}>OS</span>
        </h1>
        <p className="text-center text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'login' ? 'Hesabına gir, grupla kal.' : 'Yeni hesap oluştur, gruba katıl.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                GÖRÜNEN AD
              </label>
              <input
                className="glass-input"
                placeholder="Ahmet"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              KULLANICI ADI
            </label>
            <input
              className="glass-input"
              placeholder="ahmet123"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoCapitalize="off"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              ŞİFRE
            </label>
            <div className="relative">
              <input
                className="glass-input pr-10"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-center py-2 px-3 rounded-lg" style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #f59e0b)',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {mode === 'login' ? <><LogIn size={16} /> Giriş Yap</> : <><UserPlus size={16} /> Hesap Oluştur</>}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>Hesabın yok mu? <button onClick={() => { setMode('register'); setError(''); }} className="font-bold" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Kayıt Ol</button></>
          ) : (
            <>Zaten hesabın var? <button onClick={() => { setMode('login'); setError(''); }} className="font-bold" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Giriş Yap</button></>
          )}
        </p>
      </div>
    </div>
  );
}
