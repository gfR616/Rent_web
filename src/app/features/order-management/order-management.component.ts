import { CommonModule } from '@angular/common';
import {
	Component,
	OnDestroy,
	OnInit,
	ViewChild,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subscription, firstValueFrom, tap } from 'rxjs';
import { RentOrderDetailView } from '../../../rentApi';
import { MessageService } from '../../core/services/message.service';
import { NfcService } from '../../core/services/nfc.service';
import { LoadSpinnerComponent } from '../../shared/components/load-screen/load-spinner.component';
import { RentScanModal } from '../../shared/components/scan-modal/rent-scan-modal';
import { SearchComponent } from '../../shared/components/search/search.component';
import { OrderState, UpdatedItem } from '../../shared/models/models';
import { RentStateStore } from '../../store/rentModel';
import { CardInfoComponent } from './cardInfo/cardInfo.component';
import { ItemCardComponent } from './item-card/item-card.component';

@Component({
	standalone: true,
	selector: 'order-management',
	templateUrl: './order-management.component.html',
	styleUrl: './order-management.component.scss',
	imports: [
		LoadSpinnerComponent,
		CardInfoComponent,
		SearchComponent,
		TranslocoModule,
		MatDialogModule,
		MatButtonModule,
		CommonModule,
		MatCheckboxModule,
		MatTabsModule,
		ItemCardComponent,
		MatIconModule,
		MatExpansionModule,
	],
})
export class OrderMangamentComponent implements OnInit, OnDestroy {
	@ViewChild(SearchComponent, { static: false }) search: SearchComponent;
	protected readonly stateStore = inject(RentStateStore);
	readonly dialog = inject(MatDialog);
	orderState: WritableSignal<OrderState> = signal(
		new OrderState(signal([]), signal([]), signal([]), signal([]))
	);
	amountOfDebt: WritableSignal<number> = signal(0);
	giveAll: WritableSignal<boolean> = signal(false);
	isExpandInventory: WritableSignal<boolean> = signal(true);
	isExpandInArm: WritableSignal<boolean> = signal(true);
	isExpandIssue: WritableSignal<boolean> = signal(true);
	isExpandTake: WritableSignal<boolean> = signal(true);

	sub: Subscription;
	searchValue: WritableSignal<string> = signal('');
	constructor(
		private nfc: NfcService,
		private messageService: MessageService,
		private router: Router
	) {}

	ngOnInit(): void {
		if (!this.stateStore.state()) {
			this.stateStore.getState().subscribe({
				next: () => {
					this.updateState();
				},
			});
		}
		this.updateState();

		this.sub = this.nfc.nfcScan$.subscribe(value => this.onCodeResult(value));
	}

	ngOnDestroy(): void {
		this.sub.unsubscribe();
	}

	updateState(): void {
		const globalState = this.stateStore.state();
		const canGive = globalState?.canGive || [];
		const giving = globalState?.giving || [];
		const canTake = globalState?.canTake || [];
		const taking = globalState?.taking || [];
		if (canGive.length > 0) {
			this.orderState().canGiveItems.update(() => {
				return globalState.canGive.map(x => ({
					item: signal(x),
					counter: signal(0),
					canPay: signal(x.canPay),
				}));
			});
		} else {
			this.orderState().canGiveItems.set([]);
		}

		if (canTake.length > 0) {
			const searchedCanTake = globalState.canTake
				.map(item => {
					return globalState.details.find(
						detail => detail.id === item.orderDetailId
					);
				})
				.filter(detail => detail !== undefined);
			this.orderState().canTakeItems.set(searchedCanTake);
		} else {
			this.orderState().canTakeItems.set([]);
		}

		if (taking.length > 0) {
			const searchedTaking = globalState.taking
				.map(item => {
					return globalState.details.find(
						detail => detail.id === item.orderDetailId
					);
				})
				.filter(detail => detail !== undefined);
			this.orderState().takingItems.set(searchedTaking);
		} else {
			this.orderState().takingItems.set([]);
		}

		if (giving.length > 0) {
			const newItemsMap = new Map(
				canGive.map(item => [
					item.serviceId,
					{
						item: signal(item),
						counter: signal(0),
						canPay: signal(item.canPay),
					},
				])
			);
			const uniqueGivingItemsMap = new Map();

			globalState.giving.forEach(item => {
				if (newItemsMap.has(item.serviceId)) {
					const existingItem = newItemsMap.get(item.serviceId);
					existingItem.counter.update(counter => counter + 1);

					if (!uniqueGivingItemsMap.has(item.serviceId)) {
						uniqueGivingItemsMap.set(item.serviceId, {
							item: existingItem.item,
							counter: existingItem.counter,
						});
					}
				} else {
					uniqueGivingItemsMap.set(item.serviceId, {
						item: signal(item),
						unique: signal(true),
						counter: signal(0),
					});
				}
			});

			const canGiveItemsArray = Array.from(newItemsMap.values());
			this.orderState().canGiveItems.set(canGiveItemsArray);

			const givingItemsArray: UpdatedItem[] = Array.from(
				uniqueGivingItemsMap.values()
			);
			this.orderState().givingItems.set(givingItemsArray);
		} else {
			this.orderState().givingItems.set([]);
		}

		if (this.searchValue() !== '') {
			this.search.performSearch(this.searchValue());
		}
	}

