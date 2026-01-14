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
}: OrderConfirmationEmailProps) => {
  const previewText = `Confirmation de votre commande ${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            {/* Logo placeholder - replace with actual logo URL in production */}
            <Heading style={heading}>AgTechNest</Heading>
          </Section>

          <Section style={message}>
            <Heading style={global.heading}>
              Merci pour votre commande !
            </Heading>
            <Text style={global.text}>Bonjour {customerName},</Text>
            <Text style={global.text}>
              Nous avons bien reçu votre commande <strong>{orderId}</strong> et
              nous la préparons avec soin. Vous recevrez un autre email dès
              qu'elle sera expédiée.
            </Text>
          </Section>

          <Hr style={global.hr} />

          <Section style={global.defaultPadding}>
            <Text style={adressTitle}>Adresse de livraison :</Text>
            <Text style={{ ...global.text, fontSize: 14 }}>
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

          <Hr style={global.hr} />

          <Section style={{ ...global.defaultPadding, paddingBottom: 20 }}>
            <Text style={adressTitle}>Détails de la commande :</Text>
            {items.map((item, index) => (
              <Row key={index} style={{ paddingBottom: '10px' }}>
                <Column>
                  <Text style={{ ...global.text, margin: 0 }}>
                    {item.name} x {item.quantity}
                  </Text>
                </Column>
                <Column style={{ verticalAlign: 'top', align: 'right' }}>
                  <Text
                    style={{ ...global.text, margin: 0, fontWeight: 'bold' }}
                  >
                    {new Intl.NumberFormat('fr-CA', {
                      style: 'currency',
                      currency: item.currency,
                    }).format(parseFloat(item.price))}
                  </Text>
                </Column>
              </Row>
            ))}
            <Hr style={{ borderColor: '#E5E5E5', margin: '10px 0' }} />
            <Row>
              <Column>
                <Text style={{ ...global.text, fontWeight: 'bold' }}>
                  Total
                </Text>
              </Column>
              <Column style={{ align: 'right' }}>
                <Text
                  style={{
                    ...global.text,
                    fontWeight: 'bold',
                    fontSize: '18px',
                  }}
                >
                  {new Intl.NumberFormat('fr-CA', {
                    style: 'currency',
                    currency,
                  }).format(parseFloat(totalAmount))}
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={global.hr} />

          <Section style={menu.container}>
            <Text style={menu.text}>
              <Link href="#" style={menu.link}>
                Boutique
              </Link>{' '}
              |{' '}
              <Link href="#" style={menu.link}>
                Mon Compte
              </Link>
            </Text>
            <Text style={footer.text}>
              © 2024 AgTechNest Inc. Tous droits réservés.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

const paddingX = {
  paddingLeft: '40px',
  paddingRight: '40px',
};

const paddingY = {
  paddingTop: '22px',
  paddingBottom: '22px',
};

const paragraph = {
  lineHeight: '1.5',
  fontSize: '16px',
};

const global = {
  paddingX,
  paddingY,
  defaultPadding: {
    ...paddingX,
    ...paddingY,
  },
  paragraphWithBold: { ...paragraph, fontWeight: 'bold' },
  heading: {
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '700',
    textAlign: 'center' as const,
    color: '#1a1a1a',
  },
  text: {
    ...paragraph,
    color: '#404040',
  },
  button: {
    border: '1px solid #929292',
    fontSize: '16px',
    textDecoration: 'none',
    padding: '10px 0px',
    width: '220px',
    display: 'block',
    textAlign: 'center' as const,
    fontWeight: 500,
    color: '#000',
  },
  hr: {
    borderColor: '#E5E5E5',
    margin: '0',
  },
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '10px auto',
  width: '600px',
  maxWidth: '100%',
  border: '1px solid #E5E5E5',
};

const heading = {
  fontSize: '32px',
  lineHeight: '1.3',
  fontWeight: '700',
  textAlign: 'center' as const,
  color: '#000',
  padding: '20px 0 0 0',
};

const message = {
  padding: '40px 74px',
  textAlign: 'center' as const,
} as React.CSSProperties;

const adressTitle = {
  ...paragraph,
  fontSize: '15px',
  fontWeight: 'bold',
};

const menu = {
  container: {
    padding: '20px',
    textAlign: 'center' as const,
    backgroundColor: '#F9F9F9',
  },
  text: {
    margin: '0',
    color: '#888',
    fontSize: '14px',
  },
  link: {
    color: '#888',
    textDecoration: 'underline',
  },
};

const footer = {
  text: {
    margin: '20px 0 0 0',
    color: '#AFAFAF',
    fontSize: '12px',
    textAlign: 'center' as const,
  },
};
