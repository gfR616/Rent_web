import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	Router,
	RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../components/auth/services/auth.service';

@Injectable()
export class AuthGuard {
	constructor(
		private _authService: AuthService,
		private router: Router
	) {}

	url: string = '';

	canActivate(
		next: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean> | Promise<boolean> | boolean {
		this.url = state.url;
		return this.checkLogin();
	}

	checkLogin(): Observable<boolean> {
		if (this._authService.checkLogin()) {
			return this._authService.tryRefreshToken();
		}
		this._authService.accessDenied(this.url, this.url !== '');
		return of(false);
	}
}
