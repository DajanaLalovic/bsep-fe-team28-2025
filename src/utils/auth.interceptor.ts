import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
const router = inject(Router);
  // Lista URL-ova koje NE želiš da presreće
  const excludedUrls = [
    '/auth/login',
    '/auth/register',
    '/captcha/verify',
     '/auth/forgot-password',
     'auth/activate'
  ];

  // Ako URL sadrži neki od excluded → preskoči interceptor
  if (excludedUrls.some(url => req.url.includes(url))) {
    return next(req);
  }

  console.log('INTERCEPTOR RADI', token);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

 // return next(req);
 

  // return next(req).pipe(
  //   catchError(err => {
  //     if (err.status === 401 || err.status === 403) {
  //       // Token je nevalidan → obriši i logout
  //       localStorage.removeItem('token');
  //       router.navigate(['/login']);
  //     }
  //     return throwError(() => err);
  //   })
  // );
   return next(req).pipe(
    catchError(err => {
      // Logout samo ako backend signalizira TOKEN_REVOKED
      if ((err.status === 401 || err.status === 403) && err.error?.code === 'TOKEN_REVOKED') {
        console.log('Token revoked, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('_grecaptcha');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
