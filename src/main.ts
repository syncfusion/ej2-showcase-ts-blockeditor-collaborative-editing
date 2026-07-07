import '@syncfusion/ej2-base/styles/tailwind3.css';
import '@syncfusion/ej2-inputs/styles/tailwind3.css';
import '@syncfusion/ej2-buttons/styles/tailwind3.css';
import '@syncfusion/ej2-popups/styles/tailwind3.css';
import '@syncfusion/ej2-splitbuttons/styles/tailwind3.css';
import '@syncfusion/ej2-navigations/styles/tailwind3.css';
import '@syncfusion/ej2-dropdowns/styles/tailwind3.css';
import '@syncfusion/ej2-lists/styles/tailwind3.css';
import '@syncfusion/ej2-layouts/styles/tailwind3.css';
import '@syncfusion/ej2-blockeditor/styles/tailwind3.css';
import './styles/colors.css';
import './styles/typography.css';
import './styles/spacing.css';
import './styles/theme.css';
import './styles/globals.css';
import './styles/app.css';

import { registerLicense } from '@syncfusion/ej2-base';
import { BlockEditor } from '@syncfusion/ej2-blockeditor';
import type { WebsocketProvider } from 'y-websocket';
import type * as Y from 'yjs';

import { getOrCreateRoomId } from './utils/roomIdGenerator.ts';
import { getCurrentUser } from './services/userService.ts';
import { getDefaultBlocks, getInlineToolbarSettings, getImageBlockSettings } from './services/editorService.ts';
import { IndexedDBVersionStorage } from './services/versionHistoryService.ts';
import type { Snapshot } from './services/versionHistoryService.ts';
import * as Collaboration from './services/collaborationService.ts';
import type { CollaborationAdapter } from './services/collaborationService.ts';
import type { User } from './utils/mockData.ts';

import { Header } from './components/Header/Header.ts';
import { Hero } from './components/Hero/Hero.ts';
import { LoadingSpinner } from './components/common/LoadingSpinner.ts';
import { EditorWorkspace } from './components/EditorWorkspace/EditorWorkspace.ts';
import type { EditorWorkspaceHandle } from './components/EditorWorkspace/EditorWorkspace.ts';

// Register Syncfusion license
registerLicense('YOUR_LICENSE_KEY');

// -----------------------------------------------------------------------
// Awareness module
// -----------------------------------------------------------------------
interface AwarenessHandle {
    destroy: () => void;
}

interface AwarenessState {
    user?: {
        id: string;
        user: string;
        avatarBgColor: string;
    };
}

let collaborators: User[] = [];
const awarenessChangeListeners: ((list: User[]) => void)[] = [];

function initAwareness(provider: WebsocketProvider, currentUser: User): AwarenessHandle {
    const awareness: unknown = provider.awareness;
    const aw: {
        setLocalState: (state: AwarenessState) => void;
        getStates: () => Map<number, AwarenessState>;
        on: (event: string, handler: () => void) => void;
        off: (event: string, handler: () => void) => void;
    } = awareness as typeof aw;

    aw.setLocalState({
        user: {
            id: currentUser.id,
            user: currentUser.user,
            avatarBgColor: currentUser.avatarBgColor
        }
    });

    function handleChange(): void {
        const states: Map<number, AwarenessState> = aw.getStates();
        const list: User[] = [];
        states.forEach((state: AwarenessState): void => {
            if (state && state.user && state.user.id !== currentUser.id) {
                list.push(state.user as User);
            }
        });
        collaborators = list;
        awarenessChangeListeners.forEach((fn: (list: User[]) => void): void => { fn(collaborators); });
    }

    aw.on('change', handleChange);
    handleChange();

    return {
        destroy(): void {
            aw.off('change', handleChange);
        }
    };
}

function onAwarenessChange(fn: (list: User[]) => void): void {
    awarenessChangeListeners.push(fn);
}

function getCollaborators(): User[] {
    return collaborators;
}

// -----------------------------------------------------------------------
// Version History module
// -----------------------------------------------------------------------
interface VersionHistoryState {
    snapshots: Snapshot[];
    isLoading: boolean;
}

let versionPlugin: {
    getSnapshots: () => Snapshot[] | Promise<Snapshot[]>;
    restoreSnapshot: (id: string) => void | Promise<void>;
    deleteSnapshot: (id: string) => void | Promise<void>;
    renameSnapshot: (id: string, label: string) => void | Promise<void>;
} | null = null;

