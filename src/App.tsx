import { useApp } from '@/context/AppContext';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';

export default function App() {
  const { currentUser } = useApp();
  return currentUser ? <AppShell /> : <LoginScreen />;
}
