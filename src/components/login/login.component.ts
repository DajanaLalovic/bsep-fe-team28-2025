import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/services/auth.service';
import { RecaptchaModule } from 'ng-recaptcha';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from 'src/services/auth.store';


@Component({
selector: 'app-login',
standalone: true,
imports: [CommonModule, ReactiveFormsModule, RecaptchaModule , RouterModule],
templateUrl: './login.component.html',
styleUrls: ['./login.component.css']
})
export class LoginComponent {


loginForm: FormGroup;
successMessage = '';
errorMessage = '';


constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private authStore: AuthStore) {
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
        next: (res) => {
        this.successMessage = 'Login successful.';
        this.errorMessage = '';
       // this.router.navigate(['/']);
       this.authStore.login(res.token); // automatski propagira stanje
        const tokenValue = res.token
        localStorage.setItem('token', tokenValue);
        const payload = JSON.parse(atob(tokenValue.split('.')[1]));
        if (payload.firstLogin) {
        this.router.navigate(['/force-change-password']);
        } else {
        this.router.navigate(['/']);
        }
        },
        error: err => {
        this.errorMessage = err?.error?.message || 'Invalid email or password.';
        }
    });
}
}