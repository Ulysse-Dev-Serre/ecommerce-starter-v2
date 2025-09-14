import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/utils.ts')

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {},
  },
}

export default withNextIntl(nextConfig)
