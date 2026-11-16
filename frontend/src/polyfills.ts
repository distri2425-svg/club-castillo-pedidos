import { Buffer } from 'buffer';

// Make Buffer available globally
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = {
    env: {},
    nextTick: (cb: Function) => setTimeout(cb, 0),
    browser: true,
};