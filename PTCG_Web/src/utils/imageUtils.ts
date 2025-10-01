/**
 * Utility functions for handling card images and formatting
 */

/**
 * Formats a CardID into the correct image path
 * @param cardId - The numeric CardID
 * @returns The formatted image path
 */
export function formatCardImagePath(cardId: number): string {
  const paddedId = cardId.toString().padStart(8, '0');
  return `/cards/hk${paddedId}.png`;
}

/**
 * Gets the appropriate image source for a card
 * @param card - The card object with ImageURL and CardID
 * @returns The formatted local image path
 */
export function getCardImageSrc(card: { ImageURL?: string; CardID: number }): string {
  // Always use local images for better performance and reliability
  return formatCardImagePath(card.CardID);
}

/**
 * Default placeholder image path
 */
export const PLACEHOLDER_IMAGE_PATH = '/placeholder-card.svg';