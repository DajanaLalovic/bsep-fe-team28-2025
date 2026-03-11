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
  isEE$!: Observable<boolean>;


  ngOnInit() {
    this.isLoggedIn$ = this.authStore.isLoggedIn$;
    this.isAdmin$ = this.authStore.isAdmin$;
    this.isEE$ = this.authStore.isEE$;
  }


  constructor(private router: Router, private authStore: AuthStore) {}
  isAdmin = false
  isEE = false

  

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