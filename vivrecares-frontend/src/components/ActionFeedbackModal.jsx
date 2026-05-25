const toneStyles = {
  success: {
    iconWrap: 'bg-green-50 text-green-500',
    button: 'bg-[#555555] text-[#c4ba9d] hover:bg-black',
  },
  error: {
    iconWrap: 'bg-red-50 text-red-500',
    button: 'bg-[#555555] text-[#c4ba9d] hover:bg-black',
  },
  info: {
    iconWrap: 'bg-amber-50 text-amber-600',
    button: 'bg-[#555555] text-[#c4ba9d] hover:bg-black',
  },
};

const icons = {
  success: (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8h.01M11 12h1v4h1m-6 4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
    </svg>
  ),
};

const ActionFeedbackModal = ({
  open,
  tone = 'info',
  title,
  message,
  confirmLabel = 'OK',
  onClose,
}) => {
  if (!open) return null;

  const palette = toneStyles[tone] || toneStyles.info;
  const displayMessage = friendlyErrorMessage(message);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${palette.iconWrap}`}>
          {icons[tone] || icons.info}
        </div>
        <h3 className="mb-2 text-2xl font-bold text-gray-800">{title}</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-500">{displayMessage}</p>
        <button
          type="button"
          onClick={onClose}
          className={`mt-8 rounded-full px-8 py-3 text-[11px] font-bold uppercase tracking-[0.18em] shadow-lg transition ${palette.button}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

export default ActionFeedbackModal;
import { friendlyErrorMessage } from '../utils/friendlyErrors';
