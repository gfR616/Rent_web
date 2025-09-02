import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	OnInit,
	WritableSignal,
	signal,
} from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { catchError, first, of } from 'rxjs';
import { MessageService } from '../../../../services/message.service';
import { SettingsService } from '../../../../services/settings.service';
import { AuthService } from '../../services/auth.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
	isErrorState(
		control: FormControl | null,
		form: FormGroupDirective | NgForm | null
	): boolean {
		const isSubmitted = form && form.submitted;
		return !!(
			control &&
			control.invalid &&
			(control.dirty || control.touched || isSubmitted)
		);
	}
}

@Component({
	selector: 'rent-inputs-group',
	templateUrl: './inputs-group.component.html',
	styleUrl: './inputs-group.component.scss',
	standalone: true,
	imports: [
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		MatIconModule,
		MatButtonModule,
		CommonModule,
		TranslocoModule,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputsGroupComponent implements OnInit {
	loading: WritableSignal<boolean> = signal(false);
	loginForm: FormGroup;
	hide: WritableSignal<boolean> = signal(true);
	matcher = new MyErrorStateMatcher();
	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private settingsService: SettingsService,
		private router: Router,
		private transloco: TranslocoService
	) {}
	ngOnInit(): void {
		this.loginForm = new FormGroup({
			email: new FormControl('', [Validators.required, Validators.email]),
			password: new FormControl('', [
				Validators.required,
				Validators.minLength(1),
				Validators.maxLength(20),
			]),
			rememberMe: new FormControl(false),
		});
	}

	clickEvent(event: MouseEvent) {
		this.hide.set(!this.hide());
		event.stopPropagation();
	}
	onSubmit(): void {
		if (!this.loginForm.valid) {
			return;
		}
		this.login();
	}

	login() {
		this.loading.set(true);
		this.authService
			.login(this.loginForm.value.email, this.loginForm.value.password)
			.pipe(
				catchError(error => {
					if (error.status === 400) {
						this.messageService.errorMessage(
							this.transloco.translate('messages.incorrectLogin')
						);
					} else {
						this.messageService.errorMessage(
							`${error.status} ${error.statusText}`,
							error.message
						);
					}
					return of(false);
				}),
				first()
			)
			.subscribe(result => {
				if (typeof result === 'boolean') {
					if (result === true) {
						if (
							!!this.settingsService.getSelectedInstallationId() &&
							!!this.settingsService.getSelectedServicePointId()
						) {
							this.router.navigate(['/main'], { replaceUrl: true });
						} else {
							this.router.navigate(['/settings']);
						}
					}
				} else {
					if (result.payload.status) {
						this.messageService.errorMessage(
							result.payload.status,
							result.payload
						);
					} else {
						this.messageService.errorMessage(result.payload);
					}
				}
				this.loading.set(false);
			});
	}
}
