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
import { i18n } from '@/lib/i18n/config';

interface OrderReturnLabelEmailProps {
  orderId: string;
  customerName: string;
  labelUrl: string;
  locale?: string;
}

import * as styles from './styles';

// ...
export const OrderReturnLabelEmail = ({
  orderId = 'ORD-123',
  customerName = 'Client',
  labelUrl = '#',
  locale = i18n.defaultLocale,
}: OrderReturnLabelEmailProps) => {
  const t = {
    fr: {
      preview: `Étiquette de retour pour votre commande ${orderId}`,
      title: 'Votre étiquette de retour',
      greeting: `Bonjour ${customerName},`,
      message: `Suite à votre demande, voici l'étiquette de retour pour votre commande #${orderId}.`,
      step1: "1. Imprimez l'étiquette PDF",
      step2: '2. Collez-la sur votre colis',
      step3: '3. Déposez-le au point de dépôt le plus proche',
      button: "TÉLÉCHARGER L'ÉTIQUETTE",
      footerMessage:
        'Si le bouton ne fonctionne pas, cliquez sur le lien ci-dessous :',
      footerLink: 'Lien direct vers votre étiquette PDF',
    },
    en: {
      preview: `Return label for your order ${orderId}`,
      title: 'Your return label',
      greeting: `Hello ${customerName},`,
      message: `Following your request, here is the return label for your order #${orderId}.`,
      step1: '1. Print the PDF label',
      step2: '2. Stick it on your package',
      step3: '3. Drop it off at the nearest drop-off point',
      button: 'DOWNLOAD LABEL',
      footerMessage: "If the button doesn't work, click the link below:",
      footerLink: 'Direct link to your PDF label',
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
          {/* Header Black Bar */}
          <Section style={styles.header}>
            <Text style={styles.brand}>AgTechNest</Text>
          </Section>

          {/* Main Content */}
          <Section style={styles.message}>
            <Heading style={styles.heading}>{text.title}</Heading>
            <Text style={styles.textStyle}>{text.greeting}</Text>
            <Text style={styles.textStyle}>{text.message}</Text>

            <Section style={styles.instructionBox}>
              <Text style={styles.instructionText}>{text.step1}</Text>
              <Text style={styles.instructionText}>{text.step2}</Text>
              <Text style={styles.instructionText}>{text.step3}</Text>
            </Section>

            <Section style={styles.buttonContainer}>
              <Button href={labelUrl} target="_blank" style={styles.button}>
                {text.button}
              </Button>
            </Section>

            <Hr style={styles.hr} />

            <Section style={styles.footer}>
              <Text style={styles.footerText}>{text.footerMessage}</Text>
              <Link href={labelUrl} target="_blank" style={styles.link}>
                {text.footerLink}
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReturnLabelEmail;
