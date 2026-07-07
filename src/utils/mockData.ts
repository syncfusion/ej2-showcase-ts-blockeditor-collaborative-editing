import { BlockType, ContentType, type BlockModel } from '@syncfusion/ej2-blockeditor';

export interface UserColor {
    light: string;
    dark: string;
}

export interface User {
    id: string;
    user: string;
    avatarBgColor: string;
}

const FIRST_NAMES: string[] = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan',
    'Fiona', 'George', 'Hannah', 'Ivan', 'Julia',
    'Kevin', 'Laura', 'Mike', 'Nina', 'Oscar',
    'Paula', 'Quinn', 'Rachel', 'Sam', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xander', 'Yara',
    'Zoe', 'Aaron', 'Bella', 'Carlos', 'Daisy',
    'Eli', 'Faith', 'Gavin', 'Holly', 'Ian',
    'Jade', 'Kyle', 'Lily', 'Mason', 'Nora',
    'Owen', 'Penny', 'Ryan', 'Sara', 'Tyler',
    'Una', 'Vera', 'Will', 'Xena'
];

const LAST_NAMES: string[] = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor',
    'Anderson', 'Thomas', 'Jackson', 'White', 'Harris',
    'Martin', 'Thompson', 'Moore', 'Young', 'Allen',
    'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
    'Hill', 'Flores', 'Green', 'Adams', 'Nelson',
    'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
    'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans',
    'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
    'Collins', 'Reyes', 'Stewart', 'Morris'
];

const DEFAULT_COLORS: UserColor[] = [
    { light: '#e3f2fd', dark: '#1565c0' },
    { light: '#f3e5f5', dark: '#6a1b9a' },
    { light: '#e8f5e9', dark: '#2e7d32' },
    { light: '#fff3e0', dark: '#e65100' },
    { light: '#fce4ec', dark: '#880e4f' },
    { light: '#e0f2f1', dark: '#00695c' },
    { light: '#fff8e1', dark: '#f57f17' },
    { light: '#f1f8e9', dark: '#33691e' },
    { light: '#e8eaf6', dark: '#283593' },
    { light: '#fbe9e7', dark: '#bf360c' },
    { light: '#e0f7fa', dark: '#006064' },
    { light: '#f9fbe7', dark: '#827717' },
    { light: '#ede7f6', dark: '#4527a0' },
    { light: '#e1f5fe', dark: '#01579b' },
    { light: '#ffebee', dark: '#b71c1c' },
    { light: '#e8f5e9', dark: '#1b5e20' },
    { light: '#fff9c4', dark: '#f9a825' },
    { light: '#fbe9e7', dark: '#e64a19' },
    { light: '#e3f2fd', dark: '#0d47a1' },
    { light: '#f8bbd0', dark: '#880e4f' },
    { light: '#c8e6c9', dark: '#388e3c' },
    { light: '#ffe0b2', dark: '#e65100' },
    { light: '#b2dfdb', dark: '#00796b' },
    { light: '#dcedc8', dark: '#558b2f' },
    { light: '#b3e5fc', dark: '#0288d1' },
    { light: '#d1c4e9', dark: '#512da8' },
    { light: '#ffccbc', dark: '#d84315' },
    { light: '#cfd8dc', dark: '#37474f' },
    { light: '#f8bbd0', dark: '#c2185b' },
    { light: '#b2ebf2', dark: '#0097a7' },
    { light: '#f0f4c3', dark: '#9e9d24' },
    { light: '#d7ccc8', dark: '#4e342e' },
    { light: '#c5cae9', dark: '#303f9f' },
    { light: '#ffecb3', dark: '#ffa000' },
    { light: '#b3e5fc', dark: '#0277bd' }
];

export const DEFAULT_EDITOR_BLOCKS: BlockModel[] = [
    {
        blockType: BlockType.Heading,
        properties: { level: 3 },
        id: 'block-1',
        content: [{ contentType: ContentType.Text, content: 'Welcome to Collaborative Block Editor' }]
    },
    {
        blockType: BlockType.Paragraph,
        id: 'block-2',
        content: [{ contentType: ContentType.Text, content: 'This is a real-time collaborative editor powered by Syncfusion and Yjs. Multiple users can edit this document simultaneously.' }]
    },
    {
        blockType: BlockType.Paragraph,
        id: 'block-3',
        content: [{ contentType: ContentType.Text, content: 'Start typing to collaborate. Share the URL with others to invite them to this session.' }]
    }
];

export function colorForUser(user: User): UserColor {
    const str: string = user.id || user.user || '';
    let hash: number = 0;
    for (let i: number = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash |= 0;
    }
    const index: number = Math.abs(hash) % DEFAULT_COLORS.length;
    return DEFAULT_COLORS[index];
}

export function generateUser(): User {
    const firstName: string = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName: string = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name: string = `${firstName} ${lastName}`;
    const id: string = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const tempUser: User = { id, user: name, avatarBgColor: '' };
    const color: UserColor = colorForUser(tempUser);
    return { id, user: name, avatarBgColor: color.dark };
}
