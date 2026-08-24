import { useState } from 'react';
import GlassPanel from '../components/ui/GlassPanel';
import { endpoints } from '../lib/api';
import Input from '../components/ui/Input';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/auth-context';

const SECTIONS = ['Account', 'Workspace', 'Security', 'Notifications', 'System'];

export default function Settings() {
  const { user, refresh } = useAuth();
  const [active, setActive] = useState('Account');
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [feedback, setFeedback] = useState({ message: '', error: '' });

  const saveProfile = async (event) => {
    event.preventDefault();
    try { await endpoints.updateProfile({ name }); await refresh(); setFeedback({ message: 'Profile saved.', error: '' }); } catch (err) { setFeedback({ message: '', error: err.message }); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try { await endpoints.changePassword(passwords); setPasswords({ currentPassword: '', newPassword: '' }); setFeedback({ message: 'Password changed.', error: '' }); } catch (err) { setFeedback({ message: '', error: err.message }); }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setActive(s)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${active === s ? 'glass-panel-strong text-ink' : 'text-muted hover:text-ink'}`}>{s}</button>
        ))}
      </nav>

      <GlassPanel className="flex-1 p-6">
        {active === 'Account' && (
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-ink">Profile</h2>
            <form onSubmit={saveProfile} className="mt-4 flex flex-col gap-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email" defaultValue={user?.email} disabled />
              <Button type="submit" className="w-fit">Save Changes</Button>
            </form>
            <h2 className="mt-8 text-lg font-semibold text-ink">Password</h2>
            <form onSubmit={changePassword} className="mt-4 flex flex-col gap-4">
              <PasswordInput label="Current password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
              <PasswordInput label="New password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
              <Button type="submit" variant="ghost" className="w-fit">Change Password</Button>
            </form>
            {(feedback.message || feedback.error) && <p className={`mt-4 text-xs ${feedback.error ? 'text-crimson' : 'text-emerald'}`}>{feedback.error || feedback.message}</p>}
          </div>
        )}
        {active === 'Workspace' && <p className="text-sm text-muted">Organization and location settings will appear here once configured on the backend.</p>}
        {active === 'Security' && <p className="text-sm text-muted">Authentication and API security policies for your organization.</p>}
        {active === 'Notifications' && <p className="text-sm text-muted">Configure email delivery for alerts and account notifications.</p>}
        {active === 'System' && <p className="text-sm text-muted">General platform and API rate-limit configuration (Super Admin only).</p>}
      </GlassPanel>
    </div>
  );
}
