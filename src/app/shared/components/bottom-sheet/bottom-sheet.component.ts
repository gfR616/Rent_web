import { CommonModule } from '@angular/common';
import {
	Component,
	Inject,
	OnInit,
	WritableSignal,
	signal,
} from '@angular/core';
import {
	MAT_BOTTOM_SHEET_DATA,
	MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { QrCodeModule } from 'ng-qrcode';
import { SettingsService } from '../../../core/services/settings.service';
import { Message } from '../../models/message.model';
import { MessageDetails } from '../../models/models';

@Component({
	selector: 'rent-bottom-sheet',
	templateUrl: 'bottom-sheet.component.html',
	styleUrls: ['bottom-sheet.component.scss'],
	standalone: true,
	imports: [MatButtonModule, CommonModule, TranslocoModule, QrCodeModule],
})
export class RentBottomSheetComponent implements OnInit {
	giving: WritableSignal<MessageDetails[]> = signal([]);
	taking: WritableSignal<MessageDetails[]> = signal([]);
	constructor(
		private bottomSheetRef: MatBottomSheetRef<RentBottomSheetComponent>,
		private router: Router,
		private settingsService: SettingsService,
		@Inject(MAT_BOTTOM_SHEET_DATA) public data: Message
	) {}

	ngOnInit(): void {
		if (Array.isArray(this.data.issueDetails)) {
			if (this.data.issueDetails.find(item => item.type === 'giving')) {
				const giving = this.data.issueDetails.find(
					item => item.type === 'giving'
				);
				this.giving.set(giving.items);
			}
			if (this.data.issueDetails.find(item => item.type === 'taking')) {
				const taking = this.data.issueDetails.find(
					item => item.type === 'taking'
				);
				this.taking.set(taking.items);
			}
		}
	}

	closeBottomSheet() {
		this.bottomSheetRef.dismiss();
		if (this.router.url === '/order' && this.data.severity === 'payment') {
			return;
		}
		if (this.router.url === '/order' && this.data.severity === 'issue') {
			this.router.navigate(['main'], { replaceUrl: true });
		}
	}

	dropSettings(e: Event) {
		if (!!e) {
			this.settingsService.dropSettings();
			this.closeBottomSheet();
		}
	}
}
