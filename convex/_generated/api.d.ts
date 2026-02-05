/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as analytics from "../analytics.js";
import type * as applications from "../applications.js";
import type * as bank from "../bank.js";
import type * as categories from "../categories.js";
import type * as contacts from "../contacts.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as loans from "../loans.js";
import type * as loantype from "../loantype.js";
import type * as referees from "../referees.js";
import type * as transactions from "../transactions.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  analytics: typeof analytics;
  applications: typeof applications;
  bank: typeof bank;
  categories: typeof categories;
  contacts: typeof contacts;
  files: typeof files;
  http: typeof http;
  import: typeof import_;
  loans: typeof loans;
  loantype: typeof loantype;
  referees: typeof referees;
  transactions: typeof transactions;
  user: typeof user;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
