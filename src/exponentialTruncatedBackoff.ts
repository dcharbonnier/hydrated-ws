import {AdvancedWebSocket} from "./AdvancedWebSocket";

export const exponentialTruncatedBackoff = (slotTime: number = 100, truncate: number = Number.MAX_VALUE) => {
    return (attempt: number, websocket: AdvancedWebSocket): number => {
        return Math.random() * slotTime * (2 ^ Math.min(attempt, truncate) - 1);
    };
};