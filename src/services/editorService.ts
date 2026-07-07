import { type BlockModel } from '@syncfusion/ej2-blockeditor';
import { DEFAULT_EDITOR_BLOCKS } from '../utils/mockData.ts';

export interface CollaborationAdapter {
    yRuntime: unknown;
    yXmlFragment: unknown;
}

export interface CollaborationSettings {
    provider: unknown;
    adapter: CollaborationAdapter;
    enableAwareness: boolean;
    versionHistory: {
        storage: unknown;
        snapshotInterval: number;
        snapshotCreated: () => void;
        snapshotRestored: () => void;
    };
}

export interface InlineToolbarSettings {
    items: string[];
}

export interface ImageBlockSettings {
    saveUrl: string;
    path: string;
}

export function getDefaultBlocks(): BlockModel[] {
    return DEFAULT_EDITOR_BLOCKS.map((block: BlockModel): BlockModel => ({ ...block }));
}

export function getInlineToolbarSettings(): InlineToolbarSettings {
    return {
        items: [
            'Transform', 'Bold', 'Italic', 'Underline', 'Strikethrough',
            'Uppercase', 'Lowercase', 'Subscript', 'Superscript',
            'InlineCode', 'Link', 'Color', 'Backgroundcolor'
        ]
    };
}

export function getImageBlockSettings(): ImageBlockSettings {
    return {
        saveUrl: 'https://services.syncfusion.com/js/production/api/RichTextEditor/SaveFile',
        path: 'https://services.syncfusion.com/js/production/RichTextEditor/'
    };
}
