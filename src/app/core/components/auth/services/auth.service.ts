import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
} from '@angular/common/http';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { catchError, filter, first, map } from 'rxjs/operators';
import {
	API_BASE_URL,
	AccountClient,
	UserAdditionalServerAddress,
} from '../../../../../rentApi';
import { MessageService } from '../../../services/message.service';
import { TokenParams } from '../token-params.model';
import { UserService } from './user.service';

export const LIME_TOKEN = new InjectionToken<string>('LIME_TOKEN');

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	constructor(
		private _userService: UserService,
		private _router: Router,
		private _http: HttpClient,
		private _AC: AccountClient,
		private _messageService: MessageService,
		@Inject(LIME_TOKEN) limeToken: string,
		@Inject(API_BASE_URL) protected baseUrl: string
	) {
		if (limeToken) {
			this.setLimeToken(baseUrl, limeToken);
		}
	}

	public redirectUrl = '';
	public rememberMe: boolean = null;

	private _tokenAPI = '/connect/token';
	private _client_id = 'Jade.Api';

	private additionalServerAddresses: UserAdditionalServerAddress[] = [];

	public isOwner$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
		false
	);

	headersForTokenAPI = new HttpHeaders({
		'content-type': 'application/x-www-form-urlencoded',
	});

	login(
		username: string,
		password: string
	): Observable<boolean | { res: boolean; payload: any }> {
		const data = `client_id=${this._client_id}&grant_type=password&username=${username}&password=${password}`;
		return this._http
			.post(this.baseUrl + this._tokenAPI, data, {
				headers: this.headersForTokenAPI,
			})
			.pipe(
				catchError(_ =>
					this._http.post(this.baseUrl + this._tokenAPI, data, {
						headers: this.headersForTokenAPI,
					})
				)
			)
			.pipe(
				first(),
				map(res => <TokenParams>res),
				filter(res => !!res),
				map(res => {
					const token = res && res.access_token;
					if (token) {
						this.token = res;
						this._userService.getCurrentUsedData();
						this._AC.selectAdditionalServerAddresses().subscribe(addresses => {
							this.additionalServerAddresses = addresses;
							if (addresses.length != 0) {
								this.setAdditionalServerAddresses(addresses, data);
							}
						});
						return true;
					} else {
						return false;
					}
				})
			);
	}

	loginByPin(
		installationId: string,
		pin: string
	): Observable<boolean | { res: boolean; payload: any }> {
		const data = `client_id=${this._client_id}&grant_type=pin&installationId=${installationId}&pin=${pin}`;
		return this._http
			.post(this.baseUrl + this._tokenAPI, data, {
				headers: this.headersForTokenAPI,
			})
			.pipe(
				catchError(_ =>
					this._http.post(this.baseUrl + this._tokenAPI, data, {
						headers: this.headersForTokenAPI,
					})
				)
			)
			.pipe(
				first(),
				map(res => <TokenParams>res),
				filter(res => !!res),
				map(res => {
					const token = res && res.access_token;
					if (token) {
						this.token = res;
						this._userService.getCurrentUsedData();
						this._AC.selectAdditionalServerAddresses().subscribe(addresses => {
							this.additionalServerAddresses = addresses;
							if (addresses.length != 0) {
								this.setAdditionalServerAddresses(addresses, data);
							}
						});
						return true;
					} else {
						return false;
					}
				})
			);
	}

	setAdditionalServerAddresses(
		array: UserAdditionalServerAddress[],
		data: string
	) {
		let additionalServers: {
			userId: number;
			address: string;
			token: TokenParams;
		}[] = [];
		for (let serverAddress = 0; serverAddress < array.length; serverAddress++) {
			this._http
				.post(array[serverAddress].address + this._tokenAPI, data, {
					headers: this.headersForTokenAPI,
				})
				.subscribe(
					res => {
						let additionalToken = <TokenParams>res;
						const token = additionalToken && additionalToken.access_token;
						if (token) {
							additionalServers.push({
								userId: array[serverAddress].userId,
								address: array[serverAddress].address,
								token: additionalToken,
							});
						}
						if (this.rememberMe || localStorage.getItem('additionalServers')) {
							localStorage.setItem(
								'additionalServers',
								JSON.stringify(additionalServers)
							);
						} else {
							sessionStorage.setItem(
								'additionalServers',
								JSON.stringify(additionalServers)
							);
						}
					},
					err => {
						this._messageService.errorMessage(
							`${err.status} ${err.statusText}`,
							err.toString()
						);
					}
				);
		}
	}

	refreshAdditionalServerAddresses() {
		let array = [];
		if (this.rememberMe || localStorage.getItem('additionalServers'))
			array = JSON.parse(localStorage.getItem('additionalServers'));
		else array = JSON.parse(sessionStorage.getItem('additionalServers'));

		if (!!!array) array = [];

		let additionalServers: {
			userId: number;
			address: string;
			token: TokenParams;
		}[] = [];
		for (let serverAddress = 0; serverAddress < array.length; serverAddress++) {
			const data = `client_id=${this._client_id}&grant_type=refresh_token&refresh_token=${this.getTokenWithServerAddress(array[serverAddress].address).refresh_token}`;
			this._http
				.post(array[serverAddress].address + this._tokenAPI, data, {
					headers: this.headersForTokenAPI,
				})
				.subscribe(
					res => {
						let additionalToken = <TokenParams>res;
						const token = additionalToken && additionalToken.access_token;
						if (token) {
							additionalServers.push({
								userId: array[serverAddress].userId,
								address: array[serverAddress].address,
								token: additionalToken,
							});
						}
						if (this.rememberMe || localStorage.getItem('additionalServers')) {
							localStorage.setItem(
								'additionalServers',
								JSON.stringify(additionalServers)
							);
						} else {
							sessionStorage.setItem(
								'additionalServers',
								JSON.stringify(additionalServers)
							);
						}
					},
					err => {
						this._messageService.errorMessage(
							`${err.status} ${err.statusText}`,
							err.toString()
						);
					}
				);
		}
	}

	logoutInternal(queryParams): void {
		// Navigate to the login page with extras
		this._router.navigate(['/auth'], queryParams ?? {});

		this.rememberMe = null;

		this.clearStorage();
		// this._userService.destroyCurrentUser();
	}

	logout(): void {
		// это удалит старую куку авторизации
		// если она была, если не было, то и пес с ней
		this.logoutInternal(null);
	}

	accessDenied(url: string, needParams: boolean = true) {
		this.redirectUrl = url;

		this.logoutInternal(
			needParams
				? {
						queryParams: {
							accessDenied: true,
						},
					}
				: null
		);
	}

	checkLogin(): boolean {
		return !!this.getLimeToken(this.baseUrl) || !!this.token;
	}

	refreshQry = new Subject<boolean>();
	refreshInProcess = false;
	tryRefreshToken(): Observable<boolean> {
		if (this.getLimeToken(this.baseUrl)) {
			return of(true);
		}

		if (this.checkLogin()) {
			if (new Date() < new Date(this.token.expired)) {
				return of(true);
			} else {
				if (this.refreshInProcess) {
					return this.refreshQry;
				}

				this.refreshInProcess = true;
				this.refreshToken().subscribe(
					_ => {
						this.refreshInProcess = false;
						this.refreshQry.next(_);
					},
					err => (this.refreshInProcess = false),
					() => (this.refreshInProcess = false)
				);
				return this.refreshQry;
			}
		}
		return of(false);
	}

	private refreshToken(): Observable<boolean> {
		console.warn('RefreshToken in auth.service');
		const data = `client_id=${this._client_id}&grant_type=refresh_token&refresh_token=${this.token.refresh_token}`;

		return this._http
			.post(this.baseUrl + this._tokenAPI, data, {
				headers: this.headersForTokenAPI,
			})
			.pipe(
				first(),
				map(res => {
					return <TokenParams>res;
				}),

				filter(res => !!res),

				map(res => {
					const token = res && res.access_token;

					if (token) {
						this.token = res;
						this.refreshAdditionalServerAddresses();
						return true;
					} else {
						return false;
					}
				}),

				catchError((err: HttpErrorResponse) => {
					if (err.status && err.status !== 503) {
						this.clearStorage();
					}
					if (!err.status) {
						{
							this._messageService.errorMessage(
								`${err.status} ${err.statusText}`,
								err.toString()
							);
						}
					}
					this.accessDenied('/');
					return of(false);
				})
			);
	}

	getLimeToken(addr: string) {
		const key = `LimeToken:${addr}`;
		return sessionStorage.getItem(key);
	}

	setLimeToken(addr: string, token: string) {
		const key = `LimeToken:${addr}`;
		return sessionStorage.setItem(key, token);
	}

	getTokenWithServerAddress(addr: string): TokenParams {
		if (addr === this.baseUrl) return this.token;

		if (sessionStorage.getItem('additionalServers')) {
			let servers = JSON.parse(sessionStorage.getItem('additionalServers'));
			for (
				let serverNumber = 0;
				serverNumber < servers.length;
				serverNumber++
			) {
				if (servers[serverNumber].address === addr)
					return servers[serverNumber].token;
			}
		}
		if (localStorage.getItem('additionalServers')) {
			let servers = JSON.parse(localStorage.getItem('additionalServers'));
			for (
				let serverNumber = 0;
				serverNumber < servers.length;
				serverNumber++
			) {
				if (servers[serverNumber].address === addr)
					return servers[serverNumber].token;
			}
		}
		this._messageService.errorMessage('Data not received from server:' + addr);
		return null; // или вернуть значение TokenParams по умолчанию
	}

	readonly currentUserKey = 'currentUser';

	get token(): TokenParams {
		const token =
			sessionStorage.getItem(this.currentUserKey) ??
			localStorage.getItem(this.currentUserKey);

		if (token) {
			return JSON.parse(token);
		}

		return null;
	}

	set token(token: TokenParams) {
		if (!token) {
			this.clearStorage();
			return;
		}

		token.expired = new Date(new Date().getTime() + token.expires_in * 1000);

		if (this.rememberMe || localStorage.getItem(this.currentUserKey)) {
			localStorage.setItem(this.currentUserKey, JSON.stringify(token));
		} else {
			sessionStorage.setItem(this.currentUserKey, JSON.stringify(token));
		}
		this.isSystemOwner();
	}

	clearStorage() {
		sessionStorage.removeItem('currentUser');
		localStorage.removeItem('currentUser');
		sessionStorage.removeItem('additionalServers');
		localStorage.removeItem('additionalServers');
	}

	getID() {
		return this._decodeJwt().payload.sub;
	}

	isSystemOwner() {
		this.isOwner$.next(
			this.token && this._decodeJwt().payload.hasOwnProperty('SystemOwner')
		);
	}

	private _decodeJwt() {
		const token = this.token.access_token;

		const segments = token.split('.');

		if (segments.length !== 3) {
			throw new Error('Not enough or too many segments for decoding token');
		}

		// All segment should be base64
		const headerSeg = segments[0];
		const payloadSeg = segments[1];
		const signatureSeg = segments[2];

		// base64 decode and parse JSON => btoa() , atob()
		const header = JSON.parse(atob(headerSeg));
		const payload = JSON.parse(atob(payloadSeg));

		return {
			header: header,
			payload: payload,
			signature: signatureSeg,
		};
	}
}
