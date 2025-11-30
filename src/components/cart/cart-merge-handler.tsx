'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function CartMergeHandler(): null {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const hasMerged = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasMerged.current) return;

    const mergeCart = async () => {
      try {
        const response = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          hasMerged.current = true;
          const data = await response.json();
          if (data.data?.items?.length > 0) {
            router.refresh();
          }
        }
      } catch (error) {
        console.error('Failed to merge cart:', error);
      }
    };

    mergeCart();
  }, [isSignedIn, isLoaded, router]);

  return null;
}
