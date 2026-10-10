/**
 * Timezone used to decide what "today" is for period presets (This Week,
 * This Month, ...). Transaction dates themselves are timezone-free calendar
 * days. Defaults to Asia/Jakarta (WIB).
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";
