import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { SettingsGuard } from './core/guards/settings.guard';

export const routes: Routes = [
	{
		path: '',
		redirectTo: 'auth',
		pathMatch: 'full',
	},
	{
		path: 'auth',
		loadComponent: () =>
			import('./core/components/auth/auth/auth.component').then(
				m => m.AuthComponent
			),
		data: { navPanelConfig: { title: '', logo: false, isView: false } },
	},
	{
		path: '',
		canActivate: [AuthGuard],
		children: [
			{
				path: 'order',
				canActivate: [SettingsGuard],
				loadComponent: () =>
					import('./features/order-management/order-management.component').then(
						m => m.OrderMangamentComponent
					),
				data: {
					showBottomNavbar: false,
					navPanelConfig: {
						title: 'navPanel.orderManagement',
						logo: false,
						isView: true,
					},
				},
			},
			{
				path: 'main',
				canActivate: [SettingsGuard],
				loadComponent: () =>
					import('./features/main/main.component').then(m => m.MainComponent),
				data: {
					showBottomNavbar: true,
					navPanelConfig: { title: '', logo: true, isView: true },
					isOpenOrder: true,
				},
			},
			{
				path: 'settings',
				loadComponent: () =>
					import('./features/settings/settings.component').then(
						m => m.SettingsComponent
					),
				data: {
					showBottomNavbar: false,
					navPanelConfig: {
						title: 'navPanel.settings',
						logo: false,
						isView: true,
						settingsButton: true,
					},
				},
			},
			{
				path: 'storage',
				canActivate: [SettingsGuard],
				loadComponent: () =>
					import('./features/storage/storage.component').then(
						m => m.StorageComponent
					),
				data: {
					showBottomNavbar: true,
					navPanelConfig: { title: '', logo: false, isView: false },
				},
			},
			{
				path: 'close',
				canActivate: [SettingsGuard],
				loadComponent: () =>
					import(
						'./shared/components/close-page/closeOrder-page.component'
					).then(m => m.CloseOrderPageComponent),
				data: {
					showBottomNavbar: false,
					navPanelConfig: { title: '', logo: false, isView: false },
				},
			},
		],
	},
];
