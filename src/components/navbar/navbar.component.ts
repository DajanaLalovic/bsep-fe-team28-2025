import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from 'src/services/auth.store';
import { Observable } from 'rxjs';


@Component({
selector: 'app-navbar',
standalone: true,
imports: [CommonModule, RouterModule],
templateUrl: './navbar.component.html',
styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {


  isLoggedIn$!: Observable<boolean>;
  isAdmin$!: Observable<boolean>;


  ngOnInit() {
    this.isLoggedIn$ = this.authStore.isLoggedIn$;
    this.isAdmin$ = this.authStore.isAdmin$;
  }


  constructor(private router: Router, private authStore: AuthStore) {}
  isAdmin = false

  //  ngOnInit(): void {
  //   const token = localStorage.getItem('token');

  //   if (!token) return;

  //   const payload = JSON.parse(atob(token.split('.')[1]));
  // console.log(payload)
  // this.isAdmin = Array.isArray(payload.roles) 
  // && payload.roles.some((role: any) => role === 'ADMINISTRATOR');
  // }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    this.authStore.logout()
    localStorage.removeItem('token');
    localStorage.removeItem('_grecaptcha');
    this.router.navigate(['/login']);
  }
}