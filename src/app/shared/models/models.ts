import { WritableSignal } from '@angular/core';
import {
	IRentOrderDetailView,
	InstallationView,
	RentGiveInfo,
	RentPledge,
	RightView,
	ServiceBookingView,
	ServicePointView,
	StorageItemQuantityView,
} from '../../../rentApi';

export class RentStorages {
	clientStorage: StorageMovingViewExt[] | null;
	organizationStorage: StorageMovingViewExt[] | null;
	searchStorageData: StorageMovingViewExt[] | null;
	constructor(
		clientStorage: StorageMovingViewExt[] | null,
		organizationStorage: StorageMovingViewExt[] | null,
		searchStorageData: StorageMovingViewExt[] | null
	) {
		this.clientStorage = clientStorage;
		this.organizationStorage = organizationStorage;
		this.searchStorageData = searchStorageData;
	}
}

export interface StorageMovingViewExt extends StorageItemQuantityView {
	issuedQuantity: number | null;
	remainingQuantity: number | null;
}

export interface UpdatedItem {
	item: WritableSignal<RentGiveInfo>;
	counter: WritableSignal<number>;
	canPay?: WritableSignal<boolean>;
	unique?: WritableSignal<boolean>;
}

export interface ErrorMessageConfig {
	summary?: string;
	detail?: string;
	btn?: string;
}

export class PledgeData {
	pledge: RentPledge | null;
	pledgeTypeName: string | null;
}

export interface MessageDetails {
	name: string;
	count: number;
}

export interface TransactionMsessage {
	type: 'taking' | 'giving';
	items: MessageDetails[];
}

export class IRightViewModel {
	constructor(
		public right: RightView,
		public booking: ServiceBookingView
	) {}

	get name(): string {
		return this.right?.type?.name ?? this.booking?.serviceName;
	}

	get leftAmount(): number | null {
		return this.right?.leftAmount;
	}

	get from(): Date {
		return this.right?.right?.from ?? this.booking?.from;
	}

	get to(): Date {
		return this.right?.right?.to ?? this.booking?.to;
	}

	get active(): boolean {
		return (
			(!this.to || this.to >= new Date()) &&
			(!this.right ||
				this.right.leftAmount > 0 ||
				this.right.type.isIncremental) &&
			!(this.right?.right?.returned ?? this.booking?.returned)
		);
	}
	get rightId(): number {
		return this.right?.right?.id;
	}

	get id(): string {
		return `${this.right?.right?.id}#${this.booking?.id}`;
	}
}

export class BasicSettings {
	selectedInstallationId: number | null = null;
	selectedServicePointId: number | null = null;
	isSettingsSet: boolean = false;

	constructor(
		selectedInstallationId: number | null = null,
		selectedServicePointId: number | null = null,
		isSettingsSet: boolean = false
	) {
		this.selectedInstallationId = selectedInstallationId;
		this.selectedServicePointId = selectedServicePointId;
		this.isSettingsSet = isSettingsSet;
	}
}

export class RentSettings {
	basicSettings: BasicSettings = null;
	installations: InstallationView[] | null = [];
	servicePoints: ServicePointView[] | null = [];
	selectedInstallation: InstallationView | null = null;
	selectedServicePoint: ServicePointView | null = null;

	constructor(
		basicSettings: BasicSettings = null,
		installations: InstallationView[] | null = [],
		servicePoints: ServicePointView[] | null = [],
		selectedInstallation: InstallationView | null = null,
		selectedServicePoint: ServicePointView | null = null
	) {
		this.basicSettings = basicSettings;
		this.installations = installations;
		this.servicePoints = servicePoints;
		this.selectedInstallation = selectedInstallation;
		this.selectedServicePoint = selectedServicePoint;
	}
}

export class OrderState {
	canGiveItems: WritableSignal<UpdatedItem[]>;
	givingItems: WritableSignal<UpdatedItem[]>;
	takingItems: WritableSignal<IRentOrderDetailView[]>;
	canTakeItems: WritableSignal<IRentOrderDetailView[]>;

	constructor(
		canGiveItems: WritableSignal<UpdatedItem[]>,
		givingItems: WritableSignal<UpdatedItem[]>,
		takingItems: WritableSignal<IRentOrderDetailView[]>,
		canTakeItems: WritableSignal<IRentOrderDetailView[]>
	) {
		this.canGiveItems = canGiveItems;
		this.givingItems = givingItems;
		this.takingItems = takingItems;
		this.canTakeItems = canTakeItems;
	}
}
