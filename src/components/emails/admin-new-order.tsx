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
import { formatPrice } from '@/lib/utils/currency';
import * as React from 'react';
import { i18n } from '@/lib/i18n/config';
import * as styles from './styles';

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
  const locale = i18n.adminLocale;
  const formattedPrice = formatPrice(totalAmount, currency as any, locale);

  const t = {
    fr: {
      preview: `Nouvelle commande : ${formattedPrice} par ${customerName}`,
      brand: 'Admin AgTechNest',
      title: 'Nouvelle Commande !',
      message: "Une nouvelle commande vient d'être passée sur la boutique.",
      labelAmount: 'Montant',
      labelCustomer: 'Client',
      labelOrder: 'Commande',
      labelItems: 'Articles',
      itemsCount: `${itemsCount} article(s)`,
      button: 'Voir la commande',
    },
    en: {
      preview: `New Order: ${formattedPrice} by ${customerName}`,
      brand: 'AgTechNest Admin',
      title: 'New Order!',
      message: 'A new order has just been placed on the store.',
      labelAmount: 'Amount',
      labelCustomer: 'Customer',
      labelOrder: 'Order',
      labelItems: 'Items',
      itemsCount: `${itemsCount} item(s)`,
      button: 'View Order',
    },
  };

  const text =
    t[locale as keyof typeof t] ||
    t[i18n.defaultLocale as keyof typeof t] ||
    t.en;

  return (
    <Html>
      <Head />
      <Preview>{text.preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.brand}>{text.brand}</Heading>
          </Section>

          <Section style={styles.message}>
            <Heading style={styles.heading}>{text.title}</Heading>
            <Text style={styles.textStyle}>{text.message}</Text>

            <Section style={styles.trackingBox}>
              <Text style={styles.trackingTitle}>{text.labelAmount}</Text>
              <Text style={styles.trackingNumberStyle}>{formattedPrice}</Text>

              <Text style={styles.trackingTitle}>{text.labelCustomer}</Text>
              <Text style={styles.textStyle}>{customerName}</Text>

              <Text style={styles.trackingTitle}>{text.labelOrder}</Text>
              <Text style={styles.textStyle}>#{orderId}</Text>

              <Text style={styles.trackingTitle}>{text.labelItems}</Text>
              <Text style={styles.textStyle}>{text.itemsCount}</Text>
            </Section>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <Link
                href={`${siteUrl}/admin/orders/${internalOrderId}`}
                style={styles.button}
              >
                {text.button}
              </Link>
            </div>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminNewOrderEmail;
