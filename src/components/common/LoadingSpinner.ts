import { createSpinner, showSpinner, hideSpinner } from '@syncfusion/ej2-popups';

export interface LoadingSpinnerHandle {
    destroy: () => void;
}

export function LoadingSpinner(container: HTMLElement, message: string): LoadingSpinnerHandle {
    const loadingContainer: HTMLDivElement = document.createElement('div');
    loadingContainer.className = 'loading-container';

    const spinnerHost: HTMLDivElement = document.createElement('div');
    spinnerHost.className = 'spinner-host';

    const loadingText: HTMLParagraphElement = document.createElement('p');
    loadingText.className = 'loading-text';
    loadingText.textContent = message;

    loadingContainer.appendChild(spinnerHost);
    loadingContainer.appendChild(loadingText);
    container.appendChild(loadingContainer);

    createSpinner({ target: spinnerHost });
    showSpinner(spinnerHost);

    return {
        destroy(): void {
            hideSpinner(spinnerHost);
            if (loadingContainer.parentElement) {
                loadingContainer.parentElement.removeChild(loadingContainer);
            }
        }
    };
}
