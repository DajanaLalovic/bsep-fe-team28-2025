import { Routes } from '@angular/router';
import { ForgotPasswordComponent } from 'src/components/forgot-password/forgot-password.component';
import { HomeComponent } from 'src/components/home/home.component';
import { LoginComponent } from 'src/components/login/login.component';
import { RegisterComponent } from 'src/components/register/register.component';
import { ResetPasswordComponent } from 'src/components/reset-password/reset-password.component';
import { SessionsComponent } from 'src/components/sessions/sessions.component';
import { AuthGuard } from 'src/utils/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent},
    { path: 'forgot-password', component: ForgotPasswordComponent , canActivate: [AuthGuard]},
    { path: 'reset-password', component: ResetPasswordComponent, canActivate: [AuthGuard] },
    {
  path: 'activate',
  loadComponent: () =>
    import("src/components/activate-account/activate-account.component")
      .then(m => m.ActivateAccountComponent) , canActivate: [AuthGuard]
},
    { path: 'sessions', component: SessionsComponent , canActivate: [AuthGuard] },
];
