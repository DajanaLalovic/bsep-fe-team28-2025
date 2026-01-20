import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/services/auth.service';
import { RecaptchaModule } from 'ng-recaptcha';


@Component({
selector: 'app-login',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RecaptchaModule  ],
templateUrl: './login.component.html',
styleUrls: ['./login.component.css']
})
export class LoginComponent {


loginForm: FormGroup;
successMessage = '';
errorMessage = '';


constructor(private fb: FormBuilder, private authService: AuthService) {
    this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    captchaResponse: ['', Validators.required]
    });
}

onCaptchaResolved(token: string | null) {
this.loginForm.patchValue({ captchaResponse: token });
}

submit() {
    if (this.loginForm.invalid) return;

    this.authService.login(this.loginForm.value).subscribe({
        next: () => {
        this.successMessage = 'Login successful.';
        this.errorMessage = '';
        },
        error: err => {
        this.errorMessage = err?.error?.message || 'Invalid email or password.';
        }
    });
}
}