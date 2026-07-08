const MIN_PASSWORD_LENGTH = 10;

function getEmailPrefix(email) {
  if (!email || !email.includes('@')) {
    return '';
  }
  return email.split('@')[0].trim().toLowerCase();
}

export function validatePasswordStrength(password, { username, email } = {}) {
  const errors = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('include at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('include at least one number');
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    errors.push('include at least one special character');
  }

  const normalizedPassword = password.toLowerCase();
  const normalizedUsername = (username || '').trim().toLowerCase();
  const normalizedEmailPrefix = getEmailPrefix(email);

  if (normalizedUsername && normalizedPassword.includes(normalizedUsername)) {
    errors.push('not include your username');
  }
  if (normalizedEmailPrefix && normalizedPassword.includes(normalizedEmailPrefix)) {
    errors.push('not include the part of your email before @');
  }

  return {
    isValid: errors.length === 0,
    message: errors.length
      ? `Password does not meet the security requirements: ${errors.join('; ')}`
      : '',
  };
}
