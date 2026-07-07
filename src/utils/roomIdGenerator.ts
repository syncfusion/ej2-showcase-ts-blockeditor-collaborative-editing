const ROOM_ID_LENGTH = 5;
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateRoomId(): string {
    let result: string = '';
    for (let i: number = 0; i < ROOM_ID_LENGTH; i++) {
        result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return result;
}

export function getRoomIdFromHash(): string {
    const hash: string = window.location.hash;
    if (hash && hash.length > 1) {
        return hash.slice(1);
    }
    return '';
}

export function setRoomIdInHash(roomId: string): void {
    window.location.hash = roomId;
}

export function getOrCreateRoomId(): string {
    const existing: string = getRoomIdFromHash();
    if (existing) return existing;
    const newId: string = generateRoomId();
    setRoomIdInHash(newId);
    return newId;
}
