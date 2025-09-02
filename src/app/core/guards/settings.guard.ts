import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { SettingsService } from '../services/settings.service';

@Injectable({
	providedIn: 'root',
})
export class SettingsGuard implements CanActivate {
	constructor(
		private settingsService: SettingsService,
		private router: Router
	) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): boolean | Observable<boolean> {
		if (!this.settingsService.getIsSettingsSet()) {
			this.router.navigate(['settings'], { replaceUrl: true });
		}
		return this.settingsService.getIsSettingsSet();
	}
}
