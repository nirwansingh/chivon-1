/**
 * Simple server logger. Ensure no secrets are passed to data.
 */
export const logger = {
  info: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data ? data : '');
    }
  },
  error: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, data ? data : '');
    }
  },
  warn: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data ? data : '');
    }
  }
};
