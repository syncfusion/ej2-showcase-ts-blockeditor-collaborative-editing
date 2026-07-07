import { generateUser } from '../utils/mockData.ts';
import type { User } from '../utils/mockData.ts';

const USER_STORAGE_KEY: string = 'blockeditor-current-user';

export function getCurrentUser(): User {
    const stored: string | null = sessionStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
        try {
            const parsed: User = JSON.parse(stored) as User;
            return parsed;
        } catch (_e: unknown) {
            // fall through to generate new user
        }
    }
    const newUser: User = generateUser();
    setCurrentUser(newUser);
    return newUser;
}

export function setCurrentUser(user: User): void {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}
