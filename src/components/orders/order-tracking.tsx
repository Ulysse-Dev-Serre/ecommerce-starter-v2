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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-extrabold text-primary flex items-center gap-3">
          <Package className="h-6 w-6" /> {labels.tracking}
        </h2>
      </div>
      <div className="space-y-6">
        {shipments.map((shipment: any) => (
          <div
            key={shipment.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 bg-background rounded-xl border border-primary/10"
          >
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                {shipment.carrier || labels.standardShipping}
              </p>
              <p className="font-mono text-xl text-foreground font-bold tracking-wider select-all">
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
              className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
            >
              {labels.trackPackage}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
