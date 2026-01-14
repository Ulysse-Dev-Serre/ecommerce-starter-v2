import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderShippedEmailProps {
  orderId: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl: string;
  carrierName: string; // Ex: UPS, Canada Post
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  locale?: string;
}

export const OrderShippedEmail = ({
  orderId = 'ORD-2024-001234',
  customerName = 'Client',
  trackingNumber = '1Z9999999999999999',
  trackingUrl = 'https://www.ups.com/track?loc=fr_CA&tracknum=1Z9999999999999999',
  carrierName = 'UPS',
  shippingAddress = {
    street: '123 Rue des Érables',
    city: 'Montréal',
    state: 'QC',
    postalCode: 'H3Z 2Y7',
    country: 'CA',
  },
  locale = 'fr',
}: OrderShippedEmailProps) => {
  const t = {
    fr: {
      preview: `Votre commande ${orderId} est en route !`,
      title: 'Bonne nouvelle !',
      greeting: `Bonjour ${customerName},`,
      message: `Votre commande ${orderId} a été expédiée et est en route vers chez vous.`,
      trackingTitle: 'Suivre votre colis',
      trackingText: `Votre colis a été remis à ${carrierName}. Vous pouvez suivre son avancement :`,
      trackButton: 'Suivre mon colis',
      shippingAddress: 'Adresse de livraison',
      footerValues: 'Nos valeurs',
      footerEnvironment: "AgTechNest s'engage pour une agriculture durable.",
      shop: 'Boutique',
      account: 'Mon Compte',
      rights: 'Tous droits réservés.',
    },
    en: {
      preview: `Your order ${orderId} is on the way!`,
      title: 'Good news!',
      greeting: `Hi ${customerName},`,
      message: `Your order ${orderId} has been shipped and is on its way to you.`,
      trackingTitle: 'Track your package',
      trackingText: `Your package has been handed over to ${carrierName}. You can track its progress:`,
      trackButton: 'Track my package',
      shippingAddress: 'Shipping Address',
      footerValues: 'Our Values',
      footerEnvironment: 'AgTechNest is committed to sustainable agriculture.',
      shop: 'Shop',
      account: 'My Account',
      rights: 'All rights reserved.',
    },
  };

  const text = t[locale as keyof typeof t] || t.fr;

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
            <Text style={textStyle}>{text.message}</Text>

            <Section style={trackingBox}>
              <Text style={trackingTitle}>{text.trackingTitle}</Text>
              <Text style={textStyle}>{text.trackingText}</Text>
              <Text style={trackingNumberStyle}>{trackingNumber}</Text>
              <Link href={trackingUrl} style={button}>
                {text.trackButton}
              </Link>
            </Section>
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

          <Hr style={hrLight} />

          <Section style={footer}>
            <Text style={footerText}>
              <strong>{text.footerValues}</strong>
              <br />
              {text.footerEnvironment}
            </Text>
            <Text style={{ ...footerText, marginTop: '20px' }}>
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

export default OrderShippedEmail;

// --- STYLES (Reused from OrderConfirmation for consistency) ---
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

const trackingBox = {
  backgroundColor: '#f0fdf4', // Light green background for positive news
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  border: '1px solid #bbf7d0',
};

const trackingTitle = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#166534', // Green text
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const trackingNumberStyle = {
  fontSize: '18px',
  fontFamily: 'monospace',
  fontWeight: '600',
  color: '#111827',
  margin: '10px 0 16px',
  letterSpacing: '1px',
  backgroundColor: '#ffffff',
  padding: '8px 12px',
  borderRadius: '4px',
  display: 'inline-block',
};

const button = {
  backgroundColor: '#166534', // Green button
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
};

const hrLight = {
  borderColor: '#f3f4f6',
  margin: '15px 0',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  margin: '0 0 10px',
  fontSize: '13px',
  color: '#6b7280',
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
  margin: '10px 0 0',
};
