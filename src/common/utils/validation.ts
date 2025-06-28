/**
 * Common validation utilities
 */

import { ErrorCode } from "../errors/errorTypes";
import { createError } from "../errors/customErrorHandler";

export const validateAddress = (address: string): void => {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    throw createError("Invalid Ethereum address", ErrorCode.INVALID_INPUT);
  }
};

export const validateAmount = (amount: string | number): void => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount <= 0) {
    throw createError("Invalid amount", ErrorCode.INVALID_INPUT);
  }
};

export const validateChainId = (chainId: string | number): void => {
  const numChainId =
    typeof chainId === "string" ? parseInt(chainId, 10) : chainId;
  if (isNaN(numChainId) || numChainId <= 0) {
    throw createError("Invalid chain ID", ErrorCode.INVALID_NETWORK);
  }
};
