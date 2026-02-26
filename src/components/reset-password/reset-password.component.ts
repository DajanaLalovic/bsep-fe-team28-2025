import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/services/auth.service';
import { passwordStrength } from 'src/utils/password-strength.util';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls : ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  loading = false;
  error = '';
  success = '';
  token: string = '';
  strength = 0;

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error = 'Invalid password reset link.';
      }
    });
  }

  onPasswordInput() {
    const password = this.resetForm.value.newPassword ?? '';
    this.strength = passwordStrength(password);
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.error = 'Please fix the errors in the form.';
      return;
    }

    const newPassword = this.resetForm.value.newPassword ?? '';
    const confirmPassword = this.resetForm.value.confirmPassword ?? '';

    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.auth.resetPassword({
      newPassword,
      confirmPassword,
      token: this.token
    }).subscribe({
      next: () => {
        this.success = 'Password has been reset successfully.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err: any) => {
        this.error = err.error || 'Something went wrong.';
        this.loading = false;
      }
    });
  }
}