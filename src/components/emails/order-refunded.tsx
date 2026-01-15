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

interface OrderRefundedEmailProps {
  orderId: string;
  customerName: string;
  amountRefunded: string; // "129.99"
  currency: string;
  locale?: string;
}

export const OrderRefundedEmail = ({
  orderId = 'ORD-2024-001234',
  customerName = 'Client',
  amountRefunded = '129.99',
  currency = 'CAD',
  locale = 'fr',
}: OrderRefundedEmailProps) => {
  const t = {
    fr: {
      preview: `Remboursement initié pour la commande ${orderId}`,
      title: 'Remboursement en cours',
      greeting: `Bonjour ${customerName},`,
      message: `Nous avons initié le remboursement de ${amountRefunded} ${currency} pour votre commande ${orderId}.`,
      details: `Le montant devrait apparaître sur votre relevé bancaire dans un délai de 5 à 10 jours ouvrables, selon les délais de traitement de votre banque.`,
      footerValues: 'Nos valeurs',
      footerEnvironment: "AgTechNest s'engage pour une agriculture durable.",
      shop: 'Boutique',
      account: 'Mon Compte',
      rights: 'Tous droits réservés.',
    },
    en: {
      preview: `Refund initiated for order ${orderId}`,
      title: 'Refund Initiated',
      greeting: `Hi ${customerName},`,
      message: `We have initiated a refund of ${amountRefunded} ${currency} for your order ${orderId}.`,
      details: `The amount should appear on your bank statement within 5 to 10 business days, depending on your bank's processing time.`,
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
            <Text style={textStyle}>{text.details}</Text>
          </Section>

          <Hr style={hr} />

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

export default OrderRefundedEmail;

// --- STYLES ---
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

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
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
