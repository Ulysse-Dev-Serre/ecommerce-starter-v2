export interface ShippingRate {
  object_id?: string;
  objectId?: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel: {
    name: string;
  };
  displayName?: string;
  duration_terms?: string;
  displayTime?: string;
}

export interface CheckoutAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}
