import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const HOSTED_WS_URL: string = 'https://collab.syncfusion.com';

export interface CollaborationAdapter {
    yRuntime: typeof Y;
    yXmlFragment: Y.XmlFragment;
}

export interface CollaborationHandle {
    destroy: () => void;
}

export interface StatusHandle {
    destroy: () => void;
}

export function init(
    roomName: string,
    onReady: (ydoc: Y.Doc, provider: WebsocketProvider, adapter: CollaborationAdapter) => void
): CollaborationHandle {
    const ydoc: Y.Doc = new Y.Doc();
    const yXmlFragment: Y.XmlFragment = ydoc.getXmlFragment('blockeditor');
    const provider: WebsocketProvider = new WebsocketProvider(HOSTED_WS_URL, roomName, ydoc);
    const adapter: CollaborationAdapter = {
        yRuntime: Y,
        yXmlFragment
    };

    let syncInterval: ReturnType<typeof setInterval> | null = null;
    let resolved: boolean = false;

    function resolve(): void {
        if (resolved) return;
        resolved = true;
        if (syncInterval !== null) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
        onReady(ydoc, provider, adapter);
    }

    // Poll provider.synced every 100ms and call onReady once confirmed synced
    syncInterval = setInterval((): void => {
        if (provider.synced) {
            resolve();
        }
    }, 100);

    return {
        destroy(): void {
            if (syncInterval !== null) clearInterval(syncInterval);
            provider.disconnect();
            ydoc.destroy();
        }
    };
}

export function onStatusChange(
    provider: WebsocketProvider,
    callback: (isConnected: boolean) => void
): StatusHandle {
    function handleStatus(event: { status: string }): void {
        callback(event.status === 'connected');
    }
    provider.on('status', handleStatus);
    return {
        destroy(): void {
            provider.off('status', handleStatus);
        }
    };
}

export function getConnectionStatus(provider: WebsocketProvider): boolean {
    return provider.wsconnected || false;
}
