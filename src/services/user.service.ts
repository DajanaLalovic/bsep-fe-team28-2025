import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ShareableUser, UserPublicKeyResponse } from 'src/model/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'https://localhost:8443/api/passwords';

  constructor(private http: HttpClient) {}

  getUserPublicKey(userId: number): Observable<UserPublicKeyResponse> {
    return this.http.get<UserPublicKeyResponse>(`${this.baseUrl}/users/${userId}/public-key`);
  }

  getShareableUsers(): Observable<ShareableUser[]> {
    return this.http.get<ShareableUser[]>(`${this.baseUrl}/shareable`);
  }
}