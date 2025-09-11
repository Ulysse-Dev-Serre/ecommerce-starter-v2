// src/app/[locale]/page.tsx
import Image from "next/image";

interface HomeProps {
  params: { locale: string };
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../lib/i18n/dictionaries/${locale}.json`)).default;
  } catch (error) {
    // Fallback vers français si la locale n'existe pas
    return (await import(`../../lib/i18n/dictionaries/fr.json`)).default;
  }
}

export default async function Home({ params: { locale } }: HomeProps) {
  const messages = await getMessages(locale);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <h1 className="text-2xl font-bold text-center sm:text-left">
          {locale === 'fr' ? 'Bienvenue sur votre boutique' : 'Welcome to your shop'}
        </h1>
        
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            {locale === 'fr' ? 'Commencez par éditer' : 'Get started by editing'}{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/[locale]/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            {locale === 'fr' 
              ? 'Sauvegardez et voyez vos changements instantanément.' 
              : 'Save and see your changes instantly.'
            }
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            {locale === 'fr' ? 'Déployer maintenant' : 'Deploy now'}
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            {locale === 'fr' ? 'Lire la documentation' : 'Read our docs'}
          </a>
        </div>

        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {locale === 'fr' 
              ? `Langue actuelle: Français - Cliquez sur "EN" dans la navbar pour changer`
              : `Current language: English - Click on "FR" in the navbar to change`
            }
          </p>
        </div>
      </main>
    </div>
  );
}