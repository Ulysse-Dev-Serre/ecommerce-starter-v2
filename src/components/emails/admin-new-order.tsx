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

import { siteConfig, SupportedCurrency } from '@/lib/config/site';
import { formatPrice } from '@/lib/utils/currency';

import * as styles from './styles';

interface AdminNewOrderEmailProps {
  orderId: string;
  internalOrderId: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  itemsCount: number;
  siteUrl: string;
  locale: string;
}

export const AdminNewOrderEmail = ({
  orderId,
  internalOrderId,
  customerName,
  totalAmount,
  currency,
  itemsCount,
  siteUrl,
  locale,
}: AdminNewOrderEmailProps) => {
  const formattedPrice = formatPrice(
    totalAmount,
    currency as SupportedCurrency,
    locale
  );

  const t = {
    fr: {
      preview: `Nouvelle commande : ${formattedPrice} par ${customerName}`,
      brand: `Admin ${siteConfig.name}`,
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
      brand: `${siteConfig.name} Admin`,
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

  const text = t[locale as keyof typeof t] || t.en;

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
