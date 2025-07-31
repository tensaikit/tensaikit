import { z } from "zod";

/**
 * Input schema for Morpho Blue get market information.
 */
export const GetMarketInfoSchema = z
  .object({
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The unique bytes32 identifier of the Morpho Blue market"),
  })
  .describe("Input schema for fetching Morpho Blue market parameters");

export const GetMarketStatesSchema = z
  .object({
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The unique bytes32 identifier of the Morpho Blue market"),
  })
  .describe("Input schema for fetching Morpho Blue market state");

export const GetMarketPositionInfoSchema = z
  .object({
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The unique bytes32 identifier of the Morpho Blue market"),
  })
  .describe("Input schema for fetching Position on Morpho Blue market");

/**
 * Input schema for Morpho Blue supply action.
 */
export const SupplySchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe("The quantity of loanToken assets to supply, in whole units"),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to supply into"),
  })
  .describe("Input schema for Morpho Blue supply action");

/**
 * Input schema for Morpho Vault withdraw action.
 */
export const WithdrawSchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe("The quantity of loanToken assets to withdraw, in whole units"),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to withdraw from"),
  })
  .describe("Input schema for Morpho Blue withdraw action");

/**
 * Input schema for Morpho Blue supply collateral action.
 */
export const SupplyCollateralSchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe(
        "The quantity of collateralToken assets to supply, in whole units"
      ),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to supply collateral into"),
  })
  .describe("Input schema for Morpho Blue supply collateral action");

/**
 * Input schema for Morpho Blue withdraw collateral action.
 */
export const WithdrawCollateralSchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe(
        "The quantity of collateralToken assets to withdraw, in whole units"
      ),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to withdraw collateral from"),
  })
  .describe("Input schema for Morpho Blue withdraw collateral action");

/**
 * Input schema for Morpho Blue borrow action.
 */
export const BorrowSchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe("The quantity of loanToken assets to borrow, in whole units"),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to borrow from"),
  })
  .describe("Input schema for Morpho Blue borrow action");

/**
 * Input schema for Morpho Blue repay action.
 */
export const RepaySchema = z
  .object({
    assets: z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Must be a valid integer or decimal value")
      .describe("The quantity of loanToken assets to repay, in whole units"),
    marketId: z
      .string()
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid marketId (bytes32 hex)")
      .describe("The market ID (bytes32) to repay"),
  })
  .describe("Input schema for Morpho Blue repay action");

export const LenderInterestRateSchema = z.object({
  skip: z.number().int().min(0, "Skip must be 0 or greater"),
  first: z
    .number()
    .int()
    .min(1, "Minimum value must be 1")
    .max(100, "Maximum value allowed is 100"),
});

export const BorrowerInterestRateSchema = z.object({
  skip: z.number().int().min(0, "Skip must be 0 or greater"),
  first: z
    .number()
    .int()
    .min(1, "Minimum value must be 1")
    .max(100, "Maximum value allowed is 100"),
});

export const ActiveMarketsQuerySchema = z.object({
  skip: z.number().int().min(0, "Skip must be 0 or greater"),
  first: z
    .number()
    .int()
    .min(1, "Minimum value must be 1")
    .max(100, "Maximum value allowed is 100"),
});

export const WhitelistedVaultsQuerySchema = z.object({
  skip: z.number().int().min(0, "Skip must be 0 or greater"),
  first: z
    .number()
    .int()
    .min(1, "Minimum value must be 1")
    .max(100, "Maximum value allowed is 100"),
});

export const MarketStateByUniqueKeySchema = z.object({
  uniqueKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid uniqueKey (bytes32 hex)")
    .describe("Unique market identifier (bytes32 hex string)"),
});

export const CuratorsQuerySchema = z.object({});

export const UserDataQuerySchema = z.object({});
