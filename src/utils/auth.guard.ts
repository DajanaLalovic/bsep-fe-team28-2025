import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

 
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.firstLogin) {
        this.router.navigate(['/force-change-password']);
        return false;
      }

      return true; // korisnik je ulogovan → dozvoli pristup
      
    } else {
      this.router.navigate(['/login']); // nije ulogovan → redirect
      return false;
    }
  }
}