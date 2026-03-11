import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
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
    this.message = '';
    this.error = '';

    this.auth.forgotPassword(this.forgotForm.value.email!)
      .subscribe({
        next: (res: any) => {
          if (res.success === "true") {
            this.message = res.message;  // "A password reset link has been sent to your email."
          } else {
            this.error = res.message;    // "Email does not exist."
          }
          this.loading = false;
        //  this.forgotForm.value.email = ''
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Something went wrong.';
          this.loading = false;
        }
      });
  }
}