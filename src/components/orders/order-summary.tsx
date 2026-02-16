import { formatPrice } from '@/lib/utils/currency';
import { OrderWithIncludes } from '@/lib/types/domain/order';
import { SupportedCurrency } from '@/lib/config/site';

interface OrderSummaryProps {
  order: OrderWithIncludes;
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
  const shippingAddr = order.shippingAddress;
  const billingAddr = order.billingAddress;

  return (
    <div className="space-y-10">
      <div className="vibe-container vibe-bg-foreground vibe-text-background shadow-2xl shadow-foreground/20 vibe-border-none">
        <h2 className="text-xl font-bold text-foreground vibe-mb-8 border-b border-background/20 vibe-pb-4">
          {labels.summary}
        </h2>
        <div className="vibe-stack-y-5 vibe-text-base font-medium">
          <div className="vibe-flex-between opacity-80">
            <span>{labels.subtotal}</span>
            <span>
              {formatPrice(
                order.subtotalAmount,
                order.currency as SupportedCurrency,
                locale
              )}
            </span>
          </div>
          <div className="vibe-flex-between opacity-80">
            <span>{labels.shipping}</span>
            <span>
              {formatPrice(
                order.shippingAmount,
                order.currency as SupportedCurrency,
                locale
              )}
            </span>
          </div>
          <div className="vibe-flex-between opacity-80">
            <span>{labels.tax}</span>
            <span>
              {formatPrice(
                order.taxAmount,
                order.currency as SupportedCurrency,
                locale
              )}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="vibe-flex-between vibe-text-success-foreground">
              <span>{labels.discount}</span>
              <span>
                -
                {formatPrice(
                  order.discountAmount,
                  order.currency as SupportedCurrency,
                  locale
                )}
              </span>
            </div>
          )}
          <div className="pt-6 border-t border-background/20 flex justify-between items-end">
            <span className="vibe-text-lg-bold">{labels.total}</span>
            <span className="text-4xl font-black vibe-leading-none">
              {formatPrice(
                order.totalAmount,
                order.currency as SupportedCurrency,
                locale
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="vibe-container space-y-10">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-4 vibe-pb-2">
            📍 {labels.shippingAddress}
          </h3>
          <div className="font-bold text-foreground leading-relaxed vibe-stack-y-1">
            <p className="vibe-text-xl vibe-mb-2">{shippingAddr?.name}</p>
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
            <p className="uppercase vibe-tracking-widest opacity-60 vibe-text-sm">
              {shippingAddr?.country}
            </p>
            {shippingAddr?.phone && (
              <p className="vibe-text-sm font-medium text-muted-foreground mt-4 vibe-pt-4 border-t border-border/50">
                📞 {shippingAddr.phone}
              </p>
            )}
          </div>
        </div>

        {billingAddr && billingAddr.name && (
          <div className="space-y-4 vibe-pt-10 border-t border-border pt-4 mt-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-4 vibe-pb-2">
              📄 {labels.billingAddress}
            </h3>
            <div className="font-bold text-foreground leading-relaxed vibe-stack-y-1 opacity-80">
              <p className="vibe-text-lg vibe-mb-2">{billingAddr.name}</p>
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
