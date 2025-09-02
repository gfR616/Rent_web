import { CommonModule, Location } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	WritableSignal,
	inject,
	signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { RentStateStore } from '../../../store/rentModel';
import { MessageService } from '../../services/message.service';
import { SettingsService } from '../../services/settings.service';

@Component({
	selector: 'rent-nav-panel',
	standalone: true,
	imports: [
		MatMenuModule,
		MatButtonModule,
		CommonModule,
		MatIconModule,
		MatDividerModule,
		RouterLink,
		TranslocoModule,
	],
	templateUrl: './nav-pannel.component.html',
	styleUrl: './nav-pannel.component.scss',
})
export class NavPanelComponent implements OnInit {
	protected readonly stateStore = inject(RentStateStore);
	@Input() isModal: boolean;
	@Output() closeModalEmmiter: EventEmitter<boolean> = new EventEmitter();
	title: WritableSignal<string> = signal('');
	logo: WritableSignal<boolean> = signal(false);
	currentUrl: WritableSignal<string> = signal('');
	isView: WritableSignal<boolean> = signal(false);
	settingsButton: WritableSignal<boolean> = signal(false);

	constructor(
		private route: ActivatedRoute,
		private messageService: MessageService,
		private router: Router,
		private settingsService: SettingsService
	) {}

	ngOnInit(): void {
		this.router.events.subscribe(event => {
			this.currentUrl.update(() => this.router.url);
			const navPanelConfig =
				this.route.snapshot.firstChild?.firstChild?.data['navPanelConfig'] ||
				this.route.snapshot.firstChild?.data['navPanelConfig'];
			if (!!navPanelConfig) {
				this.title.set(navPanelConfig.title || '');
				this.logo.set(navPanelConfig.logo || false);
				this.isView.set(navPanelConfig.isView || false);
				this.settingsButton.set(navPanelConfig.settingsButton || false);
			}
		});
	}

	onDropSettings(): void {
		this.messageService.dropSettings();
	}

	goBack(): void {
		if (this.currentUrl() === '/order') {
			this.router.navigate(['/main'], { replaceUrl: true });
			return;
		}
		if (this.currentUrl() === '/settings') {
			if (this.settingsService.getIsSettingsSet()) {
				this.router.navigate(['/main'], { replaceUrl: true });
			} else {
				this.router.navigate(['/auth'], { replaceUrl: true });
			}
		}
	}
}
