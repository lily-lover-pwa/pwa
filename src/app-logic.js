// appLogic（Phase 1 で app.js から抽出 → Phase 3 で機能別モジュールへ分割）。挙動は不変。
// 全メソッドは単一の appLogic オブジェクトに合成され、this 参照は従来通り解決される。
import { profileMethods } from './app-logic/profile.js';
import { lifecycleMethods } from './app-logic/lifecycle.js';
import { syncMethods } from './app-logic/sync.js';
import { chatMethods } from './app-logic/chat.js';
import { messageMethods } from './app-logic/message.js';
import { attachmentMethods } from './app-logic/attachment.js';
import { mediaMethods } from './app-logic/media.js';
import { memoryMethods } from './app-logic/memory.js';

export const appLogic = Object.assign(
    {},
    profileMethods,
    lifecycleMethods,
    syncMethods,
    chatMethods,
    messageMethods,
    attachmentMethods,
    mediaMethods,
    memoryMethods
);
