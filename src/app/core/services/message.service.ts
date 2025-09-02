import { Injectable, WritableSignal, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { RentBottomSheetComponent } from '../../shared/components/bottom-sheet/bottom-sheet.component';
import { Message } from '../../shared/models/message.model';
import { TransactionMsessage } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class MessageService {
	private messageSource = new Subject<Message | Message[]>();
	private clearSource = new Subject<string>();
	private bottomSheet = inject(MatBottomSheet);
	messageObserver$ = this.messageSource.asObservable();
	clearObserver$ = this.clearSource.asObservable();
	dataSuccessfullyUpdatedText = 'Data successfully updated';
	private messageQueue: Message[] = [];
	private isMessageOpen = false;
	constructor(private transloco: TranslocoService) {}
	openBottomSheet(message: Message) {
		const bottomSheetRef = this.bottomSheet.open(RentBottomSheetComponent, {
			data: message,
		});

		bottomSheetRef.afterDismissed().subscribe(() => {
			this.isMessageOpen = false;
			this.openNextMessage();
		});
		this.isMessageOpen = true;
	}

	add(message: Message) {
		if (message) {
			this.messageQueue.push(message);
			this.messageSource.next(message);
			if (!this.isMessageOpen) {
				this.openNextMessage();
			}
		}
	}

	private openNextMessage() {
		if (this.messageQueue.length > 0) {
			const nextMessage = this.messageQueue.shift();
			if (nextMessage) {
				this.openBottomSheet(nextMessage);
			}
		}
	}

	paymentMessage(
		summary?: string,
		detail?: string,
		refillAmount?: string,
		btn?: string
	) {
		this.add({
			severity: 'payment',
			summary: summary ? summary : this.transloco.translate('messages.scanQr'),
			detail: detail ? detail : '',
			refillAmount: refillAmount,
			btnTxt: btn ?? 'Ok',
		});
	}

	successfullMessage(summary?: string, detail?: string, btn?: string) {
		this.add({
			severity: 'success',
			summary: summary,
			detail: detail ? detail : '',
			btnTxt: btn ?? 'Ok',
		});
	}

	issueMessage(
		summary?: string,
		detail?: string,
		issueDetails?: TransactionMsessage[],
		btn?: string
	) {
		this.add({
			severity: 'issue',
			summary: summary ? summary : this.transloco.translate('messages.success'),
			issueDetails: issueDetails,
			detail: detail
				? detail
				: this.transloco.translate('messages.issued') + ':',
			btnTxt: btn ?? 'Ok',
		});
	}

	errorMessage(summary?: string, detail?: string, btn?: string) {
		this.add({
			severity: 'error',
			summary: summary ? summary : 'неизвестная ошибка',
			detail: detail ? detail : '',
			btnTxt: btn ?? 'Ok',
		});
	}

	dropSettings(
		summary?: string,
		detail?: string,
		btnTxt?: string,
		elseBtnTxt?: string
	) {
		this.add({
			severity: 'dropSettings',
			detail: detail ?? '',
			summary: summary ?? this.transloco.translate('messages.dropSettings'),
			btnTxt: btnTxt ?? this.transloco.translate('messages.dropButtonText'),
			elseBtnTxt: elseBtnTxt ?? this.transloco.translate('messages.cancel'),
		});
	}
}
