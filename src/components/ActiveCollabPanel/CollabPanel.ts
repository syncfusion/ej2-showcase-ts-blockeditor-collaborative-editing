import { ListView } from '@syncfusion/ej2-lists';
import type { FieldSettingsModel } from '@syncfusion/ej2-lists';
import type { User } from '../../utils/mockData.ts';
import './CollabPanel.css';

export interface CollabPanelConfig {
    collaborators: User[];
    currentUser: User;
}

export interface CollabPanelHandle {
    update: (collaborators: User[], currentUser: User) => void;
}

interface ListViewItem {
    id: string;
    headerText: string;
    contentText: string;
    avatarText: string;
    avatarColor: string;
}

function getInitials(name: string | undefined): string {
    if (!name) return '';
    return name
        .split(' ')
        .map((n: string): string => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function buildDataSource(collaborators: User[], currentUser: User): ListViewItem[] {
    const allUsers: User[] = [currentUser, ...collaborators];
    return allUsers.map((user: User): ListViewItem => ({
        id: user.id,
        headerText: user.id === currentUser.id ? `${user.user} (You)` : user.user,
        contentText: 'Active',
        avatarText: getInitials(user.user),
        avatarColor: user.avatarBgColor
    }));
}

export function CollabPanel(container: HTMLElement, config: CollabPanelConfig): CollabPanelHandle {
    const panel: HTMLDivElement = document.createElement('div');
    panel.className = 'collab-panel';

    const listContainer: HTMLDivElement = document.createElement('div');
    listContainer.className = 'collaborators-list';
    panel.appendChild(listContainer);

    const listHost: HTMLUListElement = document.createElement('ul');
    listContainer.appendChild(listHost);

    container.appendChild(panel);

    const fields: FieldSettingsModel = {
        id: 'id',
        text: 'headerText'
    };

    const listView: ListView = new ListView({
        dataSource: buildDataSource(config.collaborators, config.currentUser) as unknown as { [key: string]: object }[],
        fields,
        template: `<div class="e-list-wrapper collaborator-item">
            <span class="e-avatar e-avatar-circle e-avatar-small"
                style="background-color: \${avatarColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;">
                \${avatarText}
            </span>
            <div class="collaborator-info">
                <span class="e-list-item-header">\${headerText}</span>
            </div>
        </div>`,
        showHeader: false,
        cssClass: 'e-list-template'
    });
    listView.appendTo(listHost);

    function renderAvatars(): void {
        const avatarEls: NodeListOf<Element> = listHost.querySelectorAll('.e-avatar');
        const dataSource: ListViewItem[] = buildDataSource(config.collaborators, config.currentUser);
        avatarEls.forEach((el: Element, idx: number): void => {
            if (dataSource[idx]) {
                el.textContent = dataSource[idx].avatarText;
            }
        });
    }

    setTimeout(renderAvatars, 0);

    function update(collaborators: User[], currentUser: User): void {
        config.collaborators = collaborators;
        config.currentUser = currentUser;
        listView.dataSource = buildDataSource(collaborators, currentUser) as unknown as { [key: string]: object }[];
        listView.dataBind();
        setTimeout(renderAvatars, 0);
    }

    return { update };
}
