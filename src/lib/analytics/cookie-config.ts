import type { CookieConsentConfig } from 'vanilla-cookieconsent';

export const cookieConfig: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      equalWeightButtons: true,
      flipButtons: false,
    },
    preferencesModal: {
      layout: 'box',
      position: 'right',
      equalWeightButtons: true,
      flipButtons: false,
    },
  },
  categories: {
    necessary: {
      readOnly: true,
      enabled: true,
    },
    analytics: {
      autoClear: {
        cookies: [
          {
            name: /^_ga/, // regex: match all cookies starting with '_ga'
          },
          {
            name: '_gid',
          },
        ],
      },
    },
    marketing: {
      autoClear: {
        cookies: [
          {
            name: /^_gcl/, // Google Ads
          },
          {
            name: /^_fbp/, // Facebook
          },
        ],
      },
    },
  },
  language: {
    default: 'en',
    autoDetect: 'browser',
    translations: {
      fr: {
        consentModal: {
          title: 'Nous utilisons des cookies',
          description:
            'Nous utilisons des cookies pour analyser notre trafic et personnaliser votre expérience. Vous pouvez accepter ou refuser ces cookies.',
          acceptAllBtn: 'Tout accepter',
          acceptNecessaryBtn: 'Tout refuser',
          showPreferencesBtn: 'Gérer les préférences',
        },
        preferencesModal: {
          title: 'Préférences de cookies',
          acceptAllBtn: 'Tout accepter',
          acceptNecessaryBtn: 'Tout refuser',
          savePreferencesBtn: 'Enregistrer',
          closeIconLabel: 'Fermer',
          sections: [
            {
              title: 'Cookies nécessaires',
              description:
                'Ces cookies sont essentiels au bon fonctionnement du site web.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Analytique',
              description:
                'Ces cookies nous aident à comprendre comment vous interagissez avec le site.',
              linkedCategory: 'analytics',
            },
            {
              title: 'Marketing',
              description:
                'Ces cookies sont utilisés pour afficher des publicités pertinentes.',
              linkedCategory: 'marketing',
            },
          ],
        },
      },
      en: {
        consentModal: {
          title: 'We use cookies',
          description:
            'We use cookies to analyze our traffic and personalize your experience. You can accept or reject these cookies.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          showPreferencesBtn: 'Manage preferences',
        },
        preferencesModal: {
          title: 'Cookie Preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Necessary Cookies',
              description:
                'These cookies are essential for the proper functioning of the website.',
              linkedCategory: 'necessary',
            },
            {
              title: 'Analytics',
              description:
                'These cookies help us understand how you interact with the website.',
              linkedCategory: 'analytics',
            },
            {
              title: 'Marketing',
              description:
                'These cookies are used to display relevant advertisements.',
              linkedCategory: 'marketing',
            },
          ],
        },
      },
    },
  },
};
