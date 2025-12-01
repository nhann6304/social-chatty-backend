export function CheckedIsEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
}

export function CheckedIsPhone(identifier: string): boolean {
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    return phoneRegex.test(identifier);
}

