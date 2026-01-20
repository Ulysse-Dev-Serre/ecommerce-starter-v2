import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface RefundRequestAdminEmailProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  imageUrl?: string;
}

export const RefundRequestAdminEmail = ({
  orderNumber,
  customerName,
  customerEmail,
  reason,
  imageUrl,
}: RefundRequestAdminEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Nouvelle demande de remboursement pour la commande {orderNumber}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={heading}>Demande de Remboursement</Heading>
        </Section>
        <Section style={content}>
          <Text style={text}>
            Une nouvelle demande de remboursement a été soumise par un client.
          </Text>
          <Hr style={hr} />
          <Text style={label}>Commande :</Text>
          <Text style={value}>{orderNumber}</Text>

          <Text style={label}>Client :</Text>
          <Text style={value}>
            {customerName} ({customerEmail})
          </Text>

          <Hr style={hr} />
          <Text style={label}>Raison du remboursement :</Text>
          <Text style={paragraph}>{reason}</Text>

          {imageUrl && (
            <>
              <Hr style={hr} />
              <Text style={label}>Image jointe :</Text>
              <Text style={text}>
                L'image a été envoyée en pièce jointe ou est consultable via le
                dashboard.
              </Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Pour traiter cette demande, rendez-vous dans le dashboard admin.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '0 48px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '400',
  color: '#484848',
  padding: '17px 0 0',
};

const content = {
  padding: '0 48px',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const label = {
  color: '#8898aa',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  fontWeight: 'bold',
  marginTop: '16px',
};

const value = {
  color: '#484848',
  fontSize: '18px',
  fontWeight: 'bold',
};

const paragraph = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  backgroundColor: '#f4f4f4',
  padding: '12px',
  borderRadius: '4px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 48px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '24px',
};

export default RefundRequestAdminEmail;
