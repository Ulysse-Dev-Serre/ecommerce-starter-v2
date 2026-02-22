import * as React from 'react';

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

interface AdminContactMessageEmailProps {
  name: string;
  email: string;
  message: string;
  siteName?: string;
  locale?: string;
}

export const AdminContactMessageEmail = ({
  name,
  email,
  message,
  siteName = siteConfig.name,
  locale = 'fr',
}: AdminContactMessageEmailProps) => {
  const t = {
    fr: {
      preview: `Nouveau message de ${name} sur ${siteName}`,
      brand: `Admin ${siteName}`,
      title: '📩 Nouveau Message Contact',
      intro: `Vous avez reçu un nouveau message via le formulaire de contact de <strong>${siteName}</strong>.`,
      labelFrom: 'De',
      footer: `Ce message a été envoyé depuis votre boutique en ligne ${siteName}. Vous pouvez répondre directement à cet email.`,
    },
    en: {
      preview: `New message from ${name} on ${siteName}`,
      brand: `${siteName} Admin`,
      title: '📩 New Contact Message',
      intro: `You received a new message via the contact form of <strong>${siteName}</strong>.`,
      labelFrom: 'From',
      footer: `This message was sent from your online store ${siteName}. You can reply directly to this email.`,
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
            <Text style={styles.textStyle}>
              <span dangerouslySetInnerHTML={{ __html: text.intro }} />
            </Text>

            <Hr style={styles.hr} />

            <Text style={styles.textStyle}>
              <strong>{text.labelFrom}:</strong> {name} ({email})
            </Text>

            <Section style={styles.trackingBox}>
              <Text
                style={{
                  ...styles.textStyle,
                  fontStyle: 'italic',
                  whiteSpace: 'pre-wrap',
                }}
              >
                &quot;{message}&quot;
              </Text>
            </Section>

            <Hr style={styles.hr} />

            <Text style={styles.footerText}>{text.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminContactMessageEmail;
