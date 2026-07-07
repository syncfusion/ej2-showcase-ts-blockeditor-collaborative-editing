export function getCollaborationUrl(roomId: string): string {
    return window.location.origin + window.location.pathname + '#' + roomId;
}

export async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textArea: HTMLTextAreaElement = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}
