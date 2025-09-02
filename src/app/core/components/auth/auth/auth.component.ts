import { CommonModule } from '@angular/common';
import { Component, WritableSignal, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { SwitchComponent } from '../../../../shared/components/switch/switch.component';
import { SettingsService } from '../../../services/settings.service';
import { InputsGroupComponent } from './inputs-group/inputs-group.component';
import { PinPadComponent } from './pin-pad/pin-pad.component';

export interface ILoginData {
	login: string;
	password: string;
	rememberMe: boolean;
}

@Component({
	selector: 'rent-auth',
	templateUrl: './auth.component.html',
	imports: [
		SwitchComponent,
		FormsModule,
		MatFormFieldModule,
		ReactiveFormsModule,
		PinPadComponent,
		CommonModule,
		MatInputModule,
		MatIconModule,
		InputsGroupComponent,
		MatButtonModule,
		MatTooltipModule,
		TranslocoModule,
	],
	styleUrls: ['./auth.component.scss'],
	standalone: true,
})
export class AuthComponent {
	switchValue: WritableSignal<'pin' | 'login'> = signal('pin');
	queryParamsSubscription$: Subscription;
	isSettingsSet: WritableSignal<boolean> = signal(false);

	constructor(private settingsService: SettingsService) {}
	ngOnInit(): void {
		this.isSettingsSet.set(this.settingsService.getIsSettingsSet());
	}

	getSwitch(e: boolean) {
		if (e === true) {
			this.switchValue.set('login');
		} else this.switchValue.set('pin');
	}
}
