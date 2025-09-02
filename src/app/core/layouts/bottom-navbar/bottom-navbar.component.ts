import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { AuthService } from '../../components/auth/services/auth.service';

@Component({
	selector: 'rent-bottom-navbar',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatDividerModule, TranslocoModule],
	templateUrl: './bottom-navbar.component.html',
	styleUrl: './bottom-navbar.component.scss',
})
export class BottomNavbarComponent implements OnInit {
	currentUrl: WritableSignal<string> = signal('');
	isView: WritableSignal<boolean> = signal(false);
	constructor(
		private authService: AuthService,
		private router: Router,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.router.events.subscribe(() => {
			this.currentUrl.set(this.router.url);
			this.isView.set(
				!!this.route.snapshot.firstChild?.firstChild?.data[
					'showBottomNavbar'
				] || false
			);
		});
	}
	navigateTo(route: string): void {
		this.router.navigate([route], { replaceUrl: true });
	}

	logout() {
		this.authService.logout();
	}
}
