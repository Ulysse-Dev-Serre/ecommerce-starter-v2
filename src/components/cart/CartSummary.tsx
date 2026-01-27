import { useTranslations } from 'next-intl';
import { PriceTotal } from '@/components/price-display';
import { SignInButton } from '@clerk/nextjs';

interface CartSummaryProps {
  items: Array<{
    quantity: number;
    pricing: Array<{
      price: string;
      currency: string;
    }>;
  }>;
  locale: string;
  isSignedIn: boolean;
}

export function CartSummary({ items, locale, isSignedIn }: CartSummaryProps) {
  const t = useTranslations('cart');

  return (
    <div className="border border-border bg-card rounded-xl p-6 shadow-sm sticky top-4 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">
        {t('total')}
      </h2>

      <div className="space-y-4 pt-2">
        <div className="flex justify-between items-center mb-8">
          <span className="text-lg font-semibold text-muted-foreground">
            {t('total')}
          </span>
          <PriceTotal
            items={items}
            className="text-3xl font-bold text-foreground"
            locale={locale}
          />
        </div>

        {isSignedIn ? (
          <a
            href={`/${locale}/checkout`}
            className="w-full block text-center bg-primary text-primary-foreground py-4 px-6 rounded-xl font-bold hover:bg-primary-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            {t('checkout')}
          </a>
        ) : (
          <SignInButton mode="modal">
            <button className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-xl font-bold hover:bg-primary-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20">
              {t('signInToCheckout')}
            </button>
          </SignInButton>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4 italic">
          {/* Add security icon or text if needed */}
          Paiement sécurisé
        </p>
      </div>
    </div>
  );
}
