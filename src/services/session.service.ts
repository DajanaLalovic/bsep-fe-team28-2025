import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Session {
  jti: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string; 
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(private http: HttpClient) {}

  private apiUrl = 'https://localhost:8443/api';

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.apiUrl}/sessions`);
  }

//   revokeSession(jti: string): Observable<any> {
//     return this.http.post(`${this.apiUrl}/sessions/revoke`, null, { params: { jti } });
//   }

revokeSession(jti: string) {
  return this.http.post(`${this.apiUrl}/sessions/revoke?jti=${jti}`, {});
}
// Revoke trenutne sesije (logoutuje)
revokeCurrentSession(jti: string) {
  return this.http.post(`${this.apiUrl}/auth/revoke?jti=${jti}`, {});
}
}