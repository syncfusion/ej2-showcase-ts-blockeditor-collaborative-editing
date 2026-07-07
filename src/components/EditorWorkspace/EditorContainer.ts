import { Toolbar } from '@syncfusion/ej2-navigations';
import { Button } from '@syncfusion/ej2-buttons';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { BlockEditor, Collaboration, VersionHistory } from '@syncfusion/ej2-blockeditor';
import { ConnectionStatus } from '../common/ConnectionStatus.ts';
import { CollaborationOption } from '../Toolbar/CollaborationOption.ts';
import { turndown } from '../../services/turndownService.ts';
import type { User } from '../../utils/mockData.ts';
import type { CollaborationSettings, InlineToolbarSettings, ImageBlockSettings } from '../../services/editorService.ts';
import './EditorContainer.css';

export interface EditorContainerConfig {
    roomId: string;
    isConnected: boolean;
    collaboratorCount: number;
    blocks: unknown[];
    users: User[];
    currentUserId: string;
    collaborationSettings: CollaborationSettings;
    inlineToolbarSettings: InlineToolbarSettings;
    imageBlockSettings: ImageBlockSettings;
    onPanelToggle: (panel: 'collab' | 'versions') => void;
    onCreated: (editor: BlockEditor) => void;
}

export interface EditorContainerHandle {
    editor: BlockEditor;
    update: (newConfig: Partial<EditorContainerConfig>) => void;
}

