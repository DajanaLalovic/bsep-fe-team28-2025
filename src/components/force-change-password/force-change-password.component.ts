import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/services/auth.service';
import { passwordStrength } from 'src/utils/password-strength.util';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './force-change-password.component.html',
  styleUrls: ['./force-change-password.component.css']
})
export class ForceChangePasswordComponent implements OnInit {

  loading = false;
  error = '';
  success = '';
  strength = 0;
  token = '';

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      this.error = 'Session expired. Please login again.';
      return;
    }

    this.token = storedToken;
  }

  onPasswordInput(): void {
    const password = this.form.value.newPassword ?? '';
    this.strength = passwordStrength(password);
  }

//   onSubmit(): void {

//     if (this.form.invalid) {
//       this.error = 'Please fix the errors in the form.';
//       return;
//     }

//     const newPassword = this.form.value.newPassword ?? '';
//     const confirmPassword = this.form.value.confirmPassword ?? '';

//     if (newPassword !== confirmPassword) {
//       this.error = 'Passwords do not match.';
//       return;
//     }

//     this.loading = true;
//     this.error = '';
//     this.success = '';

//     this.auth.firstTimeResetPassword({
//       newPassword,
//       confirmPassword
//     }).subscribe({
//       next: () => {
//         this.success = 'Password changed successfully.';
//         this.loading = false;

//         // Brišemo stari JWT (firstLogin=true)
//         localStorage.removeItem('token');

//         // Redirect na login
//         setTimeout(() => {
//           this.router.navigate(['/login']);
//         }, 2000);
//       },
//       error: (err: any) => {
//         this.error = err?.error || 'Something went wrong.';
//         this.loading = false;
//       }
//     });
//   }
onSubmit(): void {

  if (this.form.invalid) {
    this.error = 'Please fix the errors in the form.';
    return;
  }

  const newPassword = this.form.value.newPassword ?? '';
  const confirmPassword = this.form.value.confirmPassword ?? '';

  if (newPassword !== confirmPassword) {
    this.error = 'Passwords do not match.';
    return;
  }

  this.loading = true;
  this.error = '';
  this.success = '';

  const token = localStorage.getItem('token'); // izvučemo JWT
  if (!token) {
    this.error = 'Session expired. Please login again.';
    this.loading = false;
    return;
  }

  this.auth.firstTimeResetPassword({ newPassword, confirmPassword })
    .subscribe({
      next: () => {
        this.success = 'Password changed successfully.';
        this.loading = false;
        localStorage.removeItem('token'); // obriši JWT
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Something went wrong.';
        this.loading = false;
      }
    });
}
}