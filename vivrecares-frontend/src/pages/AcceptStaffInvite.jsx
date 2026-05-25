import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import logoBlack from '../assets/vivre-black.png';
import PasswordInput from '../components/PasswordInput';

const AcceptStaffInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    axios.get('/get_staff_invite.php', { params: { token } })
      .then((response) => {
        if (!isMounted) return;
        if (response.data.status === 'success') {
          setInvite(response.data.invite);
        } else {
          setError(response.data.message || 'This invitation is invalid or expired.');
        }
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.response?.data?.message || 'Unable to load this invitation.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/accept_staff_invite.php', {
        token,
        password,
      });

      if (response.data.status === 'success') {
        setMessage(response.data.message || 'Invitation accepted. You can now log in.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setError(response.data.message || 'Unable to accept this invitation.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to accept this invitation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center px-4 py-12">
      <button type="button" onClick={() => navigate('/')} className="mb-8">
        <img src={logoBlack} alt="Vivre" className="h-16" />
      </button>

      <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b2a58d]">Staff Invitation</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-800">Set your password</h1>

        {loading && <p className="mt-6 text-sm text-gray-500">Loading invitation...</p>}

        {!loading && error && !invite && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && invite && (
          <>
            <div className="mt-6 rounded-2xl border border-gray-100 bg-[#faf9f6] px-5 py-4">
              <p className="text-base font-semibold text-gray-800">{invite.first_name} {invite.last_name}</p>
              <p className="mt-1 text-sm text-gray-500">{invite.email}</p>
              <span className={`mt-3 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${invite.role === 'Admin' ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                {invite.role}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <PasswordField
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                visible={showPassword}
                onToggleVisibility={() => setShowPassword((prev) => !prev)}
              />
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                visible={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              />

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
              >
                {saving ? 'Accepting...' : 'Accept Invitation'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const PasswordField = ({ label, visible, onToggleVisibility, ...props }) => (
  <div>
    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{label}</label>
    <PasswordInput
      {...props}
      visible={visible}
      onToggleVisibility={onToggleVisibility}
      minLength={8}
      required
      inputClassName="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 pr-14 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
      buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
    />
  </div>
);

export default AcceptStaffInvite;
