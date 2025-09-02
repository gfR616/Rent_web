import {
	HttpErrorResponse,
	HttpEvent,
	HttpHandler,
	HttpHeaders,
	HttpInterceptor,
	HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class BlobErrorHttpInterceptor implements HttpInterceptor {
	public intercept(
		req: HttpRequest<any>,
		next: HttpHandler
	): Observable<HttpEvent<any>> {
		return next.handle(req).pipe(
			catchError(err => {
				if (
					err instanceof HttpErrorResponse &&
					err.error instanceof Blob &&
					err.error.type === 'application/json'
				) {
					const nr = new Promise<any>((resolve, reject) => {
						let reader = new FileReader();
						reader.onload = (e: Event) => {
							try {
								const errmsg = JSON.parse((<any>e.target).result);
								const wrapped = new HttpErrorResponseEx({
									error: err.error,
									headers: err.headers,
									status: err.status,
									statusText: err.statusText,
									url: err.url,
									object: errmsg,
								});
								reject(wrapped);
							} catch (e) {
								reject(err);
							}
						};
						reader.onerror = e => {
							reject(err);
						};
						reader.readAsText(err.error);
					});
					return from(nr);
				}
				return throwError(err);
			})
		);
	}
}

export class HttpErrorResponseEx extends HttpErrorResponse {
	object: object;
	constructor(init: {
		error?: any;
		headers?: HttpHeaders;
		status?: number;
		statusText?: string;
		url?: string;
		object: object;
	}) {
		super(init);
		this.object = init.object;
	}
}
