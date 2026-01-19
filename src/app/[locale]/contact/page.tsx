import { useTranslations } from 'next-intl';

export default function ContactPage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">{t('contact')}</h1>

      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Nous contacter</h2>
            <p className="text-gray-600 mb-6">
              Une question sur nos produits ou votre commande ? Remplissez le
              formulaire et nous vous répondrons dans les plus brefs délais.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">📧</div>
                <div>
                  <p className="font-medium">Email</p>
                  <a
                    href="mailto:support@agtechnest.com"
                    className="text-primary hover:underline"
                  >
                    support@agtechnest.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">📍</div>
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-gray-600">
                    Montreal, QC
                    <br />
                    Canada
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Comment pouvons-nous vous aider ?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
              disabled
            >
              Envoyer (Bientôt disponible)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
