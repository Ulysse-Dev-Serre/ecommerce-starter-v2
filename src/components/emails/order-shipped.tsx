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
import { siteConfig } from '@/lib/config/site';
import * as styles from './styles';

interface OrderShippedEmailProps {
  orderId: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl: string;
  carrierName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  locale: string;
}

export const OrderShippedEmail = ({
  orderId,
  customerName,
  trackingNumber,
  trackingUrl,
  carrierName,
  shippingAddress,
  locale,
}: OrderShippedEmailProps) => {
  const t = {
    fr: {
      preview: `Votre commande ${orderId} est en route !`,
      title: 'Bonne nouvelle !',
      greeting: `Bonjour ${customerName},`,
      message: `Votre commande ${orderId} a été expédiée et est en route vers chez vous.`,
      trackingTitle: 'Suivi de votre colis',
      trackingText: `Votre colis a été remis à ${carrierName}. Vous pouvez suivre son avancement :`,
      trackButton: 'Suivre mon colis',
      shippingAddress: 'Adresse de livraison',
      footerValues: 'Nos valeurs',
      footerEnvironment: `${siteConfig.name} s'engage pour une agriculture durable.`,
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
      footerEnvironment: `${siteConfig.name} is committed to sustainable agriculture.`,
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
            <Text style={styles.textStyle}>{text.message}</Text>

            <Section style={styles.trackingBox}>
              <Text style={styles.trackingTitle}>{text.trackingTitle}</Text>
              <Text style={styles.textStyle}>{text.trackingText}</Text>
              <Text style={styles.trackingNumberStyle}>{trackingNumber}</Text>
              <Link href={trackingUrl} style={styles.button}>
                {text.trackButton}
              </Link>
            </Section>
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

          <Hr style={styles.hrLight} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              <strong>{text.footerValues}</strong>
              <br />
              {text.footerEnvironment}
            </Text>
            <Text style={{ ...styles.footerText, marginTop: '20px' }}>
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

export default OrderShippedEmail;
