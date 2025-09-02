import { ActivatedRoute } from '@angular/router';
import { environmentConfig } from '../../../environments/environments';
import { ApiException } from '../../../rentApi';
import { StorageItemQuantityView } from '../../../rentApi';
import { HttpErrorResponseEx } from '../../core/interceptors/bloberrorhttpinterceptor';
import { StorageMovingViewExt } from '../models/models';

export function toErrorText(error: any): string {
	const res = [];
	if (error instanceof ApiException) {
		error = JSON.parse(error.response);
	} else if (error instanceof HttpErrorResponseEx) {
		error = error.object;
	}

	if (error.errors && Array.isArray(error.errors)) {
		for (let e of error.errors) {
			if (typeof e !== 'object') {
				res.push(`${e}`);
			} else {
				res.push(`${e?.message}`);
			}
		}
	}

	return res.join(', ');
}

export function calculateQuantities(
	clientStorage: StorageItemQuantityView[],
	organizationStorage: StorageItemQuantityView[]
): [StorageMovingViewExt[], StorageMovingViewExt[]] {
	const clientResult = clientStorage.map(
		item =>
			({
				...item,
				issuedQuantity: item.quantity,
				remainingQuantity:
					organizationStorage.find(
						orgItem => orgItem.storageItemName === item.storageItemName
					)?.quantity || 0,
			}) as StorageMovingViewExt
	);

	const organizationResult = organizationStorage.map(
		item =>
			({
				...item,
				issuedQuantity:
					clientStorage.find(
						clientItem => clientItem.storageItemName === item.storageItemName
					)?.quantity || 0,
				remainingQuantity: item.quantity,
			}) as StorageMovingViewExt
	);

	return [clientResult, organizationResult];
}

export function getAPIBaseUrl(): (route: ActivatedRoute) => string {
	return (route: ActivatedRoute) => {
		const param = route && route.snapshot ? route.snapshot.queryParamMap : {};

		let apiUrl = param['x-lime-api'];

		if (!apiUrl) {
			var sp = new URLSearchParams(window.location.search);
			apiUrl = sp.get('x-lime-api');
		}

		if (!apiUrl) apiUrl = environmentConfig.portalUrl;
		if (!apiUrl) apiUrl = getBaseUrl();

		return trimUrl(apiUrl);
	};
}

export function trimUrl(url: string): string {
	url = url.trim();
	while (url.endsWith('/')) {
		url = url.slice(0, -1);
	}

	return url;
}

export function getBaseUrl() {
	const url = window.location.origin;

	return trimUrl(url);
}
