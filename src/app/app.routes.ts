import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from 'src/components/forgot-password/forgot-password.component';
import { LoginComponent } from 'src/components/login/login.component';
import { RegisterComponent } from 'src/components/register/register.component';
import { ResetPasswordComponent } from 'src/components/reset-password/reset-password.component';

export const routes: Routes = [
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent},
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
];