	onSearch(e: OrderState) {
		if (!!e) {
			this.orderState.set(e);
		}
	}

	onInputValueChange(value: string) {
		this.searchValue.set(value);
	}

	onCodeResult(result: string): void {
		if (!result) return;

		this.stateStore.code(result).subscribe({
			next: x => {
				if (x?.state?.closed) {
					this.router.navigate(['/main'], { replaceUrl: true });
					this.dialog.closeAll();
				} else {
					this.dialog.closeAll();
				}
			},
			error: () => {
				this.dialog.closeAll();
			},
		});
	}

	openModal(): void {
		this.dialog.open(RentScanModal, {
			width: '100%',
			height: '100%',
			data: {
				onCodeResult: (result: string) => this.onCodeResult(result),
			},
		});
		this.dialog.afterAllClosed.subscribe(() => {
			this.updateState();
		});
	}

	async addToOrder(item: UpdatedItem): Promise<void> {
		await firstValueFrom(
			this.stateStore.addToOrder(item).pipe(
				tap(() => {
					this.search.restart();
					this.updateState();
				})
			)
		);
	}

	async removeFromOrder(
		serviceId: number,
		storageItemId: number
	): Promise<void> {
		await firstValueFrom(
			this.stateStore.removeFromOrder(serviceId, storageItemId).pipe(
				tap(() => {
					this.search.restart();
					this.updateState();
				})
			)
		);
	}

	onCancelTake(id: number) {
		if (!this.stateStore.isLoading()) {
			this.stateStore.cancelTakeItem(id).then(() => {
				this.search.restart();
				this.updateState();
			});
		}
	}

	onTake(id: number) {
		if (!this.stateStore.isLoading()) {
			this.stateStore.takeItem(id).then(() => {
				this.search.restart();
				this.updateState();
			});
		}
	}

	processOrder() {
		if (!this.stateStore.isLoading()) {
			this.search.clearSearch();
			if (
				this.orderState().takingItems().length > 0 ||
				this.orderState().givingItems().length > 0
			) {
				this.stateStore.processOrder();
			} else {
				return;
			}
		}
	}

	onExpandList(listName: WritableSignal<boolean>) {
		listName.update(x => !x);
	}

	async takeAll() {
		if (!this.stateStore.isLoading()) {
			if (
				this.orderState().givingItems().length > 0 &&
				this.stateStore.state().details.length === 0
			) {
				return;
			}

			this.search.clearSearch();

			if (this.orderState().givingItems().length > 0) {
				for (const item of this.orderState().givingItems()) {
					for (let i = 0; i < item.counter(); i++) {
						await this.removeFromOrder(
							item.item().serviceId,
							item.item().storageItemId
						);
					}
				}
			}

			if (
				this.orderState().canTakeItems().length > 0 ||
				this.orderState().takingItems().length > 0
			) {
				const details = this.stateStore
					.state()
					.details?.filter(item => this.canTakeItem(item));
				for (const detail of details) {
					if (
						this.orderState().takingItems().length === 0 ||
						!this.orderState()
							.takingItems()
							.some(item => item.id === detail.id)
					) {
						await this.stateStore.takeItem(detail.id);
					}
				}

				if (this.orderState().givingItems().length === 0) {
					this.stateStore.processOrder();
				}
			}
		}
	}

	canTakeItem(item: RentOrderDetailView) {
		const canTake = this.orderState()
			.canTakeItems()
			.some(x => x.id === item.id);
		const isTaking = this.orderState()
			.takingItems()
			.some(x => x.id === item.id);
		return canTake || isTaking;
	}

	async dropOrder() {
		if (!this.stateStore.isLoading()) {
			this.search.clearSearch();
			if (this.orderState().givingItems().length > 0) {
				for (const item of this.orderState().givingItems()) {
					for (let i = 0; i < item.counter(); i++) {
						await this.removeFromOrder(
							item.item().serviceId,
							item.item().storageItemId
						);
					}
				}
			}
			if (this.orderState().takingItems().length > 0) {
				for (const item of this.orderState().takingItems()) {
					await this.stateStore.cancelTakeItem(item.id);
				}
			}
			this.updateState();
			this.messageService.successfullMessage('Позиции заказа сброшены!');
		}
	}

	allCountsCheck() {
		if (!!this.giveAll()) {
			return this.orderState().canGiveItems().length;
		} else {
			const canPayLength = this.orderState()
				.canGiveItems()
				.filter(item => !!item.canPay());
			return canPayLength.length;
		}
	}
}
