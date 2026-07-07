export interface Snapshot {
    id: string;
    label?: string;
    isAutoLabel?: boolean;
    timestamp?: number;
    userName?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: number;
    [key: string]: unknown;
}

export interface IVersionStorage {
    saveSnapshot(snapshot: Snapshot): Promise<void>;
    loadAllSnapshots(): Promise<Snapshot[]>;
    loadSnapshot(id: string): Promise<Snapshot | null>;
    deleteSnapshot(id: string): Promise<void>;
    clearAll(): Promise<void>;
    ready(): Promise<void>;
    destroy(): void;
}

export class IndexedDBVersionStorage implements IVersionStorage {
    private _dbName: string;
    private _storeName: string;
    private _db: IDBDatabase | null;
    private _initPromise: Promise<void>;

    constructor(dbName: string) {
        this._dbName = dbName;
        this._storeName = 'snapshots';
        this._db = null;
        this._initPromise = this._initialize();
    }

    private _initialize(): Promise<void> {
        return new Promise<void>((resolve: () => void, reject: (reason?: unknown) => void): void => {
            const request: IDBOpenDBRequest = indexedDB.open(this._dbName, 1);

            request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
                const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this._storeName)) {
                    const store: IDBObjectStore = db.createObjectStore(this._storeName, { keyPath: 'id' });
                    store.createIndex('lastModifiedAt', 'lastModifiedAt', { unique: false });
                }
            };

            request.onsuccess = (event: Event): void => {
                this._db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = (event: Event): void => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    async saveSnapshot(snapshot: Snapshot): Promise<void> {
        await this._initPromise;
        return new Promise<void>((resolve: () => void, reject: (reason?: unknown) => void): void => {
            const tx: IDBTransaction = this._db!.transaction(this._storeName, 'readwrite');
            const store: IDBObjectStore = tx.objectStore(this._storeName);
            const request: IDBRequest = store.put(snapshot);
            request.onsuccess = (): void => resolve();
            request.onerror = (event: Event): void => reject((event.target as IDBRequest).error);
        });
    }

    async loadAllSnapshots(): Promise<Snapshot[]> {
        await this._initPromise;
        return new Promise<Snapshot[]>((resolve: (value: Snapshot[]) => void, reject: (reason?: unknown) => void): void => {
            const tx: IDBTransaction = this._db!.transaction(this._storeName, 'readonly');
            const store: IDBObjectStore = tx.objectStore(this._storeName);
            const request: IDBRequest<Snapshot[]> = store.getAll() as IDBRequest<Snapshot[]>;
            request.onsuccess = (): void => resolve(request.result || []);
            request.onerror = (event: Event): void => reject((event.target as IDBRequest).error);
        });
    }

    async loadSnapshot(id: string): Promise<Snapshot | null> {
        await this._initPromise;
        return new Promise<Snapshot | null>((resolve: (value: Snapshot | null) => void, reject: (reason?: unknown) => void): void => {
            const tx: IDBTransaction = this._db!.transaction(this._storeName, 'readonly');
            const store: IDBObjectStore = tx.objectStore(this._storeName);
            const request: IDBRequest<Snapshot> = store.get(id) as IDBRequest<Snapshot>;
            request.onsuccess = (): void => resolve(request.result || null);
            request.onerror = (event: Event): void => reject((event.target as IDBRequest).error);
        });
    }

    async deleteSnapshot(id: string): Promise<void> {
        await this._initPromise;
        return new Promise<void>((resolve: () => void, reject: (reason?: unknown) => void): void => {
            const tx: IDBTransaction = this._db!.transaction(this._storeName, 'readwrite');
            const store: IDBObjectStore = tx.objectStore(this._storeName);
            const request: IDBRequest = store.delete(id);
            request.onsuccess = (): void => resolve();
            request.onerror = (event: Event): void => reject((event.target as IDBRequest).error);
        });
    }

    async clearAll(): Promise<void> {
        await this._initPromise;
        return new Promise<void>((resolve: () => void, reject: (reason?: unknown) => void): void => {
            const tx: IDBTransaction = this._db!.transaction(this._storeName, 'readwrite');
            const store: IDBObjectStore = tx.objectStore(this._storeName);
            const request: IDBRequest = store.clear();
            request.onsuccess = (): void => resolve();
            request.onerror = (event: Event): void => reject((event.target as IDBRequest).error);
        });
    }

    async ready(): Promise<void> {
        await this._initPromise;
    }

    destroy(): void {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }
}
