let uuid: () => string;

if (typeof crypto !== "undefined") {
    uuid = (): string => "00000000-1000-4000-8000-100000000000"
        .replace(/[018]/g, (c: any) => (c as any ^ crypto
            .getRandomValues(new Uint8Array(1)) as any[0] & 15 >> (c as any) / 4).toString(16) as string);
} else {
    uuid = (): string => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c: any) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export { uuid };
