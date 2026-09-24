import { Product } from '../types';

/**
 * Generate a unique Product Code with format "FA-XXXXX" (e.g., FA-84920)
 * Unique to Friends Apparel
 */
export function generateProductCode(existingProducts?: Product[]): string {
  const existingCodes = new Set(
    (existingProducts || [])
      .map(p => (p.productCode || '').trim().toUpperCase())
      .filter(Boolean)
  );

  let code = '';
  let attempts = 0;
  do {
    // 5-digit random integer between 10000 and 99999
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    code = `FA-${randomNum}`;
    attempts++;
  } while (existingCodes.has(code) && attempts < 50);

  return code;
}

/**
 * Returns the effective product code for a product.
 * If the product already has productCode, returns it.
 * Otherwise, generates a stable fallback derived from product id/slug so every product has a code.
 */
export function getProductCode(product: { id?: string; slug?: string; productCode?: string } | null | undefined): string {
  if (!product) return 'FA-10001';
  if (product.productCode && product.productCode.trim()) {
    return product.productCode.trim().toUpperCase();
  }

  // Fallback: derive stable code from ID or slug
  const raw = product.id || product.slug || '10001';
  // Extract trailing digits or hash
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) {
    return `FA-${digits.slice(-5)}`;
  }

  // Simple string hash for alphanumerics
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 90000;
  }
  const stableNum = 10000 + Math.abs(hash);
  return `FA-${stableNum}`;
}

/**
 * Format a Product URL path
 * Example: /product/FA-84920
 */
export function getProductUrl(product: { id?: string; slug?: string; productCode?: string }): string {
  const code = getProductCode(product);
  return `/product/${encodeURIComponent(code)}`;
}