let vhStorage: IndexedDBVersionStorage | null = null;
let snapshots: Snapshot[] = [];
let vhIsLoading: boolean = false;
const vhChangeListeners: ((state: VersionHistoryState) => void)[] = [];

function notifyVhChange(): void {
    vhChangeListeners.forEach((fn: (state: VersionHistoryState) => void): void => {
        fn({ snapshots, isLoading: vhIsLoading });
    });
}

function refreshSnapshots(): void {
    if (!versionPlugin) return;
    try {
        const result: Snapshot[] | Promise<Snapshot[]> = versionPlugin.getSnapshots();
        if (result && typeof (result as Promise<Snapshot[]>).then === 'function') {
            // Defensive: handle unlikely async path without showing loading state
            (result as Promise<Snapshot[]>).then((data: Snapshot[]): void => {
                snapshots = data || [];
                vhIsLoading = false;
                notifyVhChange();
            }).catch((err: unknown): void => {
                console.error('Failed to refresh snapshots:', err);
                vhIsLoading = false;
                notifyVhChange();
            });
        } else {
            snapshots = (result as Snapshot[]) || [];
            vhIsLoading = false;
            notifyVhChange();
        }
    } catch (err: unknown) {
        console.error('Failed to refresh snapshots:', err);
        vhIsLoading = false;
        notifyVhChange();
    }
}

function initVersionHistory(
    plugin: typeof versionPlugin,
    store: IndexedDBVersionStorage,
    onChange: (state: VersionHistoryState) => void
): void {
    versionPlugin = plugin;
    vhStorage = store;
    vhChangeListeners.push(onChange);
    setTimeout(refreshSnapshots, 0);
}

function restoreSnapshot(snapshotId: string): void {
    if (!versionPlugin) return;
    vhIsLoading = true;
    notifyVhChange();
    Promise.resolve(versionPlugin.restoreSnapshot(snapshotId)).then((): void => {
        refreshSnapshots();
    }).catch((err: unknown): void => {
        console.error('Failed to restore snapshot:', err);
        vhIsLoading = false;
        notifyVhChange();
    });
}

function deleteOneSnapshot(snapshotId: string): void {
    if (!versionPlugin) return;
    vhIsLoading = true;
    notifyVhChange();
    Promise.resolve(versionPlugin.deleteSnapshot(snapshotId)).then((): void => {
        refreshSnapshots();
    }).catch((err: unknown): void => {
        console.error('Failed to delete snapshot:', err);
        vhIsLoading = false;
        notifyVhChange();
    });
}

function renameSnapshot(snapshotId: string, newLabel: string): void {
    if (!versionPlugin) return;
    vhIsLoading = true;
    notifyVhChange();
    Promise.resolve(versionPlugin.renameSnapshot(snapshotId, newLabel)).then((): void => {
        refreshSnapshots();
    }).catch((err: unknown): void => {
        console.error('Failed to rename snapshot:', err);
        vhIsLoading = false;
        notifyVhChange();
    });
}

function clearAllSnapshots(): void {
    vhIsLoading = true;
    notifyVhChange();
    let deleteChain: Promise<void> = Promise.resolve();
    snapshots.forEach((snapshot: Snapshot): void => {
        deleteChain = deleteChain.then((): Promise<void> => {
            if (versionPlugin) {
                return Promise.resolve(versionPlugin.deleteSnapshot(snapshot.id)).catch((err: unknown): void => {
                    console.warn(`Failed to delete snapshot ${snapshot.id}:`, err);
                });
            }
            return Promise.resolve();
        });
    });
    deleteChain.then((): Promise<void> => {
        return vhStorage ? vhStorage.clearAll() : Promise.resolve();
    }).then((): void => {
        snapshots = [];
        vhIsLoading = false;
        notifyVhChange();
    }).catch((err: unknown): void => {
        console.error('Failed to clear all snapshots:', err);
        vhIsLoading = false;
        notifyVhChange();
    });
}

