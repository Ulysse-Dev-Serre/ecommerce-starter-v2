import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface OrderReturnLabelEmailProps {
  orderId: string;
  customerName: string;
  labelUrl: string;
  locale?: string;
}

export const OrderReturnLabelEmail = ({
  orderId = 'ORD-123',
  customerName = 'Client',
  labelUrl = '#',
  locale = 'fr',
}: OrderReturnLabelEmailProps) => {
  const isFr = locale === 'fr';

  return (
    <Html>
      <Head />
      <Preview>
        {isFr
          ? `Étiquette de retour pour votre commande ${orderId}`
          : `Return label for your order ${orderId}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Black Bar */}
          <Section style={header}>
            <Text style={brand}>AgTechNest</Text>
          </Section>

          {/* Main Content */}
          <Section style={message}>
            <Heading style={heading}>
              {isFr ? 'Votre étiquette de retour' : 'Your return label'}
            </Heading>
            <Text style={textStyle}>
              {isFr ? `Bonjour ${customerName},` : `Hello ${customerName},`}
            </Text>
            <Text style={textStyle}>
              {isFr
                ? `Suite à votre demande, voici l'étiquette de retour pour votre commande #${orderId}.`
                : `Following your request, here is the return label for your order #${orderId}.`}
            </Text>

            <Section style={instructionBox}>
              <Text style={instructionText}>
                {isFr
                  ? "1. Imprimez l'étiquette PDF"
                  : '1. Print the PDF label'}
              </Text>
              <Text style={instructionText}>
                {isFr
                  ? '2. Collez-la sur votre colis'
                  : '2. Stick it on your package'}
              </Text>
              <Text style={instructionText}>
                {isFr
                  ? '3. Déposez-le au point de dépôt le plus proche'
                  : '3. Drop it off at the nearest drop-off point'}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button href={labelUrl} target="_blank" style={button}>
                {isFr ? "TÉLÉCHARGER L'ÉTIQUETTE" : 'DOWNLOAD LABEL'}
              </Button>
            </Section>

            <Hr style={hr} />

            <Section style={footer}>
              <Text style={footerText}>
                {isFr
                  ? 'Si le bouton ne fonctionne pas, cliquez sur le lien ci-dessous :'
                  : "If the button doesn't work, click the link below:"}
              </Text>
              <Link href={labelUrl} target="_blank" style={link}>
                {isFr
                  ? 'Lien direct vers votre étiquette PDF'
                  : 'Direct link to your PDF label'}
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReturnLabelEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  maxWidth: '580px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
};

const header = {
  backgroundColor: '#111827',
  padding: '24px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
};

const brand = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
};

const message = {
  padding: '40px 30px',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const textStyle = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#374151',
  margin: '0 0 16px',
};

const instructionBox = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #f3f4f6',
};

const instructionText = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#4b5563',
  margin: '4px 0',
  fontWeight: '500',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#111827',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  width: 'auto',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0 0 8px',
};

const link = {
  fontSize: '14px',
  color: '#4f46e5',
  textDecoration: 'underline',
  fontWeight: '600',
};
