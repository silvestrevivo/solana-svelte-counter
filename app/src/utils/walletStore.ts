import { WalletNotConnectedError, WalletNotReadyError } from '@solana/wallet-adapter-base';
import type {
	MessageSignerWalletAdapter,
	MessageSignerWalletAdapterProps,
	SendTransactionOptions,
	SignerWalletAdapter,
	SignerWalletAdapterProps,
	WalletError
} from '@solana/wallet-adapter-base';
import type { Wallet, WalletName } from '@solana/wallet-adapter-wallets';
import type { Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { get, writable } from 'svelte/store';
import { WalletNotSelectedError } from './errors';
import { getLocalStorage, setLocalStorage } from './localStorage';

type Adapter = ReturnType<Wallet['adapter']>;
type WalletDictionary = { [name in WalletName]: Wallet };
type ErrorHandler = (error: WalletError) => void;

interface WalletStore {
	walletName: WalletName | null;
	adapter: Adapter | null;
	wallets: Wallet[];
	walletsByName: WalletDictionary;
	autoConnect: boolean;
	localStorageKey: string;
	onError: ErrorHandler;
	wallet: Wallet | null;
	publicKey: PublicKey | null;
	ready: boolean;
	connected: boolean;
	connecting: boolean;
	disconnecting: boolean;

	select(walletName: WalletName): void;

	connect(): Promise<void>;

	disconnect(): Promise<void>;

	sendTransaction(
		transaction: Transaction,
		connection: Connection,
		options?: SendTransactionOptions
	): Promise<TransactionSignature>;

	signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
	signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
	signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
}

type WalletConfig = Pick<
	WalletStore,
	'wallets' | 'walletsByName' | 'autoConnect' | 'localStorageKey' | 'onError'
>;

function createWalletStore() {
	const { subscribe, update } = writable<WalletStore>({
		walletName: null,
		adapter: null,
		wallets: [],
		walletsByName: {} as WalletDictionary,
		autoConnect: false,
		localStorageKey: 'walletAdapter',
		onError: (error: WalletError) => console.error(error),
		wallet: null,
		publicKey: null,
		ready: false,
		connected: false,
		connecting: false,
		disconnecting: false,
		select,
		connect,
		disconnect,
		sendTransaction,
		signTransaction: undefined,
		signAllTransactions: undefined,
		signMessage: undefined
	});

	function updateWalletName(walletName: WalletName | null) {
		const { localStorageKey, walletsByName } = get(walletStore);

		console.log('*** wallet name running ***');

		const wallet = walletsByName?.[walletName as WalletName] ?? null;
		const adapter = wallet?.adapter() ?? null;

		update((store) => ({
			...store,
			walletName,
			wallet,
			ready: adapter?.ready || false,
			publicKey: adapter?.publicKey || null,
			connected: adapter?.connected || false
		}));
		setLocalStorage(localStorageKey, walletName);
		updateAdapter(adapter);
	}

	function updateAdapter(adapter: Adapter) {
		// clean up adapter event listeners
		cleanup();

		let signTransaction: SignerWalletAdapter['signTransaction'] | undefined = undefined;
		let signAllTransactions: SignerWalletAdapter['signAllTransactions'] | undefined = undefined;
		let signMessage: MessageSignerWalletAdapter['signMessage'] | undefined = undefined;

		if (adapter) {
			console.log('*** signature adapter store ***');

			// Sign a transaction if the wallet supports it
			if ('signTransaction' in adapter) {
				signTransaction = async function (transaction: Transaction) {
					const { connected } = get(walletStore);
					if (!connected) throw newError(new WalletNotConnectedError());
					return await adapter.signTransaction(transaction);
				};
			}

			// Sign multiple transactions if the wallet supports it
			if ('signAllTransactions' in adapter) {
				signAllTransactions = async function (transactions: Transaction[]) {
					const { connected } = get(walletStore);
					if (!connected) throw newError(new WalletNotConnectedError());
					return await adapter.signAllTransactions(transactions);
				};
			}

			// Sign an arbitrary message if the wallet supports it
			if ('signMessage' in adapter) {
				signMessage = async function (message: Uint8Array) {
					const { connected } = get(walletStore);
					if (!connected) throw newError(new WalletNotConnectedError());
					return await adapter.signMessage(message);
				};
			}
		}

		// update store
		update((store) => ({ ...store, adapter, signTransaction, signAllTransactions, signMessage }));

		if (!adapter) return;
		// add event listeners
		console.log('*** adding event listeners ***');

		const { onError } = get(walletStore);

		adapter.on('ready', onReady);
		adapter.on('connect', onConnect);
		adapter.on('disconnect', onDisconnect);
		adapter.on('error', onError);

		autoConnect();
	}

	return {
		subscribe,
		updateName: (walletName: WalletName) => updateWalletName(walletName),
		resetWalletName: () => updateWalletName(null),
		updateAdapter: (adapter: Adapter) => updateAdapter(adapter),
		updateConfig: (walletConfig: WalletConfig) =>
			update((store) => ({
				...store,
				...walletConfig
			})),
		update
	};
}

export const walletStore = createWalletStore();

export async function initialize({
	wallets,
	autoConnect = false,
	localStorageKey = 'walletAdapter',
	onError = (error: WalletError) => console.error(error)
}: WalletConfig): Promise<void> {
	const walletsByName = wallets.reduce((walletsByName, wallet) => {
		walletsByName[wallet.name] = wallet;
		return walletsByName;
	}, {} as WalletDictionary);

	walletStore.updateConfig({
		wallets,
		walletsByName,
		autoConnect,
		localStorageKey,
		onError
	});

	const walletName = getLocalStorage<WalletName>(localStorageKey);

	console.log('*** wallet name: ', walletName);

	if (walletName) {
		walletStore.updateName(walletName);
	}
}

async function select(newName: WalletName | null): Promise<void> {
	const { walletName, adapter } = get(walletStore);
	if (walletName === newName) return;

	if (adapter) await disconnect();

	walletStore.updateName(newName);
}

async function disconnect(): Promise<void> {
	const { disconnecting, adapter } = get(walletStore);
	if (disconnecting) return;

	if (!adapter) {
		return walletStore.resetWalletName();
	}

	try {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			disconnecting: true
		}));
		await adapter.disconnect();
	} finally {
		walletStore.resetWalletName();
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			disconnecting: false
		}));
	}
}

