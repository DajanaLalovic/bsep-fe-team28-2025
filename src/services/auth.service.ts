import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface RegisterRequest {
name: string;
surname: string;
email: string;
password: string;
confirmPassword: string;
organization?: string;
}
export interface LoginRequest {
email: string;
password: string;
captchaResponse: string;
}

@Injectable({
providedIn: 'root'
})
export class AuthService {


private apiUrl = 'http://localhost:8080/api/auth';


constructor(private http: HttpClient) {}


    register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
    }

    
    login(data: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
    }
}