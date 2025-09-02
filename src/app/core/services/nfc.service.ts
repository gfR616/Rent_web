import { Injectable, NgZone, WritableSignal, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MessageService } from './message.service';

declare global {
	interface Window {
		nfcScannedCode: (arg: string) => void;
	}
}

export {};
@Injectable({
	providedIn: 'root',
})
export class NfcService {
	defined: WritableSignal<boolean> = signal(false);
	permitted: WritableSignal<boolean> = signal(false);
	error: WritableSignal<boolean> = signal(false);
	abort: AbortController;
	ndef: NDEFReader;
	nfcScan$: Subject<string> = new Subject<string>();
	scannedCode: string = '';

	constructor(
		private zone: NgZone,
		private messageService: MessageService
	) {
		this.defined.set('NDEFReader' in window || 'webkitNDEFReader' in window);

		(<any>navigator).permissions.query({ name: 'nfc' }).then(x => {
			this.permitted.set(x.state === 'granted' || x.state === 'prompt');
			if (this.permitted()) {
				this.startNFCScan();
				return;
			} else if (x.state === 'denied') {
				return;
			}
		});
		if (!this.permitted()) {
			window.nfcScannedCode = c => this.nfcScan$.next(c);
		}
	}

	private async startNFCScan() {
		try {
			this.ndef = new (<any>window).NDEFReader();
			this.abort = new AbortController();
		} catch {
			this.defined.set(false);
			this.error.set(true);
			return;
		}

		try {
			await this.ndef.scan({ signal: this.abort.signal });
			this.permitted.set(true);
			this.ndef.onreading = event => {
				this.zone.run(() => {
					this.nfcScan$.next(this.removeColons(event.serialNumber.toString()));
				});
			};
		} catch (err) {
			this.messageService.errorMessage('Ошибка сканирования!');
			this.permitted.set(false);
			this.error.set(true);
		}
	}

	removeColons(value: string): string {
		return value.replace(/:/g, '');
	}
}
