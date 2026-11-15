// Mirrors the password rules enforced by src/backend/routers/auth.py
// (validate_password_strength), so the UI can show live feedback before
// ever hitting the server.
export const passwordRules = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "At most 72 bytes", test: (pw: string) => new TextEncoder().encode(pw).length <= 72 },
  { label: "An uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "A lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "A number", test: (pw: string) => /\d/.test(pw) },
  { label: "A special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

export function isPasswordValid(password: string) {
  return passwordRules.every((rule) => rule.test(password));
}
