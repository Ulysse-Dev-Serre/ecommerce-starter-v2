import { ExternalLink, Package } from 'lucide-react';

interface OrderTrackingProps {
  shipments: any[];
  labels: {
    tracking: string;
    trackPackage: string;
    standardShipping: string;
  };
}

export function OrderTracking({ shipments, labels }: OrderTrackingProps) {
  if (!shipments || shipments.length === 0) return null;

  return (
    <div className="vibe-container border-primary/20 bg-primary/5">
      <div className="vibe-flex-between mb-6">
        <h2 className="text-xl font-bold text-foreground text-primary flex items-center justify-center gap-3">
          <Package className="h-16 w-16" /> {labels.tracking}
        </h2>
      </div>
      <div className="space-y-6">
        {shipments.map((shipment: any) => (
          <div
            key={shipment.id}
            className="flex flex-col sm:flex vibe-flex-between-items-start sm:vibe-items-center gap-6 vibe-p-6 bg-background vibe-card-rounded-xl border-primary/20"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground vibe-mb-1">
                {shipment.carrier || labels.standardShipping}
              </p>
              <p className="text-xl font-bold text-foreground vibe-tracking-wider vibe-select-all">
                {shipment.trackingCode}
              </p>
            </div>
            <a
              href={
                shipment.trackingUrl ||
                `https://parcelsapp.com/tracking/${shipment.trackingCode}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="vibe-button-primary px-8 vibe-py-3 vibe-text-sm vibe-shadow-sm-primary"
            >
              {labels.trackPackage}
              <ExternalLink className="h-16 w-16" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
