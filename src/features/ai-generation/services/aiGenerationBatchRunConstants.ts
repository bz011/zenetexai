/**
 * Shared between aiGenerationBatchRunService.ts (a "use server" file, which
 * may only export async functions - not a const) and the UI components that
 * need the same number to show/disable the "Generate now" button correctly.
 */
export const MAX_UI_RUN_COUNT = 20;
