import { NgClass } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	Output,
	WritableSignal,
	signal,
} from '@angular/core';

@Component({
	selector: 'rent-switch',
	templateUrl: './switch.component.html',
	styleUrls: ['./switch.component.scss'],
	standalone: true,
	imports: [NgClass],
})
export class SwitchComponent {
	isActive: WritableSignal<boolean> = signal(false);
	@Output() switchChanged = new EventEmitter<boolean>();
	@Input() buttonOne: string;
	@Input() buttonTwo: string;
	@Input() isDisabled: boolean = false;

	toggleSwitch(e: boolean): void {
		if (!this.isDisabled) {
			this.isActive.set(e);
			this.switchChanged.emit(this.isActive());
		}
	}
}
