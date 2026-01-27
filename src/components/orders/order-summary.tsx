import { formatPrice } from '@/lib/utils/currency';

interface OrderSummaryProps {
  order: any;
  locale: string;
  labels: {
    summary: string;
    subtotal: string;
    shipping: string;
    tax: string;
    discount: string;
    total: string;
    shippingAddress: string;
    billingAddress: string;
  };
}

export function OrderSummary({ order, locale, labels }: OrderSummaryProps) {
  const shippingAddr = order.shippingAddress as Record<string, any> | null;
  const billingAddr = order.billingAddress as Record<string, any> | null;

  return (
    <div className="space-y-10">
      <div className="vibe-container bg-foreground text-background shadow-2xl shadow-foreground/20 border-none">
        <h2 className="text-xl font-black mb-8 border-b border-background/20 pb-4">
          {labels.summary}
        </h2>
        <div className="space-y-5 text-base font-medium">
          <div className="flex justify-between opacity-80">
            <span>{labels.subtotal}</span>
            <span>
              {formatPrice(order.subtotalAmount, order.currency as any, locale)}
            </span>
          </div>
          <div className="flex justify-between opacity-80">
            <span>{labels.shipping}</span>
            <span>
              {formatPrice(order.shippingAmount, order.currency as any, locale)}
            </span>
          </div>
          <div className="flex justify-between opacity-80">
            <span>{labels.tax}</span>
            <span>
              {formatPrice(order.taxAmount, order.currency as any, locale)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-success-foreground">
              <span>{labels.discount}</span>
              <span>
                -
                {formatPrice(
                  order.discountAmount,
                  order.currency as any,
                  locale
                )}
              </span>
            </div>
          )}
          <div className="pt-6 border-t border-background/20 flex justify-between items-end">
            <span className="text-lg font-black">{labels.total}</span>
            <span className="text-4xl font-black leading-none">
              {formatPrice(order.totalAmount, order.currency as any, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="vibe-container space-y-10">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            📍 {labels.shippingAddress}
          </h3>
          <div className="text-foreground font-bold leading-relaxed space-y-1">
            <p className="text-xl mb-2">{shippingAddr?.name}</p>
            <p>{shippingAddr?.line1 || shippingAddr?.street1}</p>
            {(shippingAddr?.line2 || shippingAddr?.street2) && (
              <p>{shippingAddr?.line2 || shippingAddr?.street2}</p>
            )}
            <p>
              {[
                shippingAddr?.city,
                shippingAddr?.state,
                shippingAddr?.postal_code ||
                  shippingAddr?.postalCode ||
                  shippingAddr?.zip,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p className="uppercase tracking-widest opacity-60 text-sm">
              {shippingAddr?.country}
            </p>
            {shippingAddr?.phone && (
              <p className="text-sm font-medium text-muted-foreground mt-4 pt-4 border-t border-border/50">
                📞 {shippingAddr.phone}
              </p>
            )}
          </div>
        </div>

        {billingAddr && billingAddr.name && (
          <div className="space-y-4 pt-10 border-t border-border">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              📄 {labels.billingAddress}
            </h3>
            <div className="text-foreground font-bold leading-relaxed space-y-1 opacity-80">
              <p className="text-lg mb-2">{billingAddr.name}</p>
              <p>{billingAddr.line1 || billingAddr.street1}</p>
              <p>
                {[
                  billingAddr.city,
                  billingAddr.state,
                  billingAddr.postal_code ||
                    billingAddr.postalCode ||
                    billingAddr.zip,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
