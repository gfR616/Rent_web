import { CommonModule } from '@angular/common';
import {
	Component,
	OnInit,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
	CardPledgeRequest,
	GoodTypeKind,
	RentOrderClient,
	RentPledge,
	RentPledgeTypeView,
	RentPledgeTypesClient,
	RightView,
} from '../../../../rentApi';
import { MessageService } from '../../../core/services/message.service';
import { IRightViewModel, PledgeData } from '../../../shared/models/models';
import { RentStateStore } from '../../../store/rentModel';

@Component({
	selector: 'rent-card-info',
	templateUrl: './cardInfo.component.html',
	styleUrls: ['./cardInfo.component.scss'],
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatDividerModule,
		MatInputModule,
		MatButtonModule,
		ReactiveFormsModule,
		MatExpansionModule,
		TranslocoModule,
		MatIconModule,
	],
})
export class CardInfoComponent implements OnInit {
	protected readonly stateStore = inject(RentStateStore);
	pledge: WritableSignal<PledgeData> = signal(null);
	tickets: WritableSignal<IRightViewModel[]> = signal([]);
	rigths: WritableSignal<IRightViewModel[]> = signal([]);
	isLoading: WritableSignal<boolean> = signal(false);
	isCardInfoOpened: WritableSignal<boolean> = signal(false);

	constructor(
		private rentOrderClient: RentOrderClient,
		private rentPledgeTypesClient: RentPledgeTypesClient,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		if (this.stateStore.state().order) {
			this.isLoading.set(true);
			this.getPLedge(
				this.stateStore.state().order.installationId,
				this.stateStore.state().order.cardId
			).subscribe(x => this.pledge.set(x));
			this.tickets.set(
				this.stateStore
					.state()
					.rights.filter((r: RightView) => r.type.kind !== GoodTypeKind.Account)
					.filter(
						(r: RightView) =>
							r.leftAmount !== 0 &&
							(!r.right.to || new Date(r.right.to) > new Date())
					)
					.map((r: RightView) => new IRightViewModel(r, null))
			);

			this.rigths.set(
				this.stateStore
					.state()
					.rights.filter((r: RightView) => r.type.kind === GoodTypeKind.Account)
					.filter((r: RightView) => {
						return !r.right.to || new Date(r.right.to) > new Date();
					})
					.map((r: RightView) => new IRightViewModel(r, null))
			);

			this.isLoading.set(false);
		}
	}

	onOpenCardInfo() {
		this.isCardInfoOpened.update(x => !x);
	}

	getPLedge(installationId: number, cardId: number): Observable<PledgeData> {
		return this.rentOrderClient
			.pledgeOnCard({
				installationId: installationId,
				cardId: cardId,
			} as CardPledgeRequest)
			.pipe(
				switchMap((pledgeData: RentPledge | null) => {
					if (!!pledgeData) {
						return this.rentPledgeTypesClient
							.selectGET(pledgeData.pledgeTypeId)
							.pipe(
								map((pledgeType: RentPledgeTypeView) => {
									return {
										pledge: pledgeData,
										pledgeTypeName: pledgeType.name,
									} as PledgeData;
								}),
								catchError(error => {
									this.messageService.errorMessage(error);
									return of({
										pledge: null,
										pledgeTypeName: null,
									} as PledgeData);
								})
							);
					} else {
						return of({ pledge: null, pledgeTypeName: null } as PledgeData);
					}
				}),
				catchError(error => {
					this.messageService.errorMessage(error);
					return of({ pledge: null, pledgeTypeName: null } as PledgeData);
				})
			);
	}
}
