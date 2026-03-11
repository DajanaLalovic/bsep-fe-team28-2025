// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface ShareDto {
//   userId: number;
//   encryptedPassword: string;
// }

// export interface EntryDto {
//   id: number;
//   siteName: string;
//   username: string;
//   ownerId: number;
// }

// export interface PasswordEntryWithShares {
//   entry: EntryDto;
//   shares: ShareDto[];
// }

// export interface ShareableUser {
//   id: number;
//   email: string;
//   name?: string;
//   surname?: string;
//   organization?: string;
// }

// export interface CreatePasswordRequest {
//   siteName: string;
//   username: string;
//   encryptedPassword: string;
//   encryptedAesKey?: string;
//   iv?: string;
// }

// export interface ShareRequest {
//   encryptedPassword: string;
//   encryptedAesKey?: string;
//   iv?: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class PasswordManagerService {

//   private apiUrl = 'http://localhost:8080/api/passwords';

//   constructor(private http: HttpClient) {}

//   private getHeaders(): HttpHeaders {
//     const token = localStorage.getItem('jwt');
//     return new HttpHeaders({
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     });
//   }

//   // GET all entries with shares
//   getEntriesWithShares(): Observable<PasswordEntryWithShares[]> {
//     return this.http.get<PasswordEntryWithShares[]>(
//       `${this.apiUrl}/entries-with-shares`,
//       { headers: this.getHeaders() }
//     );
//   }

//   // POST new password
//   createPassword(req: CreatePasswordRequest): Observable<void> {
//     return this.http.post<void>(
//       this.apiUrl,
//       req,
//       { headers: this.getHeaders() }
//     );
//   }

//   // POST share password with target user
//   sharePassword(entryId: number, targetUserId: number, req: ShareRequest): Observable<void> {
//     return this.http.post<void>(
//       `${this.apiUrl}/${entryId}/share/${targetUserId}`,
//       req,
//       { headers: this.getHeaders() }
//     );
//   }

//   // GET public key of user
//   getUserPublicKey(userId: number): Observable<{ userId: string; publicKeyPem: string }> {
//     return this.http.get<{ userId: string; publicKeyPem: string }>(
//       `${this.apiUrl}/users/${userId}/public-key`,
//       { headers: this.getHeaders() }
//     );
//   }
// }