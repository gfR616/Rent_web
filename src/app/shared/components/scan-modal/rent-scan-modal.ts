import { CommonModule } from '@angular/common';
import {
	Component,
	Inject,
	OnInit,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialog,
	MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { NavPanelComponent } from '../../../core/layouts/nav-panel/nav-pannel.component';
import { RentScannerComponent } from '../scanner/rent-scanner.component';

@Component({
	selector: 'rent-scan-modal',
	standalone: true,
	imports: [
		MatButtonModule,
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatDialogModule,
		RentScannerComponent,
		NavPanelComponent,
		TranslocoModule,
	],
	templateUrl: './rent-scan-modal.html',
	styleUrl: './rent-scan-modal.scss',
})
export class RentScanModal implements OnInit {
	readonly dialog = inject(MatDialog);
	isModal: WritableSignal<boolean> = signal(true);
	isScanning: WritableSignal<boolean> = signal(false);
	inputValue: WritableSignal<string> = signal('');
	torchEnabled: WritableSignal<boolean> = signal(false);
	currentUrl: WritableSignal<string> = signal('');
	isOpenOrder: WritableSignal<boolean> = signal(false);

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: any,
		private activatedRoute: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.isOpenOrder.set(
			this.activatedRoute.snapshot.firstChild.firstChild.data?.[
				'isOpenOrder'
			] ?? false
		);
	}
}
