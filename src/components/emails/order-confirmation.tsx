import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { formatPrice } from '@/lib/utils/currency';
import { siteConfig } from '@/lib/config/site';
import * as styles from './styles';

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
  locale: string;
  subtotal: string;
  shippingCost: string;
  taxCost: string;
}

export const OrderConfirmationEmail = ({
  orderId,
  customerName,
  items,
  totalAmount,
  currency,
  shippingAddress,
  trackingNumber,
  trackingUrl,
  locale,
  subtotal,
  shippingCost,
  taxCost,
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

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.brand}>{siteConfig.name}</Heading>
          </Section>

          <Section style={styles.message}>
            <Heading style={styles.heading}>{text.title}</Heading>
            <Text style={styles.textStyle}>{text.greeting}</Text>
            <Text style={styles.textStyle}>
              {text.received} <strong>{orderId}</strong>.{text.preparing}
            </Text>

            {trackingNumber && (
              <Section style={styles.trackingBox}>
                <Text style={styles.trackingTitle}>{text.trackingTitle}</Text>
                <Text style={styles.trackingNumberStyle}>{trackingNumber}</Text>
                {trackingUrl && (
                  <Link href={trackingUrl} style={styles.button}>
                    {text.trackButton}
                  </Link>
                )}
              </Section>
            )}
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>{text.shippingAddress}</Text>
            <Text style={styles.addressText}>
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

          <Hr style={styles.hr} />

          <Section style={styles.sectionPadding}>
            <Text style={styles.sectionTitle}>{text.summary}</Text>
            {items.map((item, index) => (
              <Row key={index} style={styles.itemRow}>
                <Column>
                  <Text style={styles.itemText}>
                    {item.name}{' '}
                    <span style={styles.quantity}>x{item.quantity}</span>
                  </Text>
                </Column>
                <Column style={styles.priceColumn}>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price, item.currency as any, locale)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={styles.hrLight} />

          <Section style={styles.sectionPadding}>
            <Row style={styles.summaryRow}>
              <Column>
                <Text style={styles.summaryLabel}>{text.subtotal}</Text>
              </Column>
              <Column style={styles.priceColumn}>
                <Text style={styles.summaryValue}>
                  {formatPrice(subtotal, currency as any, locale)}
                </Text>
              </Column>
            </Row>
            <Row style={styles.summaryRow}>
              <Column>
                <Text style={styles.summaryLabel}>{text.shipping}</Text>
              </Column>
              <Column style={styles.priceColumn}>
                <Text style={styles.summaryValue}>
                  {formatPrice(shippingCost, currency as any, locale)}
                </Text>
              </Column>
            </Row>
            <Row style={styles.summaryRow}>
              <Column>
                <Text style={styles.summaryLabel}>{text.taxes}</Text>
              </Column>
              <Column style={styles.priceColumn}>
                <Text style={styles.summaryValue}>
                  {formatPrice(taxCost, currency as any, locale)}
                </Text>
              </Column>
            </Row>
            <Hr style={styles.hrLight} />
            <Row style={{ ...styles.summaryRow, paddingTop: '10px' }}>
              <Column>
                <Text style={styles.totalLabel}>{text.total}</Text>
              </Column>
              <Column style={styles.priceColumn}>
                <Text style={styles.totalValue}>
                  {formatPrice(totalAmount, currency as any, locale)}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <Link href="#" style={styles.footerLink}>
                {text.shop}
              </Link>{' '}
              •{' '}
              <Link href="#" style={styles.footerLink}>
                {text.account}
              </Link>
            </Text>
            <Text style={styles.footerCopyright}>
              © {new Date().getFullYear()} {siteConfig.name} Inc. {text.rights}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;
