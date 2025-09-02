import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
	Observable,
	Subscription,
	catchError,
	forkJoin,
	of,
	switchMap,
	tap,
} from 'rxjs';
import { environmentConfig } from '../../../environments/environments.dev';
import { availableLangs } from '../../../langs-config';
import {
	InstallationView,
	InstallationsClient,
	InstallationsSelectRequest,
	InstallationsSelectResponce,
	ServicePointView,
	ServicePointsClient,
	ServicePointsSelectRequest,
	ServicePointsSelectResponce,
} from '../../../rentApi';
import { NavPanelComponent } from '../../core/layouts/nav-panel/nav-pannel.component';
import { MessageService } from '../../core/services/message.service';
import { SettingsService } from '../../core/services/settings.service';
import { LoadSpinnerComponent } from '../../shared/components/load-screen/load-spinner.component';
import { BasicSettings, RentSettings } from '../../shared/models/models';

@Component({
	selector: 'rent-settings',
	standalone: true,
	imports: [
		NavPanelComponent,
		MatButtonModule,
		MatExpansionModule,
		MatFormFieldModule,
		FormsModule,
		ReactiveFormsModule,
		MatDividerModule,
		MatListModule,
		MatCheckboxModule,
		CommonModule,
		LoadSpinnerComponent,
		TranslocoModule,
	],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, OnDestroy {
	form: FormGroup;
	installationControl = new FormControl();
	servicePointControl = new FormControl();
	isLoading: WritableSignal<boolean> = signal(false);
	version: WritableSignal<string> = signal(environmentConfig.version);
	settings: WritableSignal<RentSettings> = signal(new RentSettings());
	basicSettings: WritableSignal<BasicSettings> = signal(new BasicSettings());
	settings$: Observable<RentSettings>;
	private subscription: Subscription;
	langs = availableLangs;
	selectedLang: string = '';
	constructor(
		private messageService: MessageService,
		private transloco: TranslocoService,
		private router: Router,
		private settingsService: SettingsService,
		private installtionsClient: InstallationsClient,
		private servicePointsClient: ServicePointsClient
	) {
		this.langs = availableLangs;
		this.form = new FormGroup({
			installation: this.installationControl,
			servicePoint: this.servicePointControl,
		});
	}
	ngOnInit(): void {
		this.selectedLang = this.settingsService.getLang();
		this.isLoading.set(true);

		this.settings$ = this.settingsService.settings$;
		this.subscription = this.settings$.subscribe(settings => {
			this.settings.set(settings);
			this.loadInitialSettings();
		});
	}

	setLanguage(langCode: string): void {
		// if (langCode === this.selectedLang) return;
		this.settingsService.setLang(langCode);
	}

	private loadInitialSettings(): void {
		this.settingsService.checkSettings().subscribe(res => {
			if (!!res.isSettingsSet === true) {
				this.settings.update(p => {
					this.basicSettings.set(res);
					p.basicSettings = this.basicSettings();
					return p;
				});

				this.getSettingsData().subscribe({
					next: x => {
						if (x) {
							this.isLoading.set(false);
						}
					},
					error: () => {
						this.isLoading.set(false);
					},
				});
			} else {
				const lang = this.transloco.getActiveLang();
				this.transloco.load(lang).subscribe(() => {
					this.messageService.errorMessage(
						this.transloco.translate('messages.notSet'),
						this.transloco.translate('messages.setStartSettings')
					);

					this.getSettingsData().subscribe(() => {
						this.isLoading.set(false);
					});
				});
			}
		});
	}
	ngOnDestroy(): void {
		if (this.subscription) {
			this.subscription.unsubscribe();
		}
	}

	selectInstallation(event: InstallationView): void {
		if (event === this.settings().selectedInstallation) return;
		this.settings.update(x => {
			this.basicSettings.update(x => {
				x.selectedServicePointId = null;
				x.selectedInstallationId = event.id;
				x.isSettingsSet = false;
				return x;
			});
			x.selectedInstallation = event;
			x.basicSettings = this.basicSettings();
			return x;
		});
		this.settingsService.changeServicePointId(null);
		this.settingsService.changeInstallationId(event.id);
		if (
			this.settings().basicSettings.selectedServicePointId === null ||
			!this.settings().basicSettings.selectedServicePointId
		) {
			this.getSettingsData().subscribe();
		}
	}

	selectServicePoint(event: ServicePointView): void {
		if (event === this.settings().selectedServicePoint) return;

		this.settings.update(settings => {
			settings.selectedServicePoint = event;
			return settings;
		});
		this.settingsService.changeServicePointId(event.id);
		this.settingsService.checkSettings().subscribe(updatedSettings => {
			this.basicSettings.set(updatedSettings);
			this.settings.update(settings => {
				settings.basicSettings = updatedSettings;
				return settings;
			});
		});
	}

	saveSettings(): void {
		if (!!this.settingsService.getIsSettingsSet()) {
			this.messageService.successfullMessage(
				this.transloco.translate('messages.success'),
				this.transloco.translate('messages.settingsSaved'),
				this.transloco.translate('messages.ok')
			);
			this.router.navigate(['main'], { replaceUrl: true });
		}
		//  else {
		// 	this.messageService.errorMessage(
		// 		this.transloco.translate('messages.notSet'),
		// 		this.transloco.translate('messages.setStartSettings')
		// 	);
		// }
	}

	getSettingsData(): Observable<
		| InstallationsSelectResponce
		| [InstallationsSelectResponce, ServicePointsSelectResponce]
	> {
		return this.installtionsClient
			.selectPOST({
				filter: {
					canWrite: false,
					search: null,
					id: null,
				},
				page: {
					skip: 0,
					take: 100,
				},
			} as InstallationsSelectRequest)
			.pipe(
				tap(response => {
					this.settings.update(x => {
						x.installations = response.data;
						return x;
					});
				}),
				switchMap(response => {
					if (!!this.settingsService.getSelectedInstallationId()) {
						const installation = response.data.find(
							x => x.id === this.settingsService.getSelectedInstallationId()
						);
						this.settings.update(x => {
							x.selectedInstallation = installation;
							return x;
						});

						return forkJoin([
							of(response),
							this.servicePointsClient.selectPOST({
								filter: {
									installationId:
										this.settingsService.getSelectedInstallationId(),
									canWrite: false,
								},
								page: {
									skip: 0,
									take: 100,
								},
							} as ServicePointsSelectRequest),
						]);
					}
					return forkJoin([of(response), of(null)]);
				}),
				tap(([installationsResponse, servicePointsResponse]) => {
					if (servicePointsResponse) {
						const rentServicePoints = servicePointsResponse.data.filter(
							x => x.type == 2
						);
						this.settings.update(x => {
							x.servicePoints = rentServicePoints;
							return x;
						});

						if (this.settingsService.getSelectedServicePointId()) {
							this.settings.update(x => {
								x.selectedServicePoint = x.servicePoints.find(
									x => x.id === this.settingsService.getSelectedServicePointId()
								);
								return x;
							});
						}
					}
				}),
				catchError(() => {
					return of(null);
				})
			);
	}
}
