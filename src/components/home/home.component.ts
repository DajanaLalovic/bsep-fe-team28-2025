import { Component } from '@angular/core';
import { CommonModule, NgIf, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from 'src/services/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgIf, AsyncPipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  isAdmin$ = this.authStore.isAdmin$;
  isCaUser$ = this.authStore.isCaUser$;
  isClient$ = this.authStore.isClient$;

  constructor(private authStore: AuthStore) {}
}
