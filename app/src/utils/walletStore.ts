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

interface WalletConfigStore {
	wallets: Wallet[];
	walletsByName: WalletDictionary;
	autoConnect: boolean;
	localStorageKey: string;
	onError: ErrorHandler;
}

interface WalletStore {
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

interface WalletNameAdapterStore {
	walletName: WalletName | null;
	adapter: Adapter | null;
}

export const walletConfigStore = writable<WalletConfigStore>({
	wallets: [],
	walletsByName: {} as WalletDictionary,
	autoConnect: false,
	localStorageKey: 'walletAdapter',
	onError: (error: WalletError) => console.error(error)
});

export const walletStore = writable<WalletStore>({
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

function createWalletNameAdapterStore() {
	const { subscribe, set, update } = writable<WalletNameAdapterStore>({
		walletName: null,
		adapter: null
	});

	function updateWalletName(walletName: WalletName | null) {
		const { localStorageKey, walletsByName } = get(walletConfigStore);

		update((store) => ({ ...store, walletName }));
		setLocalStorage(localStorageKey, walletName);

		console.log('*** wallet name running ***');

		const wallet = walletsByName?.[walletName as WalletName] ?? null;
		const adapter = wallet?.adapter() ?? null;

		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			wallet,
			ready: adapter?.ready || false,
			publicKey: adapter?.publicKey || null,
			connected: adapter?.connected || false
		}));

		updateAdapter(adapter);
	}

	function updateAdapter(adapter: Adapter) {
		// clean up adapter event listeners
		cleanup();

		// update store
		update((store) => ({ ...store, adapter }));

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

		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			signTransaction,
			signAllTransactions,
			signMessage
		}));

		if (!adapter) return;
		// add event listeners
		console.log('*** adding event listeners ***');

		const { onError } = get(walletConfigStore);

		adapter.on('ready', onReady);
		adapter.on('connect', onConnect);
		adapter.on('disconnect', onDisconnect);
		adapter.on('error', onError);
	}

	return {
		subscribe,
		updateName: (walletName: WalletName) => updateWalletName(walletName),
		reset: () => updateWalletName(null),
		updateAdapter: (adapter: Adapter) => updateAdapter(adapter)
	};
}

export const walletNameAdapterStore = createWalletNameAdapterStore();

export async function initialize({
	wallets,
	autoConnect = false,
	localStorageKey = 'walletAdapter',
	onError = (error: WalletError) => console.error(error)
}: {
	wallets: Wallet[];
	autoConnect?: boolean;
	localStorageKey: string;
	onError?: ErrorHandler;
}): Promise<void> {
	walletConfigStore.set({
		wallets,
		walletsByName: wallets.reduce((walletsByName, wallet) => {
			walletsByName[wallet.name] = wallet;
			return walletsByName;
		}, {} as WalletDictionary),
		autoConnect,
		localStorageKey,
		onError
	});

	const walletName = getLocalStorage<WalletName>(localStorageKey);

	console.log('*** wallet name: ', walletName);

	if (walletName) {
		walletNameAdapterStore.updateName(walletName);
	}
}

async function select(newName: WalletName | null): Promise<void> {
	const { walletName, adapter } = get(walletNameAdapterStore);
	if (walletName === newName) return;

	if (adapter) await disconnect();

	walletNameAdapterStore.updateName(newName);
}

async function disconnect(): Promise<void> {
	const { disconnecting } = get(walletStore);
	if (disconnecting) return;

	const { adapter } = get(walletNameAdapterStore);
	if (!adapter) {
		return walletNameAdapterStore.reset();
	}

	try {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			disconnecting: true
		}));
		await adapter.disconnect();
	} finally {
		walletNameAdapterStore.reset();
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			disconnecting: false
		}));
	}
}

async function connect(): Promise<void> {
	const { connected, connecting, disconnecting, wallet, ready } = get(walletStore);
	if (connected || connecting || disconnecting) return;

	const { adapter } = get(walletNameAdapterStore);
	if (!wallet || !adapter) throw newError(new WalletNotSelectedError());

	if (!ready) {
		walletNameAdapterStore.reset();
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
		walletNameAdapterStore.reset();
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
	const { connected } = get(walletStore);
	if (!connected) throw newError(new WalletNotConnectedError());

	const { adapter } = get(walletNameAdapterStore);
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
	const { onError } = get(walletConfigStore);
	onError(error);
	return error;
}

function onConnect() {
	const { adapter } = get(walletNameAdapterStore);
	const { wallet } = get(walletStore);
	if (!adapter || !wallet) return;

	console.log('wallet connected');

	walletStore.update((storeValues: WalletStore) => ({
		...storeValues,
		wallet,
		ready: adapter.ready,
		publicKey: adapter.publicKey,
		connected: adapter.connected
	}));

	walletNameAdapterStore.updateAdapter(adapter);
}

function onDisconnect() {
	walletNameAdapterStore.reset();
}

// watcher for auto-connect
walletNameAdapterStore.subscribe(async ({ adapter }: { adapter: Adapter | null }) => {
	if (!adapter) return;

	const { autoConnect } = get(walletConfigStore);
	if (!autoConnect) return;

	console.log('*** autoConnect subscriber running ***');

	const { ready, connected, connecting } = get(walletStore);
	if (!ready || connected || connecting) return;

	try {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: true
		}));
		await adapter.connect();
	} catch (error: unknown) {
		// Clear the selected wallet
		walletNameAdapterStore.reset();
		// Don't throw error, but onError will still be called
	} finally {
		walletStore.update((storeValues: WalletStore) => ({
			...storeValues,
			connecting: false
		}));
	}
});

function cleanup(): void {
	const { adapter } = get(walletNameAdapterStore);
	if (!adapter) return;

	console.log('*** cleanup listeners ***');

	const { onError } = get(walletConfigStore);

	adapter.off('ready', onReady);
	adapter.off('connect', onConnect);
	adapter.off('disconnect', onDisconnect);
	adapter.off('error', onError);
}

if (typeof window !== 'undefined') {
	// Ensure the adapter listeners are invalidated before refreshing the page.
	window.addEventListener('beforeunload', cleanup);
}
