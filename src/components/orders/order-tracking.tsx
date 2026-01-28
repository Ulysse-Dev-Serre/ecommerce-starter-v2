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
    <div className="vibe-container border border-primary/10 bg-primary/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-3">
          <Package className="w-6 h-6" /> {labels.tracking}
        </h2>
      </div>
      <div className="space-y-6">
        {shipments.map((shipment: any) => (
          <div
            key={shipment.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 bg-background rounded-xl border border-primary/10"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {shipment.carrier || labels.standardShipping}
              </p>
              <p className="font-mono text-xl font-bold tracking-wider select-all">
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
              className="vibe-button-primary px-8 py-3 text-sm shadow-md shadow-primary/20"
            >
              {labels.trackPackage}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
