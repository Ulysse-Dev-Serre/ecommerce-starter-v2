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
import { siteConfig } from '@/lib/config/site';
import * as styles from './styles';

interface RefundRequestAdminEmailProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  imageUrl?: string;
  locale: string;
}

export const RefundRequestAdminEmail = ({
  orderNumber,
  customerName,
  customerEmail,
  reason,
  imageUrl,
  locale,
}: RefundRequestAdminEmailProps) => {
  const t = {
    fr: {
      preview: `Nouvelle demande de remboursement pour la commande ${orderNumber}`,
      title: 'Demande de Remboursement',
      brand: `Admin ${siteConfig.name}`,
      message:
        'Une nouvelle demande de remboursement a été soumise par un client.',
      labelOrder: 'Commande :',
      labelCustomer: 'Client :',
      labelReason: 'Raison du remboursement :',
      labelImage: 'Image jointe :',
      imageText:
        "L'image a été envoyée en pièce jointe ou est consultable via le dashboard.",
      footer:
        'Pour traiter cette demande, rendez-vous dans le dashboard admin.',
    },
    en: {
      preview: `New refund request for order ${orderNumber}`,
      title: 'Refund Request',
      brand: `${siteConfig.name} Admin`,
      message: 'A new refund request has been submitted by a customer.',
      labelOrder: 'Order:',
      labelCustomer: 'Customer:',
      labelReason: 'Refund Reason:',
      labelImage: 'Attached Image:',
      imageText:
        'The image was sent as an attachment or is viewable via the dashboard.',
      footer: 'To process this request, go to the admin dashboard.',
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
            <Hr style={styles.hr} />
            <Text style={styles.sectionTitle}>{text.labelOrder}</Text>
            <Text style={styles.textStyle}>{orderNumber}</Text>

            <Text style={styles.sectionTitle}>{text.labelCustomer}</Text>
            <Text style={styles.textStyle}>
              {customerName} ({customerEmail})
            </Text>

            <Hr style={styles.hr} />
            <Text style={styles.sectionTitle}>{text.labelReason}</Text>
            <Text
              style={{
                ...styles.textStyle,
                backgroundColor: '#f4f4f4',
                padding: '12px',
                borderRadius: '4px',
              }}
            >
              {reason}
            </Text>

            {imageUrl && (
              <>
                <Hr style={styles.hr} />
                <Text style={styles.sectionTitle}>{text.labelImage}</Text>
                <Text style={styles.textStyle}>{text.imageText}</Text>
              </>
            )}
          </Section>
          <Hr style={styles.hr} />
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{text.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RefundRequestAdminEmail;
