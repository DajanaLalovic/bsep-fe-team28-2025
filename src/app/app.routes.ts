import { Routes } from '@angular/router';
import { AdminPanelComponent } from 'src/components/admin-panel/admin-panel.component';
import { ForceChangePasswordComponent } from 'src/components/force-change-password/force-change-password.component';
import { ForgotPasswordComponent } from 'src/components/forgot-password/forgot-password.component';
import { HomeComponent } from 'src/components/home/home.component';
import { LoginComponent } from 'src/components/login/login.component';
import { RegisterComponent } from 'src/components/register/register.component';
import { ResetPasswordComponent } from 'src/components/reset-password/reset-password.component';
import { SessionsComponent } from 'src/components/sessions/sessions.component';
import { AdminGuard } from 'src/utils/admin.guard';
import { AuthGuard } from 'src/utils/auth.guard';
import { FirstLoginGuard } from 'src/utils/first-login.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent},
    { path: 'forgot-password', component: ForgotPasswordComponent , canActivate: [FirstLoginGuard]},
    { path: 'reset-password', component: ResetPasswordComponent, canActivate: [FirstLoginGuard] },
    {
  path: 'activate',
  loadComponent: () =>
    import("src/components/activate-account/activate-account.component")
      .then(m => m.ActivateAccountComponent) , canActivate: [ FirstLoginGuard]
},
    { path: 'sessions', component: SessionsComponent , canActivate: [AuthGuard, FirstLoginGuard] },
    {
  path: 'admin-panel',
  component: AdminPanelComponent,
  canActivate: [AuthGuard, AdminGuard, FirstLoginGuard]
},
{ path: 'force-change-password', component: ForceChangePasswordComponent },
{
  path: 'password-manager',
  loadComponent: () =>
    import('src/components/password-create/password-create.component')
      .then(m => m.PasswordCreateComponent),
  canActivate: [AuthGuard, FirstLoginGuard] 
},{
  path: 'my-passwords',
  loadComponent: () =>
    import('src/components/password-list/password-list.component')
      .then(m => m.PasswordListComponent),
  canActivate: [AuthGuard, FirstLoginGuard]
},{
  path: 'share-my-passwords',
  loadComponent: () =>
    import('src/components/share-password/share-password.component')
      .then(m => m.SharePasswordComponent),
  canActivate: [AuthGuard, FirstLoginGuard]
}

];
