import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _isLoggedIn = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  private _isAdmin = new BehaviorSubject<boolean>(false);
  private _isEE = new BehaviorSubject<boolean>(false);

  isLoggedIn$: Observable<boolean> = this._isLoggedIn.asObservable();
  isAdmin$: Observable<boolean> = this._isAdmin.asObservable();
  isEE$: Observable<boolean> = this._isEE.asObservable();

  constructor() {
    this.updateAuthState();
  }

  updateAuthState() {
    const token = localStorage.getItem('token');
    const loggedIn = !!token;
    let isAdmin = false;
    let isEE = false

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = Array.isArray(payload.roles) && payload.roles.includes('ADMINISTRATOR');
      isEE = Array.isArray(payload.roles) && payload.roles.includes('CLIENT');
console.log(isEE)
    }

    this._isLoggedIn.next(loggedIn);
    this._isAdmin.next(isAdmin);
    this._isEE.next(isEE);
  }

  logout() {
    localStorage.removeItem('token');
    this.updateAuthState();
  }

  login(token: string) {
    localStorage.setItem('token', token);
    this.updateAuthState();
  }
}