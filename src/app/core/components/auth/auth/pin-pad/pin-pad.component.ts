import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from '../../../../services/message.service';
import { SettingsService } from '../../../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'rent-pin-pad',
	templateUrl: './pin-pad.component.html',
	styleUrls: ['./pin-pad.component.scss'],
	standalone: true,
	imports: [CommonModule, TranslocoModule],
})
export class PinPadComponent implements OnInit {
	keypadRows: WritableSignal<string[][]> = signal([
		['1', '2', '3'],
		['4', '5', '6'],
		['7', '8', '9'],
	]);
	circles: WritableSignal<number[]> = signal([0, 1, 2, 3]);
	position: WritableSignal<number> = signal(0);
	pinValue: WritableSignal<string> = signal('');
	hasError: WritableSignal<boolean> = signal(false);
	isComplete: WritableSignal<boolean> = signal(false);
	isShaking: WritableSignal<boolean> = signal(false);

	constructor(
		private authService: AuthService,
		private router: Router,
		private settingsService: SettingsService,
		private messageService: MessageService,
		private transloco: TranslocoService
	) {}

	private keydownListener: (event: KeyboardEvent) => void;

	ngOnInit() {
		this.keydownListener = (event: KeyboardEvent) => {
			if (event.key.match(/^\d$/)) {
				this.enter(event.key);
			} else if (event.key === 'Backspace') {
				this.backSpace();
			}
		};
		document.addEventListener('keydown', this.keydownListener);
	}

	ngOnDestroy() {
		document.removeEventListener('keydown', this.keydownListener);
	}

	enter(n: string) {
		if (this.position() >= 4 || this.isShaking()) {
			return;
		}
		this.pinValue.update(prevValue => prevValue + n);
		this.position.update(prevValue => prevValue + 1);

		if (this.position() === 4) {
			this.submitPin();
		}
	}

	backSpace() {
		if (this.position() < 1 || this.isShaking()) {
			return;
		}
		this.pinValue.update(prevValue => prevValue.slice(0, -1));
		this.position.update(prevValue => prevValue - 1);
	}

	private submitPin() {
		const pin = this.pinValue();

		this.authService
			.loginByPin(
				this.settingsService.getSelectedInstallationId().toString(),
				pin
			)
			.subscribe({
				next: result => {
					if (!!result && typeof result === 'boolean') {
						this.onSuccess();
					} else {
						this.onFailure();
					}
				},
				error: e => {
					if (e) {
						if (e.status === 400) {
							this.messageService.errorMessage(
								this.transloco.translate('messages.incorrectPin')
							);
						} else {
							this.messageService.errorMessage(
								`${e.status} ${e.statusText}`,
								e.message
							);
						}
					}
					this.onFailure();
				},
			});
	}

	private onSuccess() {
		this.isComplete.set(true);
		setTimeout(() => {
			this.router.navigate(['main'], { replaceUrl: true });
		}, 500);
	}

	private onFailure() {
		this.hasError.set(true);
		this.isShaking.set(true);
		setTimeout(() => {
			this.isShaking.set(false);
			this.hasError.set(false);
			this.resetPinPad();
		}, 500);
	}

	private resetPinPad() {
		this.pinValue.set('');
		this.position.set(0);
		this.isComplete.set(false);
		this.hasError.set(false);
		this.isShaking.set(false);
	}
}
