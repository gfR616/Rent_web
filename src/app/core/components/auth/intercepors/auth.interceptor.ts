import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../../rentApi';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	private authService: AuthService;
	private baseUrl: string;
	constructor(
		private _authService: AuthService,
		@Inject(API_BASE_URL) private originUrl?: string
	) {
		this.baseUrl = originUrl;
		this.authService = _authService;
	}
	intercept(
		req: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		let url: URL;

		try {
			if (req.url.startsWith('http')) {
				url = new URL(req.url);
			} else {
				url = new URL(req.url, this.baseUrl);
			}
		} catch (error) {
			console.error('Invalid URL:', req.url, error);
			return throwError(error);
		}
		if (
			!url.pathname.startsWith('/connect/') &&
			!url.pathname.startsWith('/api/About/AboutGet') &&
			!url.pathname.startsWith('/api/Shop') &&
			url.pathname.startsWith('/api/')
		) {
			return this.authService.tryRefreshToken().pipe(
				take(1),
				switchMap(refreshed => {
					const host = url.origin;
					const limeToken = this.authService.getLimeToken(host);
					const currentToken = limeToken
						? limeToken
						: this.authService.getTokenWithServerAddress(host)?.access_token;
					if (currentToken && refreshed) {
						this.authService.isSystemOwner();
						const clonedRequest = req.clone({
							headers: req.headers.append(
								'Authorization',
								!!limeToken
									? `LimeToken ${limeToken}`
									: `Bearer ${currentToken}`
							),
						});
						return next.handle(clonedRequest).pipe(
							catchError((err: any) => {
								if (req.url.indexOf(this.baseUrl) === -1)
									return throwError(err);
								this.checkIf401(err);
								return throwError(err);
							})
						);
					}
					return next.handle(req).pipe(
						catchError((err: any) => {
							if (req.url.indexOf(this.baseUrl) === -1) return throwError(err);
							this.checkIf401(err);
							return throwError(err);
						})
					);
				})
			);
		}
		return next.handle(req).pipe(
			catchError((err: any) => {
				if (req.url.indexOf(this.baseUrl) === -1) return throwError(err);
				this.checkIf401(err);
				return throwError(err);
			})
		);
	}
	checkIf401(err: any) {
		if (err instanceof HttpErrorResponse) {
			if (err.status === 401) {
				this.authService.accessDenied('/');
			}
		}
	}
}
