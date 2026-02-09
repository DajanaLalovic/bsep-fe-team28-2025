import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  loading = false;
  error = '';
  success = '';
  token: string = '';

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
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

  onSubmit() {
    if (this.resetForm.invalid) return;

    if (this.resetForm.value.newPassword !== this.resetForm.value.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post('/api/auth/reset-password', {
      newPassword: this.resetForm.value.newPassword,
      confirmPassword: this.resetForm.value.confirmPassword
    }, { params: { token: this.token } }).subscribe({
      next: () => {
        this.success = 'Password has been reset successfully.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error || 'Something went wrong.';
        this.loading = false;
      }
    });
  }
}
