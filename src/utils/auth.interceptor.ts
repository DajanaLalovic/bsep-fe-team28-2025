import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Lista URL-ova koje NE želiš da presreće
  const excludedUrls = [
    '/auth/login',
    '/auth/register',
    '/captcha/verify',
     '/auth/forgot-password'
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

  return next(req);
};
