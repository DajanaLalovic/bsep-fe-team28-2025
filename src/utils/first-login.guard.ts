import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class FirstLoginGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;

    const payload = JSON.parse(atob(token.split('.')[1]));

    if (payload.firstLogin) {
      this.router.navigate(['/force-change-password']);
      return false;
    }

    return true;
  }
}