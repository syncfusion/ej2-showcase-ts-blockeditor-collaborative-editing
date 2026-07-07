import { Button } from '@syncfusion/ej2-buttons';
import { CollabPanel } from '../ActiveCollabPanel/CollabPanel.ts';
import { VersionHistoryList } from '../VersionHistory/VersionHistoryList.ts';
import type { User } from '../../utils/mockData.ts';
import type { Snapshot } from '../../services/versionHistoryService.ts';
import './SidebarContent.css';

export type SidebarMode = 'collaborators' | 'versions';

export interface SidebarContentConfig {
    mode: SidebarMode;
    editorRef: { current: unknown };
    collaborators: User[];
    currentUser: User;
    snapshots: Snapshot[];
    isLoading: boolean;
    onClose: () => void;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, label: string) => void;
    onClearAll: () => void;
}

export interface SidebarContentHandle {
    update: (newConfig: Partial<SidebarContentConfig>) => void;
    destroy: () => void;
}

export function SidebarContent(container: HTMLElement, config: SidebarContentConfig): SidebarContentHandle {
    let currentConfig: SidebarContentConfig = Object.assign({}, config);
    let isClearing: boolean = false;
    let contentComponent: ReturnType<typeof CollabPanel> | ReturnType<typeof VersionHistoryList> | null = null;

    // Wrapper
    const wrapper: HTMLDivElement = document.createElement('div');
    wrapper.className = 'sidebar-content-wrapper';

    // Header
    const header: HTMLDivElement = document.createElement('div');
    header.className = 'sidebar-header';

    const titleEl: HTMLHeadingElement = document.createElement('h3');
    titleEl.className = 'sidebar-title';

    const headerActions: HTMLDivElement = document.createElement('div');
    headerActions.className = 'sidebar-header-actions';

    header.appendChild(titleEl);
    header.appendChild(headerActions);

    // Content area
    const contentArea: HTMLDivElement = document.createElement('div');
    contentArea.className = 'sidebar-content';

    wrapper.appendChild(header);
    wrapper.appendChild(contentArea);
    container.appendChild(wrapper);

    // Delete All button (only for versions mode with snapshots)
    const deleteAllBtnHost: HTMLButtonElement = document.createElement('button');
    headerActions.appendChild(deleteAllBtnHost);
    const deleteAllBtn: Button = new Button({ cssClass: 'e-small', content: 'Delete All' });
    deleteAllBtn.appendTo(deleteAllBtnHost);
    deleteAllBtnHost.title = 'Delete all snapshots';
    deleteAllBtnHost.style.display = 'none';
    deleteAllBtnHost.addEventListener('click', (): void => {
        if (isClearing || currentConfig.isLoading) return;
        if (!currentConfig.snapshots || currentConfig.snapshots.length === 0) return;
        const confirmed: boolean = window.confirm(
            'Are you sure you want to delete all ' + currentConfig.snapshots.length + ' snapshot(s)? This action cannot be undone.'
        );
        if (confirmed) {
            isClearing = true;
            deleteAllBtnHost.disabled = true;
            Promise.resolve(currentConfig.onClearAll()).then((): void => {
                isClearing = false;
                deleteAllBtnHost.disabled = false;
            }).catch((err: unknown): void => {
                console.error('Failed to clear all snapshots:', err);
                isClearing = false;
                deleteAllBtnHost.disabled = false;
            });
        }
    });

    // Close button
    const closeBtnHost: HTMLButtonElement = document.createElement('button');
    headerActions.appendChild(closeBtnHost);
    const closeBtn: Button = new Button({ cssClass: 'e-small' });
    closeBtn.appendTo(closeBtnHost);
    closeBtnHost.textContent = '×';
    closeBtnHost.title = 'Close';
    closeBtnHost.addEventListener('click', (): void => {
        if (currentConfig.onClose) currentConfig.onClose();
    });

    function renderContent(): void {
        // Clean up previous component
        if (contentComponent && 'destroy' in contentComponent) {
            (contentComponent as { destroy: () => void }).destroy();
        }
        contentArea.innerHTML = '';
        contentComponent = null;

        if (currentConfig.mode === 'collaborators') {
            titleEl.textContent = 'Active Collaborators';
            deleteAllBtnHost.style.display = 'none';
            contentComponent = CollabPanel(contentArea, {
                collaborators: currentConfig.collaborators,
                currentUser: currentConfig.currentUser
            });
        } else {
            titleEl.textContent = 'Version History';
            const hasSnapshots: boolean = !!(currentConfig.snapshots && currentConfig.snapshots.length > 0);
            deleteAllBtnHost.style.display = hasSnapshots ? '' : 'none';
            deleteAllBtnHost.disabled = isClearing || currentConfig.isLoading;
            contentComponent = VersionHistoryList(contentArea, {
                snapshots: currentConfig.snapshots,
                isLoading: currentConfig.isLoading,
                editorRef: currentConfig.editorRef as { current: { users?: { id: string; user: string }[] } | null },
                onRestore: currentConfig.onRestore,
                onDelete: currentConfig.onDelete,
                onRename: currentConfig.onRename
            });
        }
    }

    renderContent();

    function update(newConfig: Partial<SidebarContentConfig>): void {
        const prevMode: SidebarMode = currentConfig.mode;
        currentConfig = Object.assign(currentConfig, newConfig);

        if (newConfig.mode && newConfig.mode !== prevMode) {
            // Mode changed: full re-render
            renderContent();
        } else if (currentConfig.mode === 'collaborators' && contentComponent && 'update' in contentComponent) {
            (contentComponent as ReturnType<typeof CollabPanel>).update(currentConfig.collaborators, currentConfig.currentUser);
        } else if (currentConfig.mode === 'versions' && contentComponent && 'update' in contentComponent) {
            const hasSnapshots: boolean = !!(currentConfig.snapshots && currentConfig.snapshots.length > 0);
            deleteAllBtnHost.style.display = hasSnapshots ? '' : 'none';
            deleteAllBtnHost.disabled = isClearing || currentConfig.isLoading;
            (contentComponent as ReturnType<typeof VersionHistoryList>).update(currentConfig.snapshots, currentConfig.isLoading);
        }
    }

    function destroy(): void {
        if (contentComponent && 'destroy' in contentComponent) {
            (contentComponent as { destroy: () => void }).destroy();
        }
        if (container.contains(wrapper)) {
            container.removeChild(wrapper);
        }
    }

    return { update, destroy };
}
