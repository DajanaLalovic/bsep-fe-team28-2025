export function passwordStrength(password: string): number {
let score = 0;

if (!password) return score;

if (password.length >= 8) score++;
if (/[A-Z]/.test(password)) score++;
if (/[a-z]/.test(password)) score++;
if (/[0-9]/.test(password)) score++;
if (/[^A-Za-z0-9]/.test(password)) score++;

return score; // 0–5
}