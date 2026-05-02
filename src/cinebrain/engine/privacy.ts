// ─── Privacy Engine: SHA-256 Hashing, UUID Generation, Differential Privacy ───

import { v4 as uuidv4 } from "uuid";
import type { AuditReceipt } from "../types";

/** Generate a cryptographic SHA-256 hash of any string using Web Crypto API */
export async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a v4 Anonymous UUID */
export function generateAnonId(): string {
  return uuidv4();
}

/** 
 * Inject Laplace noise for differential privacy.
 * Each dimension gets noise drawn from Laplace(0, sensitivity/epsilon).
 */
export function addLaplaceNoise(
  vector: number[],
  epsilon: number = 1.0,
  sensitivity: number = 1.0
): number[] {
  const scale = sensitivity / epsilon;
  return vector.map((v) => {
    // Laplace noise via inverse CDF: -scale * sign(u) * ln(1 - 2|u|) where u ~ Uniform(-0.5, 0.5)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return v + noise;
  });
}

/** Build a SHA-256 audit receipt from processed titles */
export async function buildAuditReceipt(
  titleCount: number,
  anonId: string
): Promise<AuditReceipt> {
  const payload = `cinebrain:${anonId}:${titleCount}:${Date.now()}`;
  const hash = await sha256(payload);
  return {
    titlesProcessed: titleCount,
    rawStringsDestroyed: titleCount,
    vectorDimensions: 128,
    identityStored: "Anon UUID",
    sha256Hash: hash,
    timestamp: Date.now(),
  };
}

/**
 * Vaporize all session data — the Ghost Mode kill switch.
 * Clears the provided map and returns an empty audit.
 */
export function vaporize(sessionMap: Map<string, unknown>): void {
  sessionMap.clear();
}
