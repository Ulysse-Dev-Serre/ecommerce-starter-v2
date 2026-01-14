import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: string;
  currency: string;
}

interface OrderConfirmationEmailProps {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: string;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  locale?: string;
  subtotal?: string;
  shippingCost?: string;
  taxCost?: string;
}

export const OrderConfirmationEmail = ({
  orderId = 'ORD-123456',
  customerName = 'Client',
  items = [
    {
      name: 'Plante Intelligente AgTech',
      quantity: 1,
      price: '129.99',
      currency: 'CAD',
    },
  ],
  totalAmount = '129.99',
  currency = 'CAD',
  shippingAddress = {
    street: '123 Rue des Érables',
    city: 'Montréal',
    state: 'QC',
    postalCode: 'H3Z 2Y7',
    country: 'CA',
  },
  trackingNumber,
  trackingUrl,
  locale = 'fr',
  subtotal = '110.00',
  shippingCost = '10.00',
  taxCost = '9.99',
}: OrderConfirmationEmailProps) => {
  const t = {
    fr: {
      preview: `Confirmation de votre commande ${orderId}`,
      title: 'Merci pour votre commande !',
      greeting: `Bonjour ${customerName},`,
      received: `Nous avons bien reçu votre commande`,
      preparing: `Nous la préparons avec soin. Vous recevrez un autre email dès qu'elle sera expédiée.`,
      trackingTitle: 'Suivi de votre colis',
      trackButton: 'Suivre ma commande',
      shippingAddress: 'Adresse de livraison',
      summary: 'Récapitulatif',
      subtotal: 'Sous-total',
      shipping: 'Livraison',
      taxes: 'Taxes',
      total: 'Total',
      shop: 'Boutique',
      account: 'Mon Compte',
      rights: 'Tous droits réservés.',
    },
    en: {
      preview: `Order Confirmation ${orderId}`,
      title: 'Thank you for your order!',
      greeting: `Hi ${customerName},`,
      received: `We have received your order`,
      preparing: `We are getting it ready for you. You will receive another email once it has shipped.`,
      trackingTitle: 'Track your package',
      trackButton: 'Track my order',
      shippingAddress: 'Shipping Address',
      summary: 'Order Summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      taxes: 'Taxes',
      total: 'Total',
      shop: 'Shop',
      account: 'My Account',
      rights: 'All rights reserved.',
    },
  };

  const text = t[locale as keyof typeof t] || t.fr;

  const formatPrice = (amount: string | number, currencyCode: string) => {
    // Déduire la région en fonction de la devise pour un formatage correct
    // Exemple: CAD -> CA (fr-CA ou en-CA), USD -> US (en-US), EUR -> FR (fr-FR)
    let region = 'US'; // Fallback par défaut
    if (currencyCode.toUpperCase() === 'CAD') region = 'CA';
    if (currencyCode.toUpperCase() === 'EUR') region = 'FR';

    // Si la devise est USD, on préfère souvent le format US classique ($10.00) même si l'utilisateur est francophone,
    // mais pour être cohérent avec la locale, on construit "fr-US" ou "en-US".
    const localeString = `${locale}-${region}`;

    return new Intl.NumberFormat(localeString, {
      style: 'currency',
      currency: currencyCode,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>AgTechNest</Heading>
          </Section>

          <Section style={message}>
            <Heading style={heading}>{text.title}</Heading>
            <Text style={textStyle}>{text.greeting}</Text>
            <Text style={textStyle}>
              {text.received} <strong>{orderId}</strong>.{text.preparing}
            </Text>

            {trackingNumber && (
              <Section style={trackingBox}>
                <Text style={trackingTitle}>{text.trackingTitle}</Text>
                <Text style={trackingNumberStyle}>{trackingNumber}</Text>
                {trackingUrl && (
                  <Link href={trackingUrl} style={button}>
                    {text.trackButton}
                  </Link>
                )}
              </Section>
            )}
          </Section>

          <Hr style={hr} />

          <Section style={sectionPadding}>
            <Text style={sectionTitle}>{text.shippingAddress}</Text>
            <Text style={addressText}>
              {customerName}
              <br />
              {shippingAddress.street}
              <br />
              {shippingAddress.city}, {shippingAddress.state}{' '}
              {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={sectionPadding}>
            <Text style={sectionTitle}>{text.summary}</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column>
                  <Text style={itemText}>
                    {item.name} <span style={quantity}>x{item.quantity}</span>
                  </Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={itemPrice}>
                    {formatPrice(item.price, item.currency)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hrLight} />

          <Section style={sectionPadding}>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>{text.subtotal}</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={summaryValue}>
                  {formatPrice(subtotal, currency)}
                </Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>{text.shipping}</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={summaryValue}>
                  {formatPrice(shippingCost, currency)}
                </Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>{text.taxes}</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={summaryValue}>
                  {formatPrice(taxCost, currency)}
                </Text>
              </Column>
            </Row>
            <Hr style={hrLight} />
            <Row style={{ ...summaryRow, paddingTop: '10px' }}>
              <Column>
                <Text style={totalLabel}>{text.total}</Text>
              </Column>
              <Column style={priceColumn}>
                <Text style={totalValue}>
                  {formatPrice(totalAmount, currency)}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              <Link href="#" style={footerLink}>
                {text.shop}
              </Link>{' '}
              •{' '}
              <Link href="#" style={footerLink}>
                {text.account}
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} AgTechNest Inc. {text.rights}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#111827',
  padding: '30px 0',
  textAlign: 'center' as const,
};

const brand = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const message = {
  padding: '40px 40px',
  textAlign: 'center' as const,
};

const heading = {
  fontSize: '26px',
  lineHeight: '1.3',
  fontWeight: '800',
  color: '#111827',
  margin: '0 0 20px',
};

const textStyle = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4b5563',
  margin: '0 0 10px',
};

const sectionPadding = {
  padding: '30px 40px',
};

const sectionTitle = {
  fontSize: '14px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  color: '#9ca3af',
  marginBottom: '16px',
  letterSpacing: '0.5px',
};

const addressText = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#1f2937',
  margin: '0',
};

const itemRow = {
  paddingBottom: '12px',
};

const itemText = {
  fontSize: '15px',
  color: '#374151',
  margin: '0',
};

const quantity = {
  color: '#9ca3af',
  fontSize: '14px',
  marginLeft: '4px',
};

const priceColumn = {
  textAlign: 'right' as const,
  width: '100px',
};

const itemPrice = {
  fontSize: '15px',
  color: '#111827',
  margin: '0',
  fontWeight: '500',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const hrLight = {
  borderColor: '#f3f4f6',
  margin: '15px 0',
};

const summaryRow = {
  marginBottom: '8px',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const summaryValue = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  margin: '0',
};

const totalLabel = {
  fontSize: '16px',
  fontWeight: '800',
  color: '#111827',
  margin: '0',
};

const totalValue = {
  fontSize: '18px',
  fontWeight: '800',
  color: '#111827',
  margin: '0',
};

const trackingBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
};

const trackingTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const trackingNumberStyle = {
  fontSize: '18px',
  fontFamily: 'monospace',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 16px',
  letterSpacing: '1px',
};

const button = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  margin: '0 0 10px',
};

const footerLink = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: '500',
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};
