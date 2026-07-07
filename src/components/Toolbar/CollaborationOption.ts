import { TextBox } from '@syncfusion/ej2-inputs';
import { Button } from '@syncfusion/ej2-buttons';
import { getCollaborationUrl, copyToClipboard } from '../../utils/urlHelpers.ts';
import './CollaborationOption.css';

export interface CollaborationOptionConfig {
    roomId: string;
}

export function CollaborationOption(container: HTMLElement, config: CollaborationOptionConfig): Record<string, never> {
    let copied: boolean = false;
    let copyTimer: ReturnType<typeof setTimeout> | null = null;
    const collaborationUrl: string = getCollaborationUrl(config.roomId);

    // Label
    const label: HTMLLabelElement = document.createElement('label');
    label.htmlFor = 'collab-url';
    label.className = 'toolbar-label';
    label.textContent = '⚡ Share Collaboration URL';

    // Room URL container
    const urlContainer: HTMLDivElement = document.createElement('div');
    urlContainer.className = 'room-url-container';

    // TextBox host
    const textBoxHost: HTMLInputElement = document.createElement('input');
    textBoxHost.id = 'collab-url';
    textBoxHost.type = 'text';
    urlContainer.appendChild(textBoxHost);

    // Copy button host
    const copyBtnHost: HTMLButtonElement = document.createElement('button');
    urlContainer.appendChild(copyBtnHost);

    container.appendChild(label);
    container.appendChild(urlContainer);

    // Initialize TextBox
    const textBox: TextBox = new TextBox({
        value: collaborationUrl,
        readonly: true,
        cssClass: 'e-small',
        width: '320px'
    });
    textBox.appendTo(textBoxHost);

    // Initialize copy Button
    const copyBtn: Button = new Button({
        cssClass: 'copy-button e-small',
        iconCss: 'e-icons e-copy'
    });
    copyBtn.appendTo(copyBtnHost);
    copyBtn.element.setAttribute("title", "Copy collaboration link");

    copyBtnHost.addEventListener('click', (): void => {
        copyToClipboard(collaborationUrl).then((): void => {
            if (copied) return;
            copied = true;
            const iconEl: Element | null = copyBtnHost.querySelector('.e-btn-icon');
            if (iconEl) { iconEl.className = 'e-btn-icon e-icons e-check'; }
            if (copyTimer) clearTimeout(copyTimer);
            copyTimer = setTimeout((): void => {
                copied = false;
                const iconElReset: Element | null = copyBtnHost.querySelector('.e-btn-icon');
                if (iconElReset) { iconElReset.className = 'e-btn-icon e-icons e-copy'; }
            }, 2000);
        }).catch((err: unknown): void => {
            console.error('Failed to copy link:', err);
        });
    });

    return {};
}
