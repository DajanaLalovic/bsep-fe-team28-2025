import { Routes } from '@angular/router';
import { LoginComponent } from 'src/components/login/login.component';
import { RegisterComponent } from 'src/components/register/register.component';

export const routes: Routes = [
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent}
];
