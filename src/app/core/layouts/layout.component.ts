import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavbarComponent } from './bottom-navbar/bottom-navbar.component';
import { NavPanelComponent } from './nav-panel/nav-pannel.component';

@Component({
	selector: 'rent-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	imports: [
		RouterOutlet,
		NavPanelComponent,
		CommonModule,
		BottomNavbarComponent,
	],
	standalone: true,
})
export class LayoutComponent {}