// -----------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', (): void => {
    const appEl: HTMLElement | null = document.getElementById('app');
    const headerArea: HTMLElement | null = document.getElementById('header-area');
    const heroArea: HTMLElement | null = document.getElementById('hero-area');
    const loadingArea: HTMLElement | null = document.getElementById('loading-area');
    const workspaceArea: HTMLElement | null = document.getElementById('workspace-area');

    if (!appEl || !headerArea || !heroArea || !loadingArea || !workspaceArea) {
        console.error('Required DOM elements not found');
        return;
    }

    appEl.classList.add('app');

    // Render static sections
    Header(headerArea);
    Hero(heroArea);

    // Show loading spinner
    loadingArea.style.display = '';
    const spinner: ReturnType<typeof LoadingSpinner> = LoadingSpinner(loadingArea, 'Initializing collaboration...');

    // Get or create room ID
    const roomId: string = getOrCreateRoomId();

    // Get current user
    const currentUser: User = getCurrentUser();

    // Create IndexedDB storage
    const storage: IndexedDBVersionStorage = new IndexedDBVersionStorage(`blockeditor-versions-${roomId}`);

    // Initialize Collaboration
    Collaboration.init(roomId, (_ydoc: Y.Doc, provider: WebsocketProvider, adapter: CollaborationAdapter): void => {
        // Hide loading, show workspace
        spinner.destroy();
        loadingArea.style.display = 'none';
        workspaceArea.style.display = '';

        // Setup awareness
        initAwareness(provider, currentUser);

        // Setup connection status change listener
        Collaboration.onStatusChange(provider, (isConnected: boolean): void => {
            if (workspaceComponent) {
                workspaceComponent.update({ isConnected });
            }
        });

        // Build collaboration settings
        const collaborationSettings = {
            provider,
            adapter: {
                yRuntime: adapter.yRuntime,
                yXmlFragment: adapter.yXmlFragment
            },
            enableAwareness: true,
            versionHistory: {
                storage,
                snapshotInterval: 3000,
                snapshotCreated: (): void => { refreshSnapshots(); },
                snapshotRestored: (): void => { refreshSnapshots(); }
            }
        };

        const defaultBlocks: ReturnType<typeof getDefaultBlocks> = getDefaultBlocks();

        let workspaceComponent: EditorWorkspaceHandle | null = null;

        workspaceComponent = EditorWorkspace(workspaceArea, {
            roomId,
            isConnected: Collaboration.getConnectionStatus(provider),
            currentUser,
            collaborators: getCollaborators(),
            blocks: defaultBlocks,
            users: [currentUser, ...getCollaborators()],
            currentUserId: currentUser.id,
            collaborationSettings,
            snapshots,
            snapshotsLoading: vhIsLoading,
            inlineToolbarSettings: getInlineToolbarSettings(),
            imageBlockSettings: getImageBlockSettings(),
            onRestoreSnapshot: (snapshotId: string): void => { restoreSnapshot(snapshotId); },
            onDeleteSnapshot: (snapshotId: string): void => { deleteOneSnapshot(snapshotId); },
            onRenameSnapshot: (snapshotId: string, newLabel: string): void => { renameSnapshot(snapshotId, newLabel); },
            onClearAllSnapshots: (): void => { clearAllSnapshots(); },
            onCreated: (editor: BlockEditor): void => {
                let plugin: typeof versionPlugin = null;
                try {
                    plugin = editor ? (editor as unknown as { getVersionHistory: () => typeof versionPlugin }).getVersionHistory() : null;
                } catch (e: unknown) {
                    console.warn('Could not get version history plugin:', e);
                }
                if (!plugin) return;

                function onVersionChange(state: VersionHistoryState): void {
                    if (workspaceComponent) {
                        workspaceComponent.update({
                            snapshots: state.snapshots,
                            snapshotsLoading: state.isLoading
                        });
                    }
                }

                // Wait for IndexedDB storage to be ready before initialising
                const readyPromise: Promise<void> = (storage && typeof storage.ready === 'function')
                    ? storage.ready()
                    : Promise.resolve();

                readyPromise.then((): void => {
                    initVersionHistory(plugin, storage, onVersionChange);
                }).catch((err: unknown): void => {
                    console.warn('Storage ready check failed, initialising anyway:', err);
                    initVersionHistory(plugin, storage, onVersionChange);
                });
            }
        });

        // Listen for awareness changes
        onAwarenessChange((collaboratorList: User[]): void => {
            workspaceComponent?.update({
                collaborators: collaboratorList,
                users: [currentUser, ...collaboratorList]
            });
        });

        // Handle room ID changes via hashchange
        window.addEventListener('hashchange', (): void => {
            const newRoomId: string = getOrCreateRoomId();
            if (newRoomId && newRoomId !== roomId) {
                window.location.reload();
            }
        });
    });
});
