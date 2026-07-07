import { TextBox } from '@syncfusion/ej2-inputs';
import { Button } from '@syncfusion/ej2-buttons';
import './LabelRenameModal.css';

export interface LabelRenameModalHandle {
    show: (id: string, initialValue: string, onSave: (id: string, value: string) => void) => void;
    hide: () => void;
    destroy: () => void;
}

export function LabelRenameModal(title: string = 'Rename Snapshot'): LabelRenameModalHandle {
    let currentId: string = '';
    let currentOnSave: ((id: string, value: string) => void) | null = null;
    let currentValue: string = '';

    // Overlay
    const overlay: HTMLDivElement = document.createElement('div');
    overlay.className = 'rename-dialog-overlay';
    overlay.style.display = 'none';

    // Dialog
    const dialog: HTMLDivElement = document.createElement('div');
    dialog.className = 'rename-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    // Header
    const header: HTMLDivElement = document.createElement('div');
    header.className = 'rename-dialog-header';

    const titleSpan: HTMLSpanElement = document.createElement('span');
    titleSpan.textContent = title;

    const closeBtnHost: HTMLButtonElement = document.createElement('button');
    header.appendChild(titleSpan);
    header.appendChild(closeBtnHost);

    // Body
    const body: HTMLDivElement = document.createElement('div');
    body.className = 'rename-dialog-body';

    const inputHost: HTMLInputElement = document.createElement('input');
    inputHost.type = 'text';
    body.appendChild(inputHost);

    // Footer
    const footer: HTMLDivElement = document.createElement('div');
    footer.className = 'rename-dialog-footer';

    const cancelBtnHost: HTMLButtonElement = document.createElement('button');
    const saveBtnHost: HTMLButtonElement = document.createElement('button');

    footer.appendChild(cancelBtnHost);
    footer.appendChild(saveBtnHost);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Close button (EJ2 Button — set textContent after appendTo so EJ2 doesn't clear it)
    const closeBtn: Button = new Button({ cssClass: 'e-small' });
    closeBtn.appendTo(closeBtnHost);
    closeBtnHost.textContent = '×';
    closeBtnHost.addEventListener('click', hide);

    // Cancel button
    const cancelBtn: Button = new Button({ content: 'Cancel', cssClass: 'e-small' });
    cancelBtn.appendTo(cancelBtnHost);
    cancelBtnHost.addEventListener('click', hide);

    // Save button
    const saveBtn: Button = new Button({ content: 'Save', cssClass: 'e-primary e-small' });
    saveBtn.appendTo(saveBtnHost);
    saveBtnHost.addEventListener('click', doSave);

    // TextBox — track currentValue via input and change events (mirrors JS/React)
    const textBox: TextBox = new TextBox({
        placeholder: 'Enter snapshot label',
        cssClass: 'rename-input-field',
        input: (): void => {
            currentValue = textBox.value || '';
        },
        change: (e: { value: string }): void => {
            currentValue = e.value || '';
        }
    });
    textBox.appendTo(inputHost);

    // Keyboard handler on the native input element
    inputHost.addEventListener('keydown', (e: KeyboardEvent): void => {
        if (e.key === 'Enter' && currentValue.trim()) {
            doSave();
        }
        if (e.key === 'Escape') {
            hide();
        }
    });

    overlay.addEventListener('click', (e: MouseEvent): void => {
        if (e.target === overlay) hide();
    });

    function hide(): void {
        overlay.style.display = 'none';
        currentId = '';
        currentOnSave = null;
    }

    function doSave(): void {
        const value: string = currentValue.trim();
        if (value && currentOnSave && currentId) {
            currentOnSave(currentId, value);
        }
        hide();
    }

    function show(id: string, initialValue: string, onSave: (id: string, value: string) => void): void {
        currentId = id;
        currentValue = initialValue || '';
        currentOnSave = onSave;
        textBox.value = currentValue;
        textBox.dataBind();
        overlay.style.display = 'flex';
        setTimeout((): void => {
            inputHost.focus();
            inputHost.select();
        }, 50);
    }

    function destroy(): void {
        if (overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
        }
    }

    return { show, hide, destroy };
}
