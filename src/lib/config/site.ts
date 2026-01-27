import { env } from '../env';
import { SITE_NAME } from '../constants';

export const siteConfig = {
  name: SITE_NAME,
  url: env.NEXT_PUBLIC_SITE_URL,
  description: "Starter e-commerce universel, flexible et prêt à l'emploi.",
};
