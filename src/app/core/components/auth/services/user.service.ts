import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
	API_BASE_URL,
	AccountClient,
	LimeToken,
	UserData,
} from '../../../../../rentApi';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	userData: any;
	userDataUpdate$ = new BehaviorSubject<UserData | null>(null);

	constructor(
		private _AC: AccountClient,
		@Optional() @Inject(API_BASE_URL) protected baseUrl?: string
	) {}

	getCurrentUsedData() {
		this._AC
			.getUserDataGET()
			.pipe(first())
			.subscribe((r: UserData) => {
				this.userDataUpdate$.next(r);
			});
	}

	getToken(): Observable<LimeToken | null> {
		return this._AC.limeTokenGET();
	}

	dropToken() {
		return this._AC.limeTokenPOST();
	}
}
