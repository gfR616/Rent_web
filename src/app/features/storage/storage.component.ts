import { CommonModule } from '@angular/common';
import {
	Component,
	ElementRef,
	OnInit,
	ViewChild,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import {
	ServicePoint,
	ServicePointsClient,
	StoragesClient,
} from '../../../rentApi';
import { MessageService } from '../../core/services/message.service';
import { SettingsService } from '../../core/services/settings.service';
import { LoadSpinnerComponent } from '../../shared/components/load-screen/load-spinner.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { RentStorages, StorageMovingViewExt } from '../../shared/models/models';
import { calculateQuantities } from '../../shared/utils/tools';
import { RentStateStore } from '../../store/rentModel';

@Component({
	selector: 'app-storage',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		SearchComponent,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		LoadSpinnerComponent,
		TranslocoModule,
	],
	templateUrl: './storage.component.html',
	styleUrl: './storage.component.scss',
})
export class StorageComponent implements OnInit {
	@ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
	@ViewChild(SearchComponent, { static: false }) search!: SearchComponent;
	protected readonly stateStore = inject(RentStateStore);
	searchValue: WritableSignal<string> = signal('');
	selectedItems: WritableSignal<string[]> = signal([]);
	searchIsOpen: WritableSignal<boolean> = signal(false);
	storageData: WritableSignal<RentStorages> = signal(
		new RentStorages(null, null, null)
	);
	selectedServicePoint: WritableSignal<ServicePoint> = signal(null);
	isLoading: WritableSignal<boolean> = signal(false);

	constructor(
		private servicePointsClient: ServicePointsClient,
		private settingsService: SettingsService,
		private storagesClient: StoragesClient,
		private messageService: MessageService
	) {}
	ngOnInit(): void {
		this.getDataForStorage();
	}

	getDataForStorage() {
		this.isLoading.set(true);
		this.servicePointsClient
			.selectGET(this.settingsService.getSelectedServicePointId())
			.pipe(
				switchMap(res => {
					this.selectedServicePoint.set(res);
					return forkJoin([
						this.storagesClient.quantities(res.clientStorageId),
						this.storagesClient.quantities(res.organizationStorageId),
					]);
				}),
				tap(([clientStorage, organizationStorage]) => {
					if (clientStorage && organizationStorage) {
						const clientStorageValues = Object.values(clientStorage);
						const organizationStorageValues =
							Object.values(organizationStorage);

						const [updatedClientStorage, updatedOrganizationStorage] =
							calculateQuantities(
								clientStorageValues,
								organizationStorageValues
							);

						const storageData = {
							clientStorage: updatedClientStorage,
							organizationStorage: updatedOrganizationStorage,
							searchStorageData: updatedOrganizationStorage,
						};
						this.storageData.set(storageData);
					}
				}),
				catchError(x => {
					this.messageService.errorMessage(x);
					return of(null);
				})
			)
			.subscribe(() => {
				this.isLoading.set(false);
			});
	}

	toggleSearchIsOpen() {
		this.searchIsOpen.update(() => !this.searchIsOpen());
		if (!!this.searchIsOpen()) {
			this.scrollAnimation();
		}
	}

	scrollAnimation() {
		const targetPosition = 0;
		const startPosition = this.scrollContainer.nativeElement.scrollTop;
		const duration = 500;
		const startTime = performance.now();

		const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

		const step = (currentTime: number) => {
			const progress = Math.min((currentTime - startTime) / duration, 1);
			const scrollToPosition =
				startPosition + (targetPosition - startPosition) * easeOut(progress);

			this.scrollContainer.nativeElement.scrollTo(0, scrollToPosition);

			if (progress < 1) requestAnimationFrame(step);
		};

		requestAnimationFrame(step);
	}

	handleAddCategories(category: StorageMovingViewExt[]) {
		this.storageData.update(x => {
			x.organizationStorage = category;
			return x;
		});
	}

	clearSelectedItems() {
		this.selectedItems.set([]);
	}

	onClearSearch() {
		if (!!this.search) {
			this.search.clearSearch();
		}
	}
}
