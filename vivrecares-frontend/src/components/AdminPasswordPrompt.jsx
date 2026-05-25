import { useState } from 'react';
import PasswordInput from './PasswordInput';

const AdminPasswordPrompt = ({
    open,
    title = 'Admin Password Required',
    message = 'Enter your admin password to continue.',
    onCancel,
    onConfirm,
}) => {
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);

    if (!open) return null;

    const submit = (event) => {
        event.preventDefault();
        if (!password) return;
        onConfirm(password);
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Protected Action</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>

                <div className="mt-6">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Admin Password</label>
                    <PasswordInput
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        visible={visible}
                        onToggleVisibility={() => setVisible((prev) => !prev)}
                        autoFocus
                        inputClassName="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 pr-14 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                        buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
                    />
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setPassword('');
                            onCancel();
                        }}
                        className="rounded-xl border border-gray-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 transition hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!password}
                        className="rounded-xl bg-[#555555] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
                    >
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminPasswordPrompt;
