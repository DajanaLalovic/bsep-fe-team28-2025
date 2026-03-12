import { Routes } from '@angular/router';
import { AdminPanelComponent } from 'src/components/admin-panel/admin-panel.component';
import { ForceChangePasswordComponent } from 'src/components/force-change-password/force-change-password.component';
import { ForgotPasswordComponent } from 'src/components/forgot-password/forgot-password.component';
import { UploadCsrComponent } from 'src/components/upload-csr/upload-csr.component';
import { HomeComponent } from 'src/components/home/home.component';
import { LoginComponent } from 'src/components/login/login.component';
import { RegisterComponent } from 'src/components/register/register.component';
import { ResetPasswordComponent } from 'src/components/reset-password/reset-password.component';
import { SessionsComponent } from 'src/components/sessions/sessions.component';
import { IssueCertificateComponent } from 'src/components/issue-certificates/issue-certificates.component';
import { MyCertificatesComponent } from 'src/components/my-certificates/my-certificates.component';
import { AdminGuard } from 'src/utils/admin.guard';
import { CaUserGuard } from 'src/utils/ca-user.guard';
import { ClientGuard } from 'src/utils/client.guard';
import { AuthGuard } from 'src/utils/auth.guard';
import { AdminOrCaGuard } from 'src/utils/admin-or-ca.guard';
import { FirstLoginGuard } from 'src/utils/first-login.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-certificates', component: MyCertificatesComponent },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [AuthGuard, FirstLoginGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard, FirstLoginGuard],
  },

  {
    path: 'activate',
    loadComponent: () =>
      import('src/components/activate-account/activate-account.component').then(
        (m) => m.ActivateAccountComponent,
      ),
    canActivate: [AuthGuard, FirstLoginGuard],
  },
  {
    path: 'upload-csr',
    component: UploadCsrComponent,
    canActivate: [AuthGuard, FirstLoginGuard, ClientGuard],
  }, //isto i ovde?
  {
    path: 'issue/root',
    component: IssueCertificateComponent,
    canActivate: [AuthGuard, FirstLoginGuard, AdminGuard],
    data: {
      certType: 'ROOT',
    },
  },
  {
    path: 'issue/intermediate',
    component: IssueCertificateComponent,
    canActivate: [AuthGuard, FirstLoginGuard, AdminOrCaGuard],
    data: {
      certType: 'INTERMEDIATE',
    },
  },
  {
    path: 'issue/ee',
    component: IssueCertificateComponent,
    canActivate: [AuthGuard, FirstLoginGuard, AdminOrCaGuard],
    data: {
      certType: 'END_ENTITY',
    },
  },

  {
    path: 'sessions',
    component: SessionsComponent,
    canActivate: [AuthGuard, FirstLoginGuard],
  },
  {
    path: 'admin-panel',
    component: AdminPanelComponent,
    canActivate: [AuthGuard, AdminGuard, FirstLoginGuard],
  },
  { path: 'force-change-password', component: ForceChangePasswordComponent },
];
