import { WritableSignal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import {
	CancelGiveRentOrderCommand,
	CancelTakeRentOrderCommand,
	CodeRentOrderCommand,
	GetRentOrderCommand,
	GiveRentOrderCommand,
	OpenRentOrderCommand,
	ProcessRentOrderCommand,
	RentOrderClient,
	RentOrderCommand,
	RentOrderCommandResponse,
	RentOrderState,
	TakeRentOrderCommand,
} from '../../rentApi';
import { MessageService } from '../core/services/message.service';
import { SettingsService } from '../core/services/settings.service';
import { UpdatedItem } from '../shared/models/models';

export interface IissueModel {}

export class RentModel {
	hash: string | null = null;
	state: RentOrderState | null = null;
	isLoading: boolean = false;

	constructor(
		hash: string | null = null,
		state: RentOrderState | null = null,
		isLoading: boolean = false
	) {
		this.hash = hash;
		this.state = state;
		this.isLoading = isLoading;
	}
}

export const RentStateStore = signalStore(
	{ providedIn: 'root' },
	withState(new RentModel()),

	withMethods(
		(
			store,
			messageService = inject(MessageService),
			rentOrderClient = inject(RentOrderClient),
			settingsService = inject(SettingsService),
			transloco = inject(TranslocoService),
			router = inject(Router)
		) => ({
			execute({
				command,
			}: {
				command: RentOrderCommand;
			}): Observable<RentOrderCommandResponse> {
				patchState(store, { isLoading: true });
				return rentOrderClient.execute(command).pipe(
					tap(x => {
						const messages = [];
						const qrMessage = [];
						if (!!x.state.payOrderUrl && x.state.payOrderUrl !== '') {
							const url = new URL(x.state.payOrderUrl);
							const refillAmount = url.searchParams.get('refillAmount');
							qrMessage.push({
								type: 'qr',
								payUrl: `${url}`,
								items: refillAmount,
							});
						}
						if (!!x.state.closed) {
							const taking = store.state().taking || [];
							const giving = store.state().giving || [];
							const details = store.state().details || [];
							const canGive = store.state().canGive || [];

							if (taking.length > 0) {
								const matchCountsTaking = taking.reduce(
									(acc, item) => {
										const detail = details.find(
											d => d.id === item.orderDetailId
										);
										if (detail) {
											acc[detail.serviceName] =
												(acc[detail.serviceName] || 0) + 1;
										}
										return acc;
									},
									{} as Record<string, number>
								);
								const messageTaking = [];
								Object.entries(matchCountsTaking).forEach(([name, count]) => {
									messageTaking.push({ name, count });
								});
								messages.push({ type: 'taking', items: messageTaking });
							}

							if (giving.length > 0) {
								const matchCountsGiving = giving.reduce(
									(acc, item) => {
										const detail = canGive.find(
											d =>
												d.serviceId === item.serviceId &&
												d.storageItemId === item.storageItemId
										);
										if (detail) {
											acc[detail.text] = (acc[detail.text] || 0) + 1;
										}
										return acc;
									},
									{} as Record<string, number>
								);
								const messageGiving = [];
								Object.entries(matchCountsGiving).forEach(([name, count]) => {
									messageGiving.push({ name, count });
								});
								messages.push({ type: 'giving', items: messageGiving });
							}
							if (qrMessage.length > 0) {
								messageService.paymentMessage(
									'',
									qrMessage[0].payUrl,
									qrMessage[0].items
								);
							}
							if (messages.length > 0) {
								messageService.issueMessage(
									transloco.translate('messages.success'),
									'',
									messages
								);
							}
						}

						settingsService.changeHash(x.hash);
						patchState(store, { hash: x.hash, state: x.state });
					}),
					catchError(error => {
						if (!store.hash()) {
							router.navigate(['/main']);
						}
						return throwError(() => error);
					}),
					finalize(() => {
						patchState(store, { isLoading: false });
					})
				);
			},

			processOrder(): Observable<RentOrderCommandResponse> {
				const process: WritableSignal<ProcessRentOrderCommand> = signal(
					new ProcessRentOrderCommand()
				);
				process.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					return x;
				});

				return this.execute({ command: process() }).toPromise();
			},

			openOrder(scannedCode: string): Observable<RentOrderCommandResponse> {
				const open: WritableSignal<OpenRentOrderCommand> = signal(
					new OpenRentOrderCommand()
				);
				open.update(x => {
					x.code = scannedCode;
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					return x;
				});

				return this.execute({ command: open() });
			},

			addToOrder(item: UpdatedItem): Observable<RentOrderCommandResponse> {
				const give: WritableSignal<GiveRentOrderCommand> = signal(
					new GiveRentOrderCommand()
				);

				give.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.serviceId = item.item().serviceId;
					x.storageItemId = item.item().storageItemId;
					return x;
				});

				return this.execute({ command: give() });
			},

			removeFromOrder(
				serviceId: number,
				storageItemId: number
			): Observable<RentOrderCommandResponse> {
				const cancelGive: WritableSignal<CancelGiveRentOrderCommand> = signal(
					new CancelGiveRentOrderCommand()
				);

				cancelGive.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.serviceId = serviceId;
					x.storageItemId = storageItemId;
					return x;
				});

				return this.execute({ command: cancelGive() });
			},

			takeItem(orderDetailId: number): Promise<RentOrderCommandResponse> {
				const take: WritableSignal<TakeRentOrderCommand> = signal(
					new TakeRentOrderCommand()
				);

				take.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.orderDetailId = orderDetailId;
					return x;
				});

				return this.execute({ command: take() }).toPromise();
			},

			cancelTakeItem(orderDetailId: number): Promise<RentOrderCommandResponse> {
				const cancelTake: WritableSignal<TakeRentOrderCommand> = signal(
					new CancelTakeRentOrderCommand()
				);

				cancelTake.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.orderDetailId = orderDetailId;
					return x;
				});

				return this.execute({ command: cancelTake() }).toPromise();
			},

			code(scannedcode: string): Observable<RentOrderCommandResponse> {
				const code: WritableSignal<CodeRentOrderCommand> = signal(
					new CodeRentOrderCommand()
				);
				code.update(x => {
					x.hash = settingsService.getHash();
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.code = scannedcode;
					return x;
				});

				return this.execute({ command: code() });
			},

			getState(): Observable<RentOrderCommandResponse> {
				const getCurrentState: WritableSignal<GetRentOrderCommand> = signal(
					new GetRentOrderCommand()
				);
				getCurrentState.update(x => {
					x.installationId = settingsService.getSelectedInstallationId();
					x.servicePointId = settingsService.getSelectedServicePointId();
					x.hash = settingsService.getHash();
					return x;
				});

				return this.execute({ command: getCurrentState() });
			},
		})
	)
);
