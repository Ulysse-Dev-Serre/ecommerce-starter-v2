import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AdminNewOrderEmailProps {
  orderId: string;
  internalOrderId?: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  itemsCount: number;
  siteUrl?: string;
}

export const AdminNewOrderEmail = ({
  orderId = 'ORD-2024-001234',
  internalOrderId = 'cmk0000000000000000000000',
  customerName = 'Jean Dupont',
  totalAmount = '129.99',
  currency = 'CAD',
  itemsCount = 3,
  siteUrl = 'https://agtechnest.com',
}: AdminNewOrderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        Nouvelle commande : {totalAmount} {currency} par {customerName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>AgTechNest Admin</Heading>
          </Section>

          <Section style={message}>
            <Heading style={heading}>Nouvelle Commande !</Heading>
            <Text style={textStyle}>
              Une nouvelle commande vient d&apos;être passée sur la boutique.
            </Text>

            <Section style={statsBox}>
              <Text style={statLabel}>Montant</Text>
              <Text style={statValue}>
                {totalAmount} {currency}
              </Text>

              <Text style={statLabel}>Client</Text>
              <Text style={statValue}>{customerName}</Text>

              <Text style={statLabel}>Commande</Text>
              <Text style={statValue}>#{orderId}</Text>

              <Text style={statLabel}>Articles</Text>
              <Text style={statValue}>{itemsCount} article(s)</Text>
            </Section>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Link
                href={`${siteUrl}/admin/orders/${internalOrderId}`}
                style={button}
              >
                Voir la commande
              </Link>
            </div>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminNewOrderEmail;

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
  padding: '20px 0',
  textAlign: 'center' as const,
};

const brand = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};

const message = {
  padding: '40px 40px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const textStyle = {
  fontSize: '16px',
  color: '#4b5563',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const statsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #e5e7eb',
};

const statLabel = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  color: '#6b7280',
  fontWeight: '600',
  marginBottom: '4px',
};

const statValue = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#111827',
  marginBottom: '16px',
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
