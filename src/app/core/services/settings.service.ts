import { Injectable, OnInit } from '@angular/core';
import { WritableSignal, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { BasicSettings, RentSettings } from '../../shared/models/models';

@Injectable({
	providedIn: 'root',
})
export class SettingsService {
	public basicSettings: WritableSignal<BasicSettings> = signal(
		new BasicSettings()
	);
	private settingsSubject = new BehaviorSubject<RentSettings>(
		new RentSettings()
	);
	public settings$ = this.settingsSubject.asObservable();

	private selectedInstallationId: number | null = null;
	private selectedServicePointId: number | null = null;
	private defaultLanguage: string = 'ru';
	private selectedLanguage: string = '';
	private hash: string | null = null;

	constructor(private translocoService: TranslocoService) {
		this.checkSettings();
		this.checkHash();
		this.checkLang();
	}

	checkSettings(): Observable<BasicSettings> {
		this.selectedInstallationId = this.getFromLocalStorage(
			'selectedInstallationId'
		);
		this.selectedServicePointId = this.getFromLocalStorage(
			'selectedServicePointId'
		);

		this.updateBasicSettings();
		return of(this.basicSettings());
	}

	checkLang() {
		const currentLang = this.getLang();
		console.log('currentLang::: ', currentLang);
		this.translocoService.setActiveLang(currentLang);
	}

	getLang(): string {
		this.selectedLanguage = localStorage.getItem('rentLang');
		if (
			this.selectedLanguage === '' ||
			this.selectedLanguage === this.defaultLanguage ||
			!this.selectedLanguage
		) {
			return this.defaultLanguage;
		}
		return this.selectedLanguage;
	}

	setLang(lang: string) {
		localStorage.setItem('rentLang', lang);
		this.translocoService.setActiveLang(lang);
		this.selectedLanguage = '';
	}

	checkHash(): void {
		if (!localStorage.getItem('rentHash')) {
			this.hash = null;
			return;
		}
		this.hash = localStorage.getItem('rentHash');
	}

	dropSettings(): void {
		this.clearLocalStorage('selectedInstallationId');
		this.clearLocalStorage('selectedServicePointId');
		this.selectedInstallationId = null;
		this.selectedServicePointId = null;
		this.setLang(this.defaultLanguage);

		this.updateBasicSettings();

		this.settingsSubject.next(new RentSettings());
	}

	changeInstallationId(installationId: number | null): void {
		if (installationId !== null) {
			this.saveToLocalStorage('selectedInstallationId', installationId);
			this.selectedInstallationId = installationId;
		} else {
			this.clearLocalStorage('selectedInstallationId');
			this.selectedInstallationId = null;
		}
		this.updateBasicSettings();
	}

	changeServicePointId(servicePointId: number | null): void {
		if (servicePointId !== null) {
			this.saveToLocalStorage('selectedServicePointId', servicePointId);
			this.selectedServicePointId = servicePointId;
		} else {
			this.clearLocalStorage('selectedServicePointId');
			this.selectedServicePointId = null;
		}
		this.updateBasicSettings();
	}

	changeHash(hash: string | null | undefined): void {
		if (!!hash) {
			this.saveToLocalStorage('rentHash', hash);
			this.hash = hash;
		} else {
			this.clearLocalStorage('rentHash');
			this.hash = null;
		}
	}

	getSelectedInstallationId(): number | null {
		return this.selectedInstallationId;
	}

	getSelectedServicePointId(): number | null {
		return this.selectedServicePointId;
	}

	getIsSettingsSet(): boolean {
		const settings = this.basicSettings();
		return settings.isSettingsSet;
	}

	getHash(): string | null {
		return this.hash;
	}

	private updateBasicSettings(): void {
		const isSettingsSet =
			this.selectedInstallationId !== null &&
			this.selectedServicePointId !== null;

		this.basicSettings.update(settings => {
			settings.selectedInstallationId = this.selectedInstallationId;
			settings.selectedServicePointId = this.selectedServicePointId;
			settings.isSettingsSet = isSettingsSet;
			return settings;
		});
	}

	private getFromLocalStorage(key: string): number | null {
		const value = localStorage.getItem(key);
		return value ? Number(value) : null;
	}

	private saveToLocalStorage(key: string, value: number | string): void {
		localStorage.setItem(key, String(value));
	}

	private clearLocalStorage(key: string): void {
		localStorage.removeItem(key);
	}
}
