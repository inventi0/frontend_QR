/**
 * Map a backend ProductOut object to ProductCard props.
 *
 * Backend ProductOut schema:
 *   { id, type, size, color, description, img_url, qr_id, price }
 *   price is integer in minimal currency units (kopeks).
 *
 * ProductCard expects:
 *   { title, image, description, height, position, onClickHandler, isComingSoon }
 */

import tshirtImg from "../assets/shirt.png";
import shortsImg from "../assets/shirt.png"; // Placeholder
import hoodieImg from "../assets/shirt.png"; // Placeholder
import capsImg from "../assets/caps.png";

export const mapTypeToImage = (type) => {
  const typeMap = {
    "Футболка": tshirtImg,
    "Шорты": shortsImg,
    "Худи": hoodieImg,
    "Кепка": capsImg,
  };
  return typeMap[type] || tshirtImg;
};

const DEFAULT_IMAGE = tshirtImg;

/**
 * @param {object} product — backend ProductOut
 * @returns {object} — props for ProductCard + extra metadata
 */
export function mapProductToCard(product) {
    return {
        id: product.id,
        title: product.type || "Товар",
        image: product.img_url || TYPE_FALLBACK_IMAGES[product.type] || DEFAULT_IMAGE,
        description: product.description || `${product.color || ""} · ${product.size || ""}`.trim(),
        // available: products from backend are available by default
        available: true,
        isComingSoon: false,
        // raw backend fields for modal usage
        _raw: product,
    };
}

/**
 * Group products by type for a cleaner catalog display.
 * Returns unique types, each represented by the first product of that type.
 *
 * @param {object[]} products — array of backend ProductOut
 * @returns {object[]} — array of mapped card objects (one per type)
 */
export function groupProductsByType(products) {
    if (!products || !Array.isArray(products)) return [];

    const seen = new Map();
    for (const p of products) {
        const key = p.type || "unknown";
        if (!seen.has(key)) {
            seen.set(key, mapProductToCard(p));
        }
    }
    return Array.from(seen.values());
}
