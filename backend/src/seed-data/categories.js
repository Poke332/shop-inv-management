/**
 * Seed: the 6 Category records (ARCHITECTURE §4.2).
 * `slug` is the main-store tile deep-link contract (/search?category=<slug>).
 *
 * @typedef {Object} Category
 * @property {string} slug  "audio" | "smart-home" | "gaming" | "laptops" | "accessories" | "wearables"
 * @property {string} label "Audio", "Smart Home", ...
 */

/** @type {Category[]} */
export const categories = [
  { slug: 'audio', label: 'Audio' },
  { slug: 'smart-home', label: 'Smart Home' },
  { slug: 'gaming', label: 'Gaming' },
  { slug: 'laptops', label: 'Laptops & PC' },
  { slug: 'accessories', label: 'Accessories' },
  { slug: 'wearables', label: 'Wearables' },
];
