/**
 * Friendly aliases over the generated OpenAPI types (types.gen.ts — regenerate with
 * `npm run generate:types` after any server contract change). Server renames become
 * compile errors here, which is the whole point.
 */
import type { components } from './types.gen'

export type AccountResponse = components['schemas']['AccountResponse']
export type AccountSummaryResponse = components['schemas']['AccountSummaryResponse']
export type TransactionResponse = components['schemas']['TransactionResponse']
export type TransactionPage = components['schemas']['PageResponseTransactionResponse']
export type MonzoConnectInitResponse = components['schemas']['MonzoConnectInitResponse']
export type MonzoSyncProgressResponse = components['schemas']['MonzoSyncProgressResponse']
export type AccountProgress = components['schemas']['AccountProgress']
export type MonzoStatusResponse = components['schemas']['MonzoStatusResponse']
