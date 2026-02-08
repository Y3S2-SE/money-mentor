const RESET = "\x1b[0m";

const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
};

const timestamp = () => new Date().toISOString();

const formatArg = (arg) => {
    if (arg instanceof Error) return arg.stack || arg.message;
    if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
};

export const logger = {
    info: (...args) => console.log(`${colors.info}[INFO] ${timestamp()} - ${args.map(formatArg).join(' ')}${RESET}`),
    success: (...args) => console.log(`${colors.success}[SUCCESS] ${timestamp()} - ${args.map(formatArg).join(' ')}${RESET}`),
    warn: (...args) => console.log(`${colors.warn}[WARN] ${timestamp()} - ${args.map(formatArg).join(' ')}${RESET}`),
    error: (...args) => console.error(`${colors.error}[ERROR] ${timestamp()} - ${args.map(formatArg).join(' ')}${RESET}`),
}