/** Explicitly unsupported AmbiOS operations. This registry is intentionally
 * finite: an unknown API path is a route defect and returns 404, never a
 * catch-all 501 that could hide route or contract drift. */
import { operationPath } from "../packages/shared/operations";

export const UNSUPPORTED_API_PATHS = new Set([
  operationPath("unsupportedTunnels"),
  operationPath("unsupportedTools"),
  operationPath("unsupportedRuns"),
  operationPath("unsupportedSchedules"),
  operationPath("unsupportedOauthSecrets"),
  operationPath("unsupportedExtract"),
  operationPath("unsupportedSummarize"),
]);
