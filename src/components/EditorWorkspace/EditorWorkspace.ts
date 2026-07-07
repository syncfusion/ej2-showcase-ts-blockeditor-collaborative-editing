import { Sidebar } from '@syncfusion/ej2-navigations';
import { EditorContainer } from './EditorContainer.ts';
import { SidebarContent } from './SidebarContent.ts';
import type { BlockEditor } from '@syncfusion/ej2-blockeditor';
import type { User } from '../../utils/mockData.ts';
import type { Snapshot } from '../../services/versionHistoryService.ts';
import type { CollaborationSettings, InlineToolbarSettings, ImageBlockSettings } from '../../services/editorService.ts';
import './EditorWorkspace.css';

export interface EditorWorkspaceConfig {
    roomId: string;
    isConnected: boolean;
    currentUser: User;
    collaborators: User[];
    blocks: unknown[];
    users: User[];
    currentUserId: string;
    collaborationSettings: CollaborationSettings;
    snapshots: Snapshot[];
    snapshotsLoading: boolean;
    inlineToolbarSettings: InlineToolbarSettings;
    imageBlockSettings: ImageBlockSettings;
    onRestoreSnapshot: (id: string) => void;
    onDeleteSnapshot: (id: string) => void;
    onRenameSnapshot: (id: string, label: string) => void;
    onClearAllSnapshots: () => void;
    onCreated: (editor: BlockEditor) => void;
}

export interface EditorWorkspaceHandle {
    update: (newConfig: Partial<EditorWorkspaceConfig>) => void;
}

export function EditorWorkspace(container: HTMLElement, config: EditorWorkspaceConfig): EditorWorkspaceHandle {
    let currentConfig: EditorWorkspaceConfig = { ...config };
    let activePanel: 'collab' | 'versions' | null = null;
    let sidebar: Sidebar | null = null;
    let sidebarContentComponent: ReturnType<typeof SidebarContent> | null = null;
    let editorContainerComponent: ReturnType<typeof EditorContainer> | null = null;

    // Build structure
    const section: HTMLElement = document.createElement('section');
    section.className = 'editor-workspace';

    const innerDiv: HTMLDivElement = document.createElement('div');

    const editorContainerArea: HTMLDivElement = document.createElement('div');
    editorContainerArea.id = 'editor-container-area';

    const sidebarHost: HTMLDivElement = document.createElement('div');
    sidebarHost.id = 'sidebar';
    sidebarHost.className = 'syncfusion-sidebar';

    innerDiv.appendChild(editorContainerArea);
    innerDiv.appendChild(sidebarHost);
    section.appendChild(innerDiv);
    container.appendChild(section);

    // Init EditorContainer first so block-editor element exists before Sidebar is created
    editorContainerComponent = EditorContainer(editorContainerArea, {
        roomId: currentConfig.roomId,
        isConnected: currentConfig.isConnected,
        collaboratorCount: (currentConfig.collaborators ? currentConfig.collaborators.length : 0) + 1,
        blocks: currentConfig.blocks,
        users: currentConfig.users,
        currentUserId: currentConfig.currentUserId,
        collaborationSettings: currentConfig.collaborationSettings,
        inlineToolbarSettings: currentConfig.inlineToolbarSettings,
        imageBlockSettings: currentConfig.imageBlockSettings,
        onPanelToggle: (panel: 'collab' | 'versions'): void => { handleTogglePanel(panel); },
        onCreated: (editor: BlockEditor): void => {
            if (currentConfig.onCreated) {
                currentConfig.onCreated(editor);
            }
        }
    });

    // Use .editor-area div as sidebar target (parent of #block-editor)
    const blockEditorEl: HTMLElement | null = editorContainerArea.querySelector('#block-editor');
    const sidebarTarget: HTMLElement = blockEditorEl ? blockEditorEl.parentElement! : innerDiv;

    // Init Sidebar after EditorContainer so target element exists
    sidebar = new Sidebar({
        type: 'Push',
        position: 'Right',
        width: '300px',
        showBackdrop: false,
        isOpen: false,
        target: sidebarTarget,
        created: (): void => {
            sidebar!.element.style.visibility = '';
        },
        close: (): void => {
            activePanel = null;
            renderSidebarContent();
        }
    });
    sidebar.appendTo(sidebarHost);

    function handleTogglePanel(panel: 'collab' | 'versions'): void {
        if (activePanel === panel) {
            activePanel = null;
            sidebar!.hide();
            renderSidebarContent();
        } else {
            activePanel = panel;
            renderSidebarContent();
            sidebar!.show();
        }
    }

    function renderSidebarContent(): void {
        const sidebarEl: HTMLElement = sidebar!.element;

        // Clear existing sidebar content
        while (sidebarEl.firstChild) {
            sidebarEl.removeChild(sidebarEl.firstChild);
        }

        if (sidebarContentComponent && sidebarContentComponent.destroy) {
            sidebarContentComponent.destroy();
            sidebarContentComponent = null;
        }

        if (!activePanel) return;

        sidebarContentComponent = SidebarContent(sidebarEl, {
            mode: activePanel === 'collab' ? 'collaborators' : 'versions',
            editorRef: { current: editorContainerComponent ? editorContainerComponent.editor : null },
            collaborators: currentConfig.collaborators || [],
            currentUser: currentConfig.currentUser,
            snapshots: currentConfig.snapshots || [],
            isLoading: currentConfig.snapshotsLoading || false,
            onClose: (): void => {
                activePanel = null;
                sidebar!.hide();
                renderSidebarContent();
            },
            onRestore: currentConfig.onRestoreSnapshot,
            onDelete: currentConfig.onDeleteSnapshot,
            onRename: currentConfig.onRenameSnapshot,
            onClearAll: currentConfig.onClearAllSnapshots
        });
    }

    function update(newConfig: Partial<EditorWorkspaceConfig>): void {
        currentConfig = { ...currentConfig, ...newConfig };

        // Update EditorContainer
        if (editorContainerComponent) {
            const containerUpdate: Partial<Parameters<typeof EditorContainer>[1]> = {};
            if (newConfig.isConnected !== undefined) containerUpdate.isConnected = newConfig.isConnected;
            if (newConfig.collaborators !== undefined) {
                containerUpdate.collaboratorCount = newConfig.collaborators.length + 1;
                containerUpdate.users = [currentConfig.currentUser, ...newConfig.collaborators];
            }
            editorContainerComponent.update(containerUpdate);
        }

        // Update sidebar content if open
        if (sidebarContentComponent && activePanel) {
            const sidebarUpdate: Parameters<typeof sidebarContentComponent.update>[0] = {};
            if (newConfig.collaborators !== undefined) sidebarUpdate.collaborators = newConfig.collaborators;
            if (newConfig.currentUser !== undefined) sidebarUpdate.currentUser = newConfig.currentUser;
            if (newConfig.snapshots !== undefined) sidebarUpdate.snapshots = newConfig.snapshots;
            if (newConfig.snapshotsLoading !== undefined) sidebarUpdate.isLoading = newConfig.snapshotsLoading;
            if (Object.keys(sidebarUpdate).length > 0) {
                sidebarContentComponent.update(sidebarUpdate);
            }
        }
    }

    return { update };
}
