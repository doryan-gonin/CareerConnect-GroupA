// Mirrors the password rules enforced by src/backend/routers/auth.py
// (validate_password_strength), so the UI can show live feedback before
// ever hitting the server.
export const passwordRules = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'An uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'A lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'A number', test: (pw) => /\d/.test(pw) },
  { label: 'A special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export function isPasswordValid(password) {
  return passwordRules.every((rule) => rule.test(password))
}
