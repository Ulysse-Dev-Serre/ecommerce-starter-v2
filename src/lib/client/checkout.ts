/**
 * Client-side checkout helpers
 * Fonctions utilitaires pour le processus de checkout côté client
 */

/**
 * Fonction checkout universelle - utilisable partout côté client
 *
 * @example
 * // Acheter 1 produit
 * checkout([{ variantId: 'xxx', quantity: 1 }], 'fr');
 *
 * // Acheter plusieurs produits
 * checkout(cartItems, 'fr');
 */
export async function checkout(
  items: Array<{ variantId: string; quantity: number }>,
  locale: string
): Promise<void> {
  try {
    const response = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        successUrl: `${window.location.origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/${locale}/cart`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout');
    }

    const data = await response.json();

    if (data.success && data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Checkout failed:', error);
    throw error;
  }
}
