import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
	selector: 'rent-spinner',
	templateUrl: './load-spinner.component.html',
	standalone: true,
	imports: [MatProgressSpinnerModule],
})
export class LoadSpinnerComponent {}
