import { TransactionMsessage } from './models';

export interface Message {
	severity?: 'success' | 'error' | 'dropSettings' | 'issue' | 'payment';
	summary?: string;
	detail?: string;
	issueDetails?: TransactionMsessage[];
	id?: any;
	key?: string;
	life?: number;
	sticky?: boolean;
	closable?: boolean;
	data?: any;
	btnTxt?: string;
	elseBtnTxt?: string;
	refillAmount?: string;
}
