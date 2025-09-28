// src/app/[locale]/page.tsx
import Image from 'next/image';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({
  params,
}: HomeProps): Promise<React.ReactElement> {
  const { locale } = await params;

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

        <h1 className="text-2xl text-center sm:text-left">
          {locale === 'fr'
            ? "Starter de boutique e-commerce, ceci est un projet personnel complexe que je me suis donné pour objectif de terminer d'ici la fin du stage de fin de session. Le but de ce projet est de  développer Un starter e-commerce universel, flexible et prêt à l'emploi pour lancer rapidement des boutiques en ligne dans n'importe quelle niche et n'importe quel pays. Je profite du devoir pour mettre en place le système de connexion avec Clerk et d'approfondir ma compréhension avec une présentation vidéo."
            : 'E-commerce shop starter, this is a complex personal project that I have set as a goal to complete by the end of my end-of-session internship. The purpose of this project is to develop a universal, flexible, and ready-to-use e-commerce starter to quickly launch online stores in any niche and any country.'}
        </h1>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left"></ol>
      </main>
    </div>
  );
}
