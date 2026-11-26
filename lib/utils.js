export function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
export async function delay(ms = 0) {
    if (!ms || typeof ms !== 'number' || ms <= 0)
        return;
    return await new Promise((resolve) => setTimeout(resolve, ms));
}
