import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toErrorText } from '../../shared/utils/tools';
import { MessageService } from '../services/message.service';
import { HttpErrorResponseEx } from './bloberrorhttpinterceptor';

@Injectable()
export class HttpErrorRequestInterceptor implements HttpInterceptor {
	constructor(
		private messageService: MessageService,
		private router: Router
	) {}

	intercept(
		request: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		if (!request.url.includes('/connect/')) {
			return next.handle(request).pipe(
				catchError((err: any) => {
					if (err instanceof HttpErrorResponse) {
						// if (err.status === 503) {
						// 	this.router.navigate(['503']);
						// } else if (err.status === 404) {
						// 	this.router.navigate(['404']);
						// } else
						if (err.status !== 401) {
							try {
								if (err instanceof HttpErrorResponseEx) {
									this.messageService.errorMessage(
										`${err.status} ${err.statusText}`,
										toErrorText(err.object)
									);
								} else {
									this.messageService.errorMessage(
										`${err.status} ${err.statusText}`,
										err.message
									);
								}
							} catch {
								this.messageService.errorMessage(
									`${err.status} ${err.statusText}`,
									`${err.message}`
								);
							}
						}
					}

					return throwError(err);
				})
			);
		} else {
			return next.handle(request);
		}
	}
}
