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
import { formatPrice } from '@/lib/utils/currency';
import { siteConfig } from '@/lib/config/site';
import * as styles from './styles';

interface OrderRefundedEmailProps {
  orderId: string;
  customerName: string;
  amountRefunded: string;
  currency: string;
  locale: string;
}

export const OrderRefundedEmail = ({
  orderId,
  customerName,
  amountRefunded,
  currency,
  locale,
}: OrderRefundedEmailProps) => {
  const formattedAmount = formatPrice(amountRefunded, currency as any, locale);

  const t = {
    fr: {
      preview: `Remboursement initié pour la commande ${orderId}`,
      title: 'Remboursement en cours',
      greeting: `Bonjour ${customerName},`,
      message: `Nous avons initié le remboursement de ${formattedAmount} pour votre commande ${orderId}.`,
      details: `Le montant devrait apparaître sur votre relevé bancaire dans un délai de 5 à 10 jours ouvrables, selon les délais de traitement de votre banque.`,
      footerValues: 'Nos valeurs',
      footerEnvironment: `${siteConfig.name} s'engage pour une agriculture durable.`,
      shop: 'Boutique',
      account: 'Mon Compte',
      rights: 'Tous droits réservés.',
    },
    en: {
      preview: `Refund initiated for order ${orderId}`,
      title: 'Refund Initiated',
      greeting: `Hi ${customerName},`,
      message: `We have initiated a refund of ${formattedAmount} for your order ${orderId}.`,
      details: `The amount should appear on your bank statement within 5 to 10 business days, depending on your bank's processing time.`,
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
            <Text style={styles.textStyle}>{text.details}</Text>
          </Section>

          <Hr style={styles.hr} />

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

export default OrderRefundedEmail;
