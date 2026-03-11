import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePasswordItemRequest, PasswordItemResponse } from 'src/model/password-item.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  private baseUrl = 'https://localhost:8443/api/passwords';

  constructor(private http: HttpClient) {}

  getMyPasswords(): Observable<PasswordItemResponse[]> {
    return this.http.get<PasswordItemResponse[]>(this.baseUrl);
  }

  createPassword(request: CreatePasswordItemRequest): Observable<PasswordItemResponse> {
    return this.http.post<PasswordItemResponse>(this.baseUrl, request);
  }

  deletePassword(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}