function downloadFile(blob: Blob, filename: string): void {
    const url: string = URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function EditorContainer(container: HTMLElement, config: EditorContainerConfig): EditorContainerHandle {
    let currentConfig: EditorContainerConfig = { ...config };
    let editor: BlockEditor;
    let connectionStatusComponent: ReturnType<typeof ConnectionStatus> | null = null;
    let peopleBtn: Button | null = null;

    // Build structure
    const editorContainer: HTMLDivElement = document.createElement('div');
    editorContainer.className = 'editor-container';

    const toolbarArea: HTMLDivElement = document.createElement('div');
    toolbarArea.className = 'toolbar-area';

    const toolbarHost: HTMLDivElement = document.createElement('div');
    toolbarHost.id = 'editor-toolbar';
    toolbarArea.appendChild(toolbarHost);

    const editorArea: HTMLDivElement = document.createElement('div');
    editorArea.className = 'editor-area';

    const blockEditorHost: HTMLDivElement = document.createElement('div');
    blockEditorHost.id = 'block-editor';
    editorArea.appendChild(blockEditorHost);

    editorContainer.appendChild(toolbarArea);
    editorContainer.appendChild(editorArea);
    container.appendChild(editorContainer);

    // Left toolbar wrapper
    const leftWrapper: HTMLDivElement = document.createElement('div');
    leftWrapper.className = 'collaboration-toolbar-wrapper';

    const sectionLeft: HTMLDivElement = document.createElement('div');
    sectionLeft.className = 'toolbar-section-left';

    const sectionRight: HTMLDivElement = document.createElement('div');
    sectionRight.className = 'toolbar-section-right';

    leftWrapper.appendChild(sectionLeft);
    leftWrapper.appendChild(sectionRight);

    // Right toolbar wrapper
    const rightWrapper: HTMLDivElement = document.createElement('div');
    rightWrapper.className = 'toolbar-right';

    const peopleBtnHost: HTMLButtonElement = document.createElement('button');
    const exportBtnHost: HTMLButtonElement = document.createElement('button');
    const panelBtnHost: HTMLButtonElement = document.createElement('button');

    rightWrapper.appendChild(peopleBtnHost);
    rightWrapper.appendChild(exportBtnHost);
    rightWrapper.appendChild(panelBtnHost);

    // Toolbar
    const toolbar: Toolbar = new Toolbar({
        cssClass: 'editor-toolbar',
        items: [
            { type: 'Input', template: leftWrapper, align: 'Left' },
            { type: 'Input', template: rightWrapper, align: 'Right' }
        ]
    });
    toolbar.appendTo(toolbarHost);

    // CollaborationOption
    CollaborationOption(sectionLeft, { roomId: currentConfig.roomId });

    // ConnectionStatus
    connectionStatusComponent = ConnectionStatus(sectionRight, currentConfig.isConnected);

    // People count button
    const collaboratorCount: number = currentConfig.collaboratorCount || 1;
    peopleBtn = new Button({
        iconCss: 'e-icons e-people',
        cssClass: 'e-small e-info',
        content: `${collaboratorCount} ${collaboratorCount === 1 ? 'person' : 'people'}`
    });
    peopleBtn.appendTo(peopleBtnHost);

    // Export DropDownButton
    const exportDdb: DropDownButton = new DropDownButton({
        items: [
            { text: 'Export as JSON', id: 'export-json', iconCss: 'e-icons e-download' },
            { text: 'Export as HTML', id: 'export-html', iconCss: 'e-icons e-download' },
            { text: 'Export as Markdown', id: 'export-markdown', iconCss: 'e-icons e-download' }
        ],
        cssClass: 'export-button e-small',
        iconCss: 'e-icons e-download',
        content: 'Export',
        select: (args: { item: { text: string } }): void => { handleExport(args); }
    });
    exportDdb.appendTo(exportBtnHost);

    // Panel toggle DropDownButton
    const panelDdb: DropDownButton = new DropDownButton({
        items: [
            { text: 'Active Collaborators', id: 'show-collaborators', iconCss: 'e-icons e-people' },
            { text: 'Version History', id: 'show-versions', iconCss: 'e-icons e-history' }
        ],
        cssClass: 'panel-toggle-dropdown e-caret-hide e-small',
        iconCss: 'e-icons e-more-vertical-2',
        select: (args: { item: { id: string } }): void => { handlePanelToggle(args); }
    });
    panelDdb.appendTo(panelBtnHost);

    function handleExport(args: { item: { text: string } }): void {
        if (!editor) return;
        const selected: string = (args.item.text || '').toLowerCase();
        const format: string = selected.indexOf('json') !== -1 ? 'json' :
            (selected.indexOf('markdown') !== -1 ? 'markdown' : 'html');
        try {
            if (format === 'json') {
                const data: unknown = editor.getDataAsJson();
                const blob: Blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                downloadFile(blob, `editor-${Date.now()}.json`);
            } else if (format === 'html') {
                const htmlData: string = editor.getDataAsHtml();
                const htmlBlob: Blob = new Blob([htmlData], { type: 'text/html' });
                downloadFile(htmlBlob, `editor-${Date.now()}.html`);
            } else if (format === 'markdown') {
                const htmlContent: string = editor.getDataAsHtml();
                const markdownContent: string = turndown(htmlContent || '');
                const mdBlob: Blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
                downloadFile(mdBlob, `editor-${Date.now()}.md`);
            }
        } catch (error: unknown) {
            console.error('Export failed:', error);
        }
    }

    function handlePanelToggle(args: { item: { id: string } }): void {
        const action: string = args.item.id;
        if (action === 'show-collaborators') {
            currentConfig.onPanelToggle('collab');
        } else if (action === 'show-versions') {
            currentConfig.onPanelToggle('versions');
        }
    }

    // Inject services and initialise BlockEditor
    BlockEditor.Inject(Collaboration, VersionHistory);
    editor = new BlockEditor({
        height: '600px',
        width: 'auto',
        blocks: currentConfig.blocks as never,
        users: currentConfig.users as never,
        currentUserId: currentConfig.currentUserId,
        collaborationSettings: currentConfig.collaborationSettings as never,
        created: (): void => {
            if (currentConfig.onCreated) {
                currentConfig.onCreated(editor);
            }
        },
        inlineToolbarSettings: currentConfig.inlineToolbarSettings as never,
        imageBlockSettings: currentConfig.imageBlockSettings as never
    });
    editor.appendTo(blockEditorHost);

    function update(newConfig: Partial<EditorContainerConfig>): void {
        currentConfig = { ...currentConfig, ...newConfig };

        if (connectionStatusComponent && newConfig.isConnected !== undefined) {
            connectionStatusComponent.update(newConfig.isConnected);
        }

        if (peopleBtn && newConfig.collaboratorCount !== undefined) {
            const count: number = newConfig.collaboratorCount;
            peopleBtn.content = `${count} ${count === 1 ? 'person' : 'people'}`;
            peopleBtn.dataBind();
        }

        if (editor && newConfig.users !== undefined) {
            (editor as unknown as { users: User[] }).users = newConfig.users;
            editor.dataBind();
        }
    }

    return { editor, update };
}
