import { CommonModule } from '@angular/common';
import {
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { NfcService } from '../../core/services/nfc.service';
import { LoadSpinnerComponent } from '../../shared/components/load-screen/load-spinner.component';
import { RentScanModal } from '../../shared/components/scan-modal/rent-scan-modal';
import { RentStateStore } from '../../store/rentModel';

@Component({
	selector: 'rent-main',
	standalone: true,
	imports: [
		MatButtonModule,
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatDialogModule,
		LoadSpinnerComponent,
		MatIconModule,
		TranslocoModule,
		MatSlideToggleModule,
	],
	templateUrl: './main.component.html',
	styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
	protected readonly stateStore = inject(RentStateStore);
	readonly dialog = inject(MatDialog);
	isChecked: WritableSignal<boolean> = signal(false);
	inputValue: WritableSignal<string> = signal('');
	searchIsFocused: WritableSignal<boolean> = signal(false);
	sub: Subscription;
	@ViewChild('search') search!: ElementRef<HTMLElement>;

	constructor(
		private router: Router,
		private nfc: NfcService
	) {}

	ngOnInit(): void {
		this.sub = this.nfc.nfcScan$.subscribe(value => this.onCodeResult(value));
	}
	ngOnDestroy(): void {
		this.sub.unsubscribe();
	}
	focusOnInput(switchValue: boolean) {
		if (!switchValue) return;
		setTimeout(() => {
			if (this.search?.nativeElement) {
				this.search.nativeElement.scrollIntoView({
					behavior: 'smooth',
					block: 'end',
				});
			}
		}, 200);
	}

	openModal(): void {
		this.dialog.open(RentScanModal, {
			width: '100%',
			height: '100%',
			data: {
				onCodeResult: (result: string) => this.onCodeResult(result),
			},
		});
	}

	onCodeResult(result: string) {
		if (!result) return;
		this.stateStore.openOrder(result).subscribe({
			next: () => {
				this.router.navigate(['/order'], { replaceUrl: true });
				this.dialog.closeAll();
				return;
			},
			error: () => {
				this.dialog.closeAll();
			},
		});
	}
}
