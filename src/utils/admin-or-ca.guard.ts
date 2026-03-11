import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminOrCaGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles: string[] = payload.roles || [];

    if (roles.includes('ADMINISTRATOR') || roles.includes('CA_USER')) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
