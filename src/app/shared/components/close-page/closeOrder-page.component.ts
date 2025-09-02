import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
	selector: 'close-order',
	standalone: true,
	imports: [MatButtonModule, TranslocoModule],
	templateUrl: './closeOrder-page.component.html',
	styleUrl: './closeOrder-page.component.scss',
})
export class CloseOrderPageComponent {
	constructor(private router: Router) {}
	goNext() {
		this.router.navigate(['/main'], { replaceUrl: true });
	}
}
