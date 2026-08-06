'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface PayPalVaultSetupButtonProps {
  onSuccess?: (vaultSetupToken: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string | HTMLElement) => Promise<void>;
      };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPayPalSdk(clientId: string): Promise<void> {
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise<void>((resolve, reject) => {
      if (window.paypal?.Buttons) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&vault=true`;
      script.async = true;
      script.onload = () => {
        let retries = 0;
        const check = () => {
          if (window.paypal?.Buttons) resolve();
          else if (retries++ < 10) setTimeout(check, 100);
          else reject(new Error('PayPal SDK failed to initialize'));
        };
        check();
      };
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.body.appendChild(script);
    });
  }

  return sdkLoadPromise;
}

/**
 * Saves a PayPal payment method without charging (vault setup for enabling auto-renew later).
 */
export function PayPalVaultSetupButton({
  onSuccess,
  onError,
  className = '',
}: PayPalVaultSetupButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const buttonRenderedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    isMountedRef.current = true;

    if (buttonRenderedRef.current) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) throw new Error('PayPal Client ID not configured');

        await loadPayPalSdk(clientId);

        if (!isMountedRef.current || !containerRef.current) return;
        if (buttonRenderedRef.current) {
          setIsLoading(false);
          return;
        }
        if (!window.paypal?.Buttons) throw new Error('PayPal not available');

        buttonRenderedRef.current = true;

        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const returnUrl = `${origin}/dashboard/manufacturer/subscription`;
        const cancelUrl = returnUrl;

        const buttons = window.paypal.Buttons({
          createVaultSetupToken: async () => {
            const response = await apiClient.post('/manufacturer/subscriptions/vault-setup-token', {
              return_url: returnUrl,
              cancel_url: cancelUrl,
            });

            const id = response.data?.data?.id;
            if (!id || typeof id !== 'string') {
              throw new Error(response.data?.message || 'Failed to create PayPal setup token');
            }

            return id;
          },
          onApprove: async (data: { vaultSetupToken?: string }) => {
            if (!data.vaultSetupToken) {
              onErrorRef.current?.('PayPal did not return a setup token');
              return;
            }
            onSuccessRef.current?.(data.vaultSetupToken);
          },
          onError: (err: { message?: string }) => {
            onErrorRef.current?.(err?.message || 'Failed to save PayPal payment method');
          },
        });

        await buttons.render(containerRef.current);
        if (isMountedRef.current) setIsLoading(false);
      } catch (err) {
        buttonRenderedRef.current = false;
        const message = err instanceof Error ? err.message : 'Failed to load PayPal';
        onErrorRef.current?.(message);
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    void init();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading PayPal...</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={`w-full transition-all duration-300 ${
          isLoading ? 'h-[120px] opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />
    </div>
  );
}
