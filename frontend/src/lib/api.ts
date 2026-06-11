"use client";

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('myats_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('myats_session_id', sid);
  }
  return sid;
}

export function getApiHeaders(authToken?: string | null): Record<string, string> {
  const sessionId = getOrCreateSessionId();
  const headers: Record<string, string> = {
    'X-Session-ID': sessionId,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
}
