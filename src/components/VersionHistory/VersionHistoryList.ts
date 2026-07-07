import { ListView } from '@syncfusion/ej2-lists';
import type { FieldSettingsModel } from '@syncfusion/ej2-lists';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import type { ItemModel, MenuEventArgs } from '@syncfusion/ej2-splitbuttons';
import { createSpinner, showSpinner } from '@syncfusion/ej2-popups';
import type { Snapshot } from '../../services/versionHistoryService.ts';
import { LabelRenameModal } from './LabelRenameModal.ts';
import './VersionHistoryList.css';

export interface VersionHistoryListConfig {
    snapshots: Snapshot[];
    isLoading: boolean;
    editorRef?: { current: { users?: { id: string; user: string }[] } | null };
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, label: string) => void;
}

export interface VersionHistoryListHandle {
    update: (snapshots: Snapshot[], isLoading: boolean) => void;
}

interface VersionHistoryItem {
    id: string;
    headerText: string;
    label: string;
    isAutoLabel: boolean;
    timestamp: string;
    userName: string;
    lastModifiedBy: string;
    lastModifiedAt: number;
    dateGroup: string;
}

function getDateGroup(timestamp: number): string {
    const date: Date = new Date(timestamp);
    const today: Date = new Date();
    const yesterday: Date = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateString: string = date.toDateString();
    const todayString: string = today.toDateString();
    const yesterdayString: string = yesterday.toDateString();

    if (dateString === todayString) return 'Today';
    if (dateString === yesterdayString) return 'Yesterday';

    const diffTime: number = today.getTime() - date.getTime();
    const diffDays: number = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return 'This Week';
    if (diffDays < 30) return 'This Month';

    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

function formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function mapSnapshots(snapshots: Snapshot[], getUserName: (userId: string) => string): VersionHistoryItem[] {
    return (snapshots || []).map((s: Snapshot): VersionHistoryItem => {
        const ts: number = (s.lastModifiedAt as number) || (s.timestamp as number) || Date.now();
        const label: string = (s.label as string) || '';
        const isAutoLabel: boolean = !label;
        return {
            id: s.id,
            headerText: label || formatTimestamp(ts),
            label,
            isAutoLabel,
            timestamp: formatTimestamp(ts),
            userName: getUserName(s.lastModifiedBy as string),
            lastModifiedBy: (s.lastModifiedBy as string) || '',
            lastModifiedAt: ts,
            dateGroup: getDateGroup(ts)
        };
    });
}

export function VersionHistoryList(container: HTMLElement, config: VersionHistoryListConfig): VersionHistoryListHandle {
    let listView: ListView | null = null;
    let currentSnapshots: Snapshot[] = config.snapshots || [];
    const editorRef: { current: { users?: { id: string; user: string }[] } | null } = config.editorRef || { current: null };

    const renameModal: ReturnType<typeof LabelRenameModal> = LabelRenameModal();

    const listHost: HTMLDivElement = document.createElement('div');
    listHost.id = 'version-history-list';
    container.appendChild(listHost);

    const menuItems: ItemModel[] = [
        { text: 'Restore', id: 'restore', iconCss: 'e-icons e-redo' },
        { text: 'Rename', id: 'rename', iconCss: 'e-icons e-edit' },
        { separator: true },
        // cssClass on ItemModel is not typed in ej2-splitbuttons — cast to any to apply danger style
        { text: 'Delete', id: 'delete', iconCss: 'e-icons e-trash' } as ItemModel
    ];

    function getUserName(userId: string): string {
        const editor: { users?: { id: string; user: string }[] } | null = editorRef.current;
        if (!editor || !editor.users) return 'Unknown';
        const found: { id: string; user: string } | undefined = editor.users.find(
            (u: { id: string; user: string }): boolean => u.id === userId
        );
        return found ? (found.user || 'Unknown') : 'Unknown';
    }

    function handleMenuAction(snapshotId: string, action: string): void {
        if (action === 'restore') {
            config.onRestore(snapshotId);
        } else if (action === 'rename') {
            let snapshot: Snapshot | null = null;
            for (let i: number = 0; i < currentSnapshots.length; i++) {
                if (currentSnapshots[i].id === snapshotId) {
                    snapshot = currentSnapshots[i];
                    break;
                }
            }
            const initialLabel: string = snapshot ? ((snapshot.label as string) || '') : '';
            renameModal.show(snapshotId, initialLabel, (id: string, newLabel: string): void => {
                config.onRename(id, newLabel);
            });
        } else if (action === 'delete') {
            if (window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
                config.onDelete(snapshotId);
            }
        }
    }

    function renderDropDownButtons(): void {
        const actionDivs: NodeListOf<HTMLElement> = listHost.querySelectorAll('[id^="vha-"]');
        actionDivs.forEach((div: HTMLElement): void => {
            const snapshotId: string = div.id.replace('vha-', '');
            if (div.children.length > 0) return; // already rendered
            const btnHost: HTMLButtonElement = document.createElement('button');
            div.appendChild(btnHost);
            const ddb: DropDownButton = new DropDownButton({
                items: menuItems,
                cssClass: 'e-caret-hide e-small e-flat',
                iconCss: 'e-icons e-more-vertical-2',
                // title is an HTML attribute — set it on the element directly
                select: (args: MenuEventArgs): void => {
                    handleMenuAction(snapshotId, args.item.id as string);
                }
            });
            ddb.appendTo(btnHost);
            btnHost.title = 'More actions';
        });
    }

    function renderEmpty(): void {
        listHost.innerHTML = '<div class="e-listview-empty"><p class="empty-message">No versions yet. Create a snapshot to save your work.</p></div>';
    }

    function renderLoading(): void {
        listHost.innerHTML = '<div class="e-listview-loader"><div class="spinner-host-versions"></div></div>';
        const spinnerEl: HTMLElement | null = listHost.querySelector('.spinner-host-versions');
        if (spinnerEl) {
            createSpinner({ target: spinnerEl });
            showSpinner(spinnerEl);
        }
    }

    const fields: FieldSettingsModel = {
        id: 'id',
        text: 'headerText',
        groupBy: 'dateGroup'
    };

    function renderListView(data: VersionHistoryItem[]): void {
        // Always destroy and recreate — grouped ListView does not correctly
        // re-render group headers when only dataSource/dataBind is used.
        // This mirrors React's behaviour where a new dataSource prop causes
        // the ListViewComponent to remount.
        if (listView) {
            listView.destroy();
            listView = null;
        }
        listHost.innerHTML = '';

        const innerHost: HTMLDivElement = document.createElement('div');
        listHost.appendChild(innerHost);

        // Use function templates (not string templates) to avoid Syncfusion's
        // template compiler (new Function) choking on complex expressions.
        // This matches how the JS version passes itemTemplate / groupTemplate functions.
        const itemTemplateFn = (d: VersionHistoryItem): string =>
            '<div class="e-list-wrapper version-item-wrapper">' +
                '<div class="version-content">' +
                    '<div class="version-label">' +
                        '<h4 class="version-title">' + (d.headerText || '') + '</h4>' +
                        (d.isAutoLabel ? '<span class="auto-badge">[auto]</span>' : '') +
                    '</div>' +
                    '<p class="version-meta">' +
                        (d.userName || '') +
                        (d.label ? ' \u00b7 ' + d.timestamp : '') +
                    '</p>' +
                '</div>' +
                '<div class="version-actions" id="vha-' + d.id + '"></div>' +
            '</div>';

        const groupTemplateFn = (d: { headerText?: string }): string =>
            '<div class="e-list-group-header"><span class="group-title">' + (d.headerText || '') + '</span></div>';

        listView = new ListView({
            dataSource: data as unknown as { [key: string]: object }[],
            fields,
            template: itemTemplateFn as unknown as string,
            groupTemplate: groupTemplateFn as unknown as string,
            showHeader: false,
            cssClass: 'e-list-template'
        });
        listView.appendTo(innerHost);
        listView.element.id = 'version-history-list';
        setTimeout(renderDropDownButtons, 0);
    }

    function update(snapshots: Snapshot[], isLoading: boolean): void {
        currentSnapshots = snapshots || [];

        if (isLoading) {
            if (listView) {
                listView.destroy();
                listView = null;
            }
            renderLoading();
            return;
        }

        const data: VersionHistoryItem[] = mapSnapshots(currentSnapshots, getUserName);

        if (data.length === 0) {
            if (listView) {
                listView.destroy();
                listView = null;
            }
            renderEmpty();
            return;
        }

        renderListView(data);
    }

    // Initial render
    update(config.snapshots, config.isLoading);

    return { update };
}
