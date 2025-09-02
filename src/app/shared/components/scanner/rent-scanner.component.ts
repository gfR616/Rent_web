import { CommonModule } from '@angular/common';
import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MessageService } from '../../../core/services/message.service';

@Component({
	selector: 'rent-scanner',
	standalone: true,
	imports: [
		MatButtonModule,
		ZXingScannerModule,
		CommonModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
	],
	template: `<zxing-scanner
		[torch]="torch"
		(scanSuccess)="onScanResult($event)"
		[formats]="formats"
	></zxing-scanner>`,
})
export class RentScannerComponent implements OnInit {
	BarcodeFormat = BarcodeFormat;
	formats = [
		BarcodeFormat.AZTEC,
		BarcodeFormat.CODABAR,
		BarcodeFormat.CODE_39,
		BarcodeFormat.CODE_93,
		BarcodeFormat.CODE_128,
		BarcodeFormat.DATA_MATRIX,
		BarcodeFormat.EAN_8,
		BarcodeFormat.EAN_13,
		BarcodeFormat.ITF,
		BarcodeFormat.MAXICODE,
		BarcodeFormat.PDF_417,
		BarcodeFormat.QR_CODE,
		BarcodeFormat.RSS_14,
		BarcodeFormat.RSS_EXPANDED,
		BarcodeFormat.UPC_A,
		BarcodeFormat.UPC_E,
		BarcodeFormat.UPC_EAN_EXTENSION,
	];
	@ViewChild('input') input: ElementRef;
	@Input() torch: boolean = false;
	@Output() scanResultEmitter: EventEmitter<string> = new EventEmitter();
	@Output() isScanningEmitter: EventEmitter<boolean> = new EventEmitter();
	constructor(private messageService: MessageService) {}
	ngOnInit(): void {}
	// setTimeout(() => this.onScanResult('9780201379624'), 1000);
	ngOnChanges(changes: SimpleChanges): void {
		if (changes['torch'] && !changes['torch'].firstChange) {
			this.torch = changes['torch'].currentValue;
		}
	}

	onScanResult(result: string): void {
		if (result !== '') {
			this.scanResultEmitter.emit(result);
		}
	}
}
