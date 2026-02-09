import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {

  loading = false;
  message = '';
  error = '';

 forgotForm = this.fb.nonNullable.group({
  email: ['', [Validators.required, Validators.email]]
});


 constructor(
  private fb: FormBuilder,
  private auth: AuthService
) {}

onSubmit() {
  if (this.forgotForm.invalid) return;

  this.loading = true;

  this.auth.forgotPassword(this.forgotForm.value.email!)
    .subscribe({
      next: () => {
        this.message = 'If the email exists, a password reset link has been sent.';
        this.loading = false;
      },
      error: () => {
        this.error = 'Something went wrong.';
        this.loading = false;
      }
    });
}

}
