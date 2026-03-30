const EyeIcon = ({ visible }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
    <path d="M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
    {visible && <path d="M4 20 20 4" />}
  </svg>
);

const PasswordInput = ({
  visible,
  onToggleVisibility,
  containerClassName = '',
  inputClassName = '',
  buttonClassName = '',
  inputStyle,
  buttonStyle,
  ...inputProps
}) => {
  const toggleLabel = visible ? 'Hide password' : 'Show password';

  return (
    <div className={`relative ${containerClassName}`.trim()}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={inputClassName}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={buttonClassName}
        style={buttonStyle}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
};

export default PasswordInput;
