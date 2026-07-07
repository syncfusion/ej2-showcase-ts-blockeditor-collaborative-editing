import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const turndownService: TurndownService = new TurndownService({
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
    bulletListMarker: '-',
    headingStyle: 'atx'
});

turndownService.use(gfm);

export function turndown(html: string): string {
    return turndownService.turndown(html);
}
