export const friendlyErrorMessage = (message, fallback = 'Something went wrong. Please check your entries and try again.') => {
  const text = String(message || '').trim();
  if (!text) return fallback;

  const lower = text.toLowerCase();

  if (
    lower.includes('sqlstate') ||
    lower.includes('integrity constraint') ||
    lower.includes('duplicate entry') ||
    lower.includes('constraint violation') ||
    lower.includes('database error')
  ) {
    if (lower.includes('duplicate') && lower.includes('email')) {
      return 'That email address is already used by another account. Please use a different email.';
    }

    if (lower.includes('duplicate')) {
      return 'This record already exists. Please check the details and try again.';
    }

    return fallback;
  }

  return text.replace(/^Error:\s*/i, '');
};