async function connect(): Promise<void> {
	const { connected, connecting, disconnecting, wallet, ready, adapter } = get(walletStore);
	if (connected || connecting || disconnecting) return;

	if (!wallet || !adapter) throw newError(new WalletNotSelectedError());

	if (!ready) {
		walletStore.resetWalletName();
		window.open(wallet.url, '_blank');
		throw newError(new WalletNotReadyError());
	}

	try {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: true
		}));
		await adapter.connect();
	} catch (error: unknown) {
		walletStore.resetWalletName();
		throw error;
	} finally {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: false
		}));
	}
}

async function sendTransaction(
	transaction: Transaction,
	connection: Connection,
	options?: SendTransactionOptions
): Promise<TransactionSignature> {
	const { connected, adapter } = get(walletStore);
	if (!connected) throw newError(new WalletNotConnectedError());
	if (!adapter) throw newError(new WalletNotSelectedError());

	return await adapter.sendTransaction(transaction, connection, options);
}

// Handle the adapter events.
function onReady() {
	console.log('wallet ready');
	walletStore.update((storeValues: WalletStore) => ({
		...storeValues,
		ready: true
	}));
}

function newError(error: WalletError): WalletError {
	const { onError } = get(walletStore);
	onError(error);
	return error;
}

function onConnect() {
	const { adapter, wallet } = get(walletStore);
	if (!adapter || !wallet) return;

	console.log('wallet connected');

	walletStore.update((storeValues: WalletStore) => ({
		...storeValues,
		wallet,
		ready: adapter.ready,
		publicKey: adapter.publicKey,
		connected: adapter.connected
	}));

	walletStore.updateAdapter(adapter);
}

function onDisconnect() {
	walletStore.resetWalletName();
}

async function autoConnect() {
	const { adapter, autoConnect, ready, connected, connecting } = get(walletStore);
	if (!autoConnect || !adapter || !ready || connected || connecting) return;
	console.log('*** autoConnect subscriber running ***');

	try {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: true
		}));
		await adapter.connect();
	} catch (error: unknown) {
		// Clear the selected wallet
		walletStore.resetWalletName();
		// Don't throw error, but onError will still be called
	} finally {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: false
		}));
	}
}

function cleanup(): void {
	const { adapter, onError } = get(walletStore);
	if (!adapter) return;

	console.log('*** cleanup listeners ***');

	adapter.off('ready', onReady);
	adapter.off('connect', onConnect);
	adapter.off('disconnect', onDisconnect);
	adapter.off('error', onError);
}

if (typeof window !== 'undefined') {
	// Ensure the adapter listeners are invalidated before refreshing the page.
	window.addEventListener('beforeunload', cleanup);
}
