import { CommonModule } from '@angular/common';
import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
	WritableSignal,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, debounceTime } from 'rxjs';
import {
	OrderState,
	StorageMovingViewExt,
	UpdatedItem,
} from '../../models/models';

@Component({
	selector: 'rent-search',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatExpansionModule,
		MatListModule,
		MatIconModule,
		TranslocoModule,
	],
	templateUrl: './search.component.html',
	styleUrl: './search.component.scss',
})
export class SearchComponent implements OnInit {
	//общее
	searchValue: WritableSignal<string> = signal('');
	@Input() searchDataSource: any;
	@Output() searchResult = new EventEmitter();
	@ViewChild('input') input: ElementRef;
	searchSubject = new Subject<string>();
	//для заказа
	@Output() openModal = new EventEmitter();
	@Output() dropSearch = new EventEmitter();
	@Output() inputValue = new EventEmitter<string>();
	//для склада
	@Input() storage: boolean = false;
	@Input() isFocused: boolean;
	@Input() searchStorageData: StorageMovingViewExt[];
	allItems: WritableSignal<any> = signal([]);
	expansionPanelOpen: WritableSignal<boolean> = signal(false);
	selectedCategories: WritableSignal<UpdatedItem[]> = signal([]);

	constructor(private cdr: ChangeDetectorRef) {}

	ngOnInit(): void {
		this.allItems.set(this.searchDataSource);
		this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
			this.performSearch(value);
		});
	}

	ngAfterViewInit() {
		if (this.isFocused) {
			this.input.nativeElement.focus();
			this.cdr.detectChanges();
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if (!!this.storage) {
			if (
				changes['searchDataSource'] &&
				changes['searchDataSource'].currentValue
			) {
				this.allItems.set(changes['searchDataSource'].currentValue);
			}
		}
	}

	restart() {
		this.allItems.set(this.searchDataSource);
	}

	performSearch(value?: string): void {
		if (value === '') {
			this.inputValue.emit('');
			this.dropSearch.emit();
			return;
		}
		if (!!this.storage) {
			this.searchDataSource = this.allItems().filter(i =>
				i.storageItemName?.toLowerCase().startsWith(value)
			);

			this.expansionPanelOpen.set(true);
			this.searchResult.emit(this.searchDataSource);
			return;
		}

		let filteredOrderItems = signal(
			new OrderState(signal([]), signal([]), signal([]), signal([]))
		);

		if (this.allItems().canGiveItems().length > 0) {
			const filteredCanGive = this.allItems()
				.canGiveItems()
				.filter(i => i.item().text?.toLowerCase().startsWith(value));
			filteredOrderItems().canGiveItems.set(filteredCanGive);
		}

		if (this.allItems().givingItems().length > 0) {
			const filteredGiving = this.allItems()
				.givingItems()
				.filter(i => i.item().text?.toLowerCase().startsWith(value));
			filteredOrderItems().givingItems.set(filteredGiving);
		}

		if (this.allItems().canTakeItems().length > 0) {
			const filteredCanTake = this.allItems()
				.canTakeItems()
				.filter(i =>
					!!i.storageItemName
						? i.storageItemName?.toLowerCase().startsWith(value)
						: i.serviceName?.toLowerCase().startsWith(value)
				);
			filteredOrderItems().canTakeItems.set(filteredCanTake);
		}

		if (this.allItems().takingItems().length > 0) {
			const filteredTaking = this.allItems()
				.takingItems()
				.filter(i =>
					!!i.storageItemName
						? i.storageItemName?.toLowerCase().startsWith(value)
						: i.serviceName?.toLowerCase().startsWith(value)
				);
			filteredOrderItems().takingItems.set(filteredTaking);
		}
		if (value.length > 0) {
			this.inputValue.emit(value);
			this.searchResult.emit(filteredOrderItems());
			return;
		}
	}

	emitAddCategories(): void {
		this.searchResult.emit(this.selectedCategories());
		this.searchValue.set('');
	}

	selectSearchItem(item: StorageMovingViewExt) {
		const filtered = this.allItems().filter(i => i.id == item.id);
		this.searchResult.emit(filtered);
		this.searchValue.set(item.storageItemName);
		this.expansionPanelOpen.set(false);
		this.searchValue.set('');
	}

	clearSearch() {
		this.searchValue.set('');
		if (!!this.storage) {
			this.expansionPanelOpen.set(false);
			this.searchResult.emit(this.searchStorageData);
		} else {
			this.inputValue.emit('');
			this.dropSearch.emit();
		}
	}
}
