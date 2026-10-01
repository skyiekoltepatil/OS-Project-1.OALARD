/**
 * Validation helpers for process input.
 * Pure functions — no React, no DOM.
 */

export interface ValidationResult {
  readonly valid: boolean;
  readonly message?: string;
}

const INTEGER_RE = /^-?\d+$/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

/** Parse a raw form value into a number, or null when invalid. */
export function parseNumericField(raw: string): number | null {
  const trimmed = raw.trim();
  if (!NUMBER_RE.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Validate the process id: non-empty and unique within the list. */
export function validatePid(pid: string, allPids: readonly string[], selfIndex?: number): ValidationResult {
  const trimmed = pid.trim();
  if (!trimmed) return { valid: false, message: 'PID is required.' };
  if (trimmed.length > 12) return { valid: false, message: 'PID must be 12 characters or fewer.' };
  const duplicate = allPids.some((p, i) => p === trimmed && i !== selfIndex);
  if (duplicate) return { valid: false, message: `PID "${trimmed}" already exists. PIDs must be unique.` };
  return { valid: true };
}

/** Validate arrival time: an integer >= 0. */
export function validateArrivalTime(raw: string): ValidationResult {
  if (!INTEGER_RE.test(raw.trim())) {
    return { valid: false, message: 'Arrival time must be a non-negative integer.' };
  }
  const value = Number(raw.trim());
  if (value < 0) return { valid: false, message: 'Arrival time must be >= 0.' };
  if (value > 100000) return { valid: false, message: 'Arrival time must be <= 100000.' };
  return { valid: true };
}

/** Validate burst time: a number > 0 (integers and one-decimal values allowed). */
export function validateBurstTime(raw: string): ValidationResult {
  const value = parseNumericField(raw);
  if (value === null) {
    return { valid: false, message: 'Burst time must be a positive number.' };
  }
  if (value <= 0) return { valid: false, message: 'Burst time must be > 0.' };
  if (value > 100000) return { valid: false, message: 'Burst time must be <= 100000.' };
  return { valid: true };
}

/** Validate priority: an integer within the accepted range. */
export function validatePriority(raw: string): ValidationResult {
  if (!INTEGER_RE.test(raw.trim())) {
    return { valid: false, message: 'Priority must be an integer.' };
  }
  const value = Number(raw.trim());
  if (value < 0 || value > 100) {
    return { valid: false, message: 'Priority must be between 0 and 100.' };
  }
  return { valid: true };
}

/** Validate the Round Robin time quantum. */
export function validateQuantum(raw: string): ValidationResult {
  const value = parseNumericField(raw);
  if (value === null || !Number.isInteger(value)) {
    return { valid: false, message: 'Time quantum must be a positive integer.' };
  }
  if (value <= 0) return { valid: false, message: 'Time quantum must be > 0.' };
  if (value > 10000) return { valid: false, message: 'Time quantum must be <= 10000.' };
  return { valid: true };
}
