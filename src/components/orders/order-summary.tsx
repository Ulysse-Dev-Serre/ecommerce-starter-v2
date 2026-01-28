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
    <div className="vibe-stack-y-10">
      <div className="vibe-container vibe-bg-foreground vibe-text-background vibe-shadow-2xl-primary vibe-border-none">
        <h2 className="vibe-text-xl-bold vibe-mb-8 vibe-section-divider-bottom-soft vibe-pb-4">
          {labels.summary}
        </h2>
        <div className="vibe-stack-y-5 vibe-text-base vibe-text-medium">
          <div className="vibe-flex-between vibe-opacity-80">
            <span>{labels.subtotal}</span>
            <span>
              {formatPrice(order.subtotalAmount, order.currency as any, locale)}
            </span>
          </div>
          <div className="vibe-flex-between vibe-opacity-80">
            <span>{labels.shipping}</span>
            <span>
              {formatPrice(order.shippingAmount, order.currency as any, locale)}
            </span>
          </div>
          <div className="vibe-flex-between vibe-opacity-80">
            <span>{labels.tax}</span>
            <span>
              {formatPrice(order.taxAmount, order.currency as any, locale)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="vibe-flex-between vibe-text-success-foreground">
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
          <div className="vibe-pt-6 vibe-section-divider-top-soft vibe-flex-between-items-end">
            <span className="vibe-text-lg-bold">{labels.total}</span>
            <span className="vibe-text-4xl-bold vibe-leading-none">
              {formatPrice(order.totalAmount, order.currency as any, locale)}
            </span>
          </div>
        </div>
      </div>

      <div className="vibe-container vibe-stack-y-10">
        <div className="vibe-stack-y-4">
          <h3 className="vibe-text-xs-bold-muted-caps vibe-section-divider-bottom vibe-pb-2">
            📍 {labels.shippingAddress}
          </h3>
          <div className="vibe-text-bold-foreground vibe-leading-relaxed vibe-stack-y-1">
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
            <p className="vibe-uppercase vibe-tracking-widest vibe-opacity-60 vibe-text-sm">
              {shippingAddr?.country}
            </p>
            {shippingAddr?.phone && (
              <p className="vibe-text-sm vibe-text-medium vibe-text-muted vibe-mt-4 vibe-pt-4 vibe-section-divider-top-half">
                📞 {shippingAddr.phone}
              </p>
            )}
          </div>
        </div>

        {billingAddr && billingAddr.name && (
          <div className="vibe-stack-y-4 vibe-pt-10 vibe-section-divider-top">
            <h3 className="vibe-text-xs-bold-muted-caps vibe-section-divider-bottom vibe-pb-2">
              📄 {labels.billingAddress}
            </h3>
            <div className="vibe-text-bold-foreground vibe-leading-relaxed vibe-stack-y-1 vibe-opacity-80">
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
