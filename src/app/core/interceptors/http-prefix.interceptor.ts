import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const httpPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  // Leave absolute URLs alone
  if (/^https?:\/\//i.test(req.url)) return next(req);

  const normalized = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${environment.apiBaseUrl}${normalized}` }));
};
