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

interface OrderDeliveredEmailProps {
  orderId: string;
  customerName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  locale: string;
}

export const OrderDeliveredEmail = ({
  orderId,
  customerName,
  shippingAddress,
  locale,
}: OrderDeliveredEmailProps) => {
  const t = {
    fr: {
      preview: `Votre commande ${orderId} a été livrée !`,
      title: 'Commande Livrée !',
      greeting: `Bonjour ${customerName},`,
      message: `Bonne nouvelle ! Votre commande ${orderId} a bien été livrée.`,
      enjoyText:
        'Nous espérons que vous apprécierez votre achat. Merci de votre confiance.',
      shippingAddress: 'Adresse de livraison',
      footerValues: 'Nos valeurs',
      footerEnvironment: `${siteConfig.name} s'engage pour une agriculture durable.`,
      shop: 'Boutique',
      account: 'Mon Compte',
      rights: 'Tous droits réservés.',
    },
    en: {
      preview: `Your order ${orderId} has been delivered!`,
      title: 'Order Delivered!',
      greeting: `Hi ${customerName},`,
      message: `Good news! Your order ${orderId} has been successfully delivered.`,
      enjoyText: 'We hope you enjoy your purchase. Thank you for your trust.',
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
            <Text style={styles.textStyle}>{text.enjoyText}</Text>
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

export default OrderDeliveredEmail;
