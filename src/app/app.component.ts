import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { LayoutComponent } from './core/layouts/layout.component';

const PLUS = `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 11.5V6.5H11V11.5H6V13.5H11V18.5H13V13.5H18V11.5H13Z" fill="white"/>
</svg>


`;
const MINUS = `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="1">
<path d="M18 11.5H6V13.5H18V11.5Z" fill="#F95B1C"/>
</g>
</svg>

`;

const LOUPE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.5" clip-path="url(#clip0_1118_4157)">
<path d="M14.1752 12.5822C15.3726 10.982 15.9194 8.98767 15.7055 7.00056C15.4915 5.01345 14.5328 3.18115 13.0222 1.8725C11.5117 0.563846 9.56145 -0.123994 7.56413 -0.0525625C5.56681 0.0188696 3.67071 0.84427 2.25749 2.25749C0.84427 3.67071 0.0188696 5.56681 -0.0525625 7.56413C-0.123994 9.56145 0.563846 11.5117 1.8725 13.0222C3.18115 14.5328 5.01345 15.4915 7.00056 15.7055C8.98767 15.9194 10.982 15.3726 12.5822 14.1752L16.4072 18.0002L18.0002 16.4102L14.1752 12.5822ZM7.87524 13.5002C6.76272 13.5002 5.67518 13.1703 4.75016 12.5523C3.82513 11.9342 3.10416 11.0557 2.67842 10.0278C2.25268 9 2.14128 7.869 2.35832 6.77786C2.57537 5.68671 3.11109 4.68444 3.89776 3.89776C4.68444 3.11109 5.68671 2.57537 6.77786 2.35832C7.869 2.14128 9 2.25268 10.0278 2.67842C11.0557 3.10416 11.9342 3.82513 12.5523 4.75016C13.1703 5.67518 13.5002 6.76272 13.5002 7.87524C13.4988 9.36666 12.9058 10.7966 11.8512 11.8512C10.7966 12.9058 9.36666 13.4988 7.87524 13.5002Z" fill="white"/>
</g>
<defs>
<clipPath id="clip0_1118_4157">
<rect width="18" height="18" fill="white"/>
</clipPath>
</defs>
</svg>
`;

const CLEAR_INPUT = `<svg width="25" height="25" viewBox="0 0 25 25" fill="#CBC4CF" xmlns="http://www.w3.org/2000/svg">
<path d="M4.48529 4.48542C2.80706 6.16365 1.66417 8.30184 1.20114 10.6296C0.73812 12.9574 0.975761 15.3702 1.88401 17.5629C2.79226 19.7556 4.33033 21.6298 6.30372 22.9483C8.27711 24.2669 10.5972 24.9707 12.9706 24.9707C15.3439 24.9707 17.664 24.2669 19.6374 22.9483C21.6108 21.6298 23.1489 19.7556 24.0571 17.5629C24.9654 15.3702 25.203 12.9574 24.74 10.6296C24.277 8.30185 23.1341 6.16365 21.4558 4.48542C19.2037 2.23816 16.1521 0.976074 12.9706 0.976074C9.78902 0.976074 6.73741 2.23816 4.48529 4.48542V4.48542ZM20.0416 20.0418C18.6431 21.4403 16.8613 22.3927 14.9215 22.7786C12.9817 23.1644 10.971 22.9664 9.14373 22.2095C7.31647 21.4526 5.75469 20.1709 4.65587 18.5264C3.55706 16.8819 2.97057 14.9485 2.97057 12.9707C2.97057 10.9929 3.55706 9.05949 4.65587 7.415C5.75468 5.77051 7.31647 4.48878 9.14373 3.7319C10.971 2.97503 12.9817 2.777 14.9215 3.16285C16.8613 3.5487 18.6431 4.50111 20.0416 5.89963C21.9143 7.77642 22.966 10.3194 22.966 12.9707C22.966 15.622 21.9143 18.165 20.0416 20.0418ZM12.9706 11.5565L15.799 8.72806L17.2132 10.1423L14.3848 12.9707L17.2132 15.7991L15.799 17.2133L12.9706 14.3849L10.1421 17.2133L8.72793 15.7991L11.5564 12.9707L8.72793 10.1423L10.1421 8.72806L12.9706 11.5565Z" fill="#CBC4CF"/>
</svg>
`;

const BARCODE_SEARCH = `<svg width="24" height="24" viewBox="0 0 24 24"  fill="#CBC4CF" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1898_6397)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H6.5V2H2V6.5H0V0ZM17.5 0H24V6.5H22V2H17.5V0ZM0 17.5H2V22H6.5V24H0V17.5ZM24 17.5V24H17.5V22H22V17.5H24Z" fill="#CBC4CF"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4H20V10H18V6H6V10H4V4ZM4 16H2V14H21.5V16H20V20H4V16ZM6 16V18H18V16H6Z" fill="#CBC4CF"/>
</g>
<defs>
<clipPath id="clip0_1898_6397">
<rect width="24" height="24" fill="#CBC4CF"/>
</clipPath>
</defs>
</svg>
`;

const ENTER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#e8eaed"><path d="m560-120-57-57 144-143H200v-480h80v400h367L503-544l56-57 241 241-240 240Z"/></svg>`;

@Component({
	selector: 'rent-root',
	standalone: true,
	imports: [LayoutComponent, MatButtonModule, MatSidenavModule, CommonModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent {
	constructor() {
		const iconRegistry = inject(MatIconRegistry);
		const sanitizer = inject(DomSanitizer);
		iconRegistry.addSvgIconLiteral(
			'plus',
			sanitizer.bypassSecurityTrustHtml(PLUS)
		);
		iconRegistry.addSvgIconLiteral(
			'minus',
			sanitizer.bypassSecurityTrustHtml(MINUS)
		);
		iconRegistry.addSvgIconLiteral(
			'loupe',
			sanitizer.bypassSecurityTrustHtml(LOUPE_ICON)
		);
		iconRegistry.addSvgIconLiteral(
			'claer-input',
			sanitizer.bypassSecurityTrustHtml(CLEAR_INPUT)
		);
		iconRegistry.addSvgIconLiteral(
			'barecode-search',
			sanitizer.bypassSecurityTrustHtml(BARCODE_SEARCH)
		);
		iconRegistry.addSvgIconLiteral(
			'enter',
			sanitizer.bypassSecurityTrustHtml(ENTER_ICON)
		);
	}
}
