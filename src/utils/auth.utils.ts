export function getUserIdFromToken(): number | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payloadBase64 = token.split('.')[1];
  const decodedPayload = atob(payloadBase64);
  const payload = JSON.parse(decodedPayload);

  return payload.id ?? null;
}