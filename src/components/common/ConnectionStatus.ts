import './ConnectionStatus.css';

export interface ConnectionStatusHandle {
    update: (connected: boolean) => void;
}

export function ConnectionStatus(container: HTMLElement, isConnected: boolean): ConnectionStatusHandle {
    const wrapper: HTMLDivElement = document.createElement('div');
    wrapper.className = 'connection-status';

    const indicator: HTMLSpanElement = document.createElement('span');
    indicator.className = 'status-indicator';

    const statusText: HTMLSpanElement = document.createElement('span');
    statusText.className = 'status-text';

    wrapper.appendChild(indicator);
    wrapper.appendChild(statusText);
    container.appendChild(wrapper);

    function update(connected: boolean): void {
        if (connected) {
            indicator.classList.remove('disconnected');
            indicator.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            indicator.classList.remove('connected');
            indicator.classList.add('disconnected');
            statusText.textContent = 'Connecting...';
        }
    }

    update(isConnected);

    return { update };
}
