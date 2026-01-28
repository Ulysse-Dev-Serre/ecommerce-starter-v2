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
    <div className="vibe-container vibe-border-primary-soft vibe-bg-primary-soft">
      <div className="vibe-flex-between vibe-mb-6">
        <h2 className="vibe-text-xl-bold vibe-text-primary vibe-flex-center-gap-3">
          <Package className="vibe-icon-md" /> {labels.tracking}
        </h2>
      </div>
      <div className="vibe-stack-y-6">
        {shipments.map((shipment: any) => (
          <div
            key={shipment.id}
            className="vibe-flex-col sm:vibe-flex-row vibe-flex-between-items-start sm:vibe-items-center vibe-gap-6 vibe-p-6 vibe-bg-background vibe-card-rounded-xl vibe-border-primary-soft"
          >
            <div>
              <p className="vibe-text-xs-bold-muted-caps vibe-mb-1">
                {shipment.carrier || labels.standardShipping}
              </p>
              <p className="vibe-text-xl-bold vibe-tracking-wider vibe-select-all">
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
              className="vibe-button-primary vibe-px-8 vibe-py-3 vibe-text-sm vibe-shadow-sm-primary"
            >
              {labels.trackPackage}
              <ExternalLink className="vibe-icon-md" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
