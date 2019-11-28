/**
 * Truncated exponential backoff default policy for the Waterfall retry
 * see https://en.wikipedia.org/wiki/Exponential_backoff
 * @param {number} slotTime
 * @param {number} truncate
 * @returns {(attempt: number, websocket: WebSocket) => number}
 */
export const exponentialTruncatedBackoff = (slotTime: number = 100, truncate: number = Number.MAX_VALUE) => {
    return (attempt: number, websocket: WebSocket): number => {
        return Math.random() * slotTime * (Math.pow(2 , Math.min(attempt, truncate)) - 1);
    };
};
