export const exponentialTruncatedBackoff = (slotTime: number = 100, truncate: number = Number.MAX_VALUE) => {
    return (attempt: number, websocket: WebSocket): number => {
        return Math.random() * slotTime * (2 ^ Math.min(attempt, truncate) - 1);
    };
};