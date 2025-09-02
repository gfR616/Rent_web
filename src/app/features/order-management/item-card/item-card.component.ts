import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IRentOrderDetailView } from '../../../../rentApi';
import { UpdatedItem } from '../../../shared/models/models';
import { RentStateStore } from '../../../store/rentModel';

@Component({
	standalone: true,
	selector: 'rent-item-card',
	templateUrl: './item-card.component.html',
	styleUrl: './item-card.component.scss',
	imports: [MatButtonModule, MatIconModule, CommonModule],
})
export class ItemCardComponent {
	protected readonly stateStore = inject(RentStateStore);
	@Input() giveAll: boolean;
	@Input() canGive: UpdatedItem = null;
	@Input() giving: UpdatedItem = null;
	@Input() taking: IRentOrderDetailView = null;
	@Input() canTake: IRentOrderDetailView = null;

	@Output() add = new EventEmitter<UpdatedItem>();
	@Output() remove = new EventEmitter<UpdatedItem>();
	@Output() update = new EventEmitter();
	@Output() take = new EventEmitter<number>();
	@Output() cancelTake = new EventEmitter<number>();

	canShowDetail(item: UpdatedItem) {
		if (!!this.giveAll) {
			return true;
		}
		if (!this.giveAll && item.canPay()) {
			return true;
		}
		return false;
	}

	onAdd(item: UpdatedItem) {
		if (!this.stateStore.isLoading()) {
			item.counter.update(x => x + 1);
			item.item().count--;
			this.add.emit(item);
		}
	}

	onRemove(item: UpdatedItem) {
		if (!this.stateStore.isLoading()) {
			item.counter.update(x => x - 1);
			item.item().count++;
			this.remove.emit(item);
		}
	}
}
