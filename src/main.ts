import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';  // <-- OVO
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './utils/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient( withInterceptors([authInterceptor]))  
  ]
}).catch(err => console.error(err));
