// import { HttpClient } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { SharePasswordRequest, SharePasswordResponse } from 'src/model/password-share.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class PasswordShareService {

//   private baseUrl = 'https://localhost:8443/api/password-shares';

//   constructor(private http: HttpClient) {}

//   sharePassword(request: SharePasswordRequest): Observable<SharePasswordResponse> {
//     return this.http.post<SharePasswordResponse>(this.baseUrl, request);
//   }

//   getSharedWithMe(): Observable<SharePasswordResponse[]> {
//     return this.http.get<SharePasswordResponse[]>(`${this.baseUrl}/shared-with-me`);
//   }
// }

export interface PublicKeyResponse {
  publicKeyPem: string;
  certificateSerialNumber: string;
  userId: number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PasswordEntry, PasswordShare } from '../model/password-entry.model';
import { User } from 'src/model/user.model';

export interface PasswordEntryWithShares {
  entry: {
    id: number;
    siteName: string;
    username: string;
    ownerId: number;
  };
  shares: ShareDto[];
}

// Share DTO
export interface ShareDto {
  userId: number;
  encryptedPassword: string;
  encryptedKey: string;
  iv: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordShareService {

  constructor(private http: HttpClient) {}
  private apiUrl = 'https://localhost:8443/api';

  // Share password with another user
  // sharePassword(entryId: number, targetUserId: number, encryptedPassword: string): Observable<PasswordEntryWithShares> {
  //   return this.http.post<PasswordEntryWithShares>(`${this.apiUrl}/passwords/${entryId}/share`, {
  //     targetUserId,
  //     encryptedPassword
  //   });
  // }
  // services/password-share.service.ts
sharePassword(
  entryId: number,
  targetUserId: number,
  encryptedData: { encryptedPassword: string; encryptedKey: string; iv: string } // ⬅ tip izmenjen
): Observable<PasswordEntryWithShares> {
  return this.http.post<PasswordEntryWithShares>(
    `${this.apiUrl}/passwords/${entryId}/share/${targetUserId}`,
    {
      targetUserId,
      ...encryptedData
    }
  );
}

  // Get all shares for a password entry
  getShares(entryId: number): Observable<PasswordShare[]> {
    return this.http.get<PasswordShare[]>(`${this.apiUrl}/passwords/${entryId}/shares`);
  }

   getEntriesWithShares(): Observable<PasswordEntryWithShares[]> {
    return this.http.get<PasswordEntryWithShares[]>(`${this.apiUrl}/passwords/entries-with-shares`);
  }

  // Get a user's public key
  getUserPublicKey(userId: number): Observable<PublicKeyResponse> {
    return this.http.get<PublicKeyResponse>(`${this.apiUrl}/passwords/users/${userId}/public-key`);
  }

  getOtherUsers(currentEmail: string) {
  return this.http.get<User[]>(`${this.apiUrl}/users/others?email=${encodeURIComponent(currentEmail)}`);
}
}