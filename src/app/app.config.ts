import {
	HTTP_INTERCEPTORS,
	provideHttpClient,
	withInterceptorsFromDi,
} from '@angular/common/http';
import {
	ApplicationConfig,
	isDevMode,
	provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import {
	API_BASE_URL,
	AccountClient,
	ClientManagementClient,
	InstallationsClient,
	RentOrderClient,
	RentPledgeTypesClient,
	ServicePointsClient,
	StoragesClient,
} from '../rentApi';
import { routes } from './app.routes';
import { BlobErrorHttpInterceptor } from './core/interceptors/bloberrorhttpinterceptor';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthInterceptor } from './core/components/auth/intercepors/auth.interceptor';
import { SettingsGuard } from './core/guards/settings.guard';
import {
	AuthService,
	LIME_TOKEN,
} from './core/components/auth/services/auth.service';
import { HttpErrorRequestInterceptor } from './core/interceptors/http-error-request.interceptor';
import { getAPIBaseUrl } from './shared/utils/tools';
import { RentStateStore } from './store/rentModel';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideHttpClient(withInterceptorsFromDi()),
		AuthGuard,
		SettingsGuard,
		ClientManagementClient,
		InstallationsClient,
		ServicePointsClient,
		StoragesClient,
		AuthService,
		StoragesClient,
		AccountClient,
		RentOrderClient,
		RentPledgeTypesClient,
		provideAnimationsAsync(),
		{
			provide: LIME_TOKEN,
			useValue: '',
		},
		{ provide: API_BASE_URL, useFactory: getAPIBaseUrl() },

		provideRouter(routes),
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: HttpErrorRequestInterceptor,
			multi: true,
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: BlobErrorHttpInterceptor,
			multi: true,
		},
		RentStateStore,
		provideHttpClient(),
		provideTransloco({
			config: {
				availableLangs: ['ru', 'en'],
				defaultLang: 'ru',

				reRenderOnLangChange: true,
				prodMode: !isDevMode(),
			},
			loader: TranslocoHttpLoader,
		}),
	],
};
