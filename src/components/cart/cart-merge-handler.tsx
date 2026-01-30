'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import { mergeCart } from '@/lib/client/cart';

export function CartMergeHandler(): null {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const hasMerged = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasMerged.current) return;

    const performMerge = async () => {
      try {
        const data = await mergeCart();
        hasMerged.current = true;
        if (data.data?.items?.length > 0) {
          router.refresh();
        }
      } catch (error) {
        console.error('Failed to merge cart:', error);
      }
    };

    void performMerge();
  }, [isSignedIn, isLoaded, router]);

  return null;
}
