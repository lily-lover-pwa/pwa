import { describe, expect, it } from 'vitest';
import { createMessageImageFilename } from '../src/utils/message-image.js';

describe('createMessageImageFilename', () => {
    it('uses the turn, role, and local timestamp', () => {
        const element = document.createElement('div');
        element.className = 'message user';
        element.dataset.turn = '7';

        expect(createMessageImageFilename(element, new Date(2026, 5, 14, 9, 8, 7))).toBe(
            'PWA-lily_7_user_20260614-090807.png'
        );
    });

    it('falls back when the message has no turn number', () => {
        const element = document.createElement('div');
        element.className = 'message model';

        expect(createMessageImageFilename(element, new Date(2026, 0, 2, 3, 4, 5))).toBe(
            'PWA-lily_message_assistant_20260102-030405.png'
        );
    });
});
