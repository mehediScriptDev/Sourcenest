'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export type PayPalSuccessMeta = {
  orderId?: string;
  vaultId?: string | null;
};

interface PayPalButtonProps {
  amount: number;
  onSuccess?: (transactionId: string, meta?: PayPalSuccessMeta) => void;
  onError?: (error: string) => void;
  currency?: string;
  className?: string;
  /** When true, asks PayPal to store the payment method for later auto-renew charges. */
  vault?: boolean;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string | HTMLElement) => Promise<void>;
        close?: () => Promise<void>;
      };
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPayPalSdk(clientId: string, currency: string): Promise<void> {
  if (!sdkLoadPromise) {
    sdkLoadPromise = new Promise<void>((resolve, reject) => {
      if (window.paypal?.Buttons) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      // vault=true enables vault capability; one-time payments still work when store_in_vault is omitted
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&vault=true`;
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

function extractVaultId(details: Record<string, unknown>): string | null {
  const paymentSource = details.payment_source as Record<string, unknown> | undefined;
  const paypal = paymentSource?.paypal as Record<string, unknown> | undefined;
  const attributes = paypal?.attributes as Record<string, unknown> | undefined;
  const vault = attributes?.vault as Record<string, unknown> | undefined;
  const id = vault?.id;

  return typeof id === 'string' && id !== '' ? id : null;
}

export function PayPalButton({
  amount,
  onSuccess,
  onError,
  currency = 'USD',
  className = '',
  vault = false,
}: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);
  const buttonRenderedRef = useRef(false);
  const vaultRef = useRef(vault);
  const amountRef = useRef(amount);
  const currencyRef = useRef(currency);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  vaultRef.current = vault;
  amountRef.current = amount;
  currencyRef.current = currency;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    isMountedRef.current = true;

    if (buttonRenderedRef.current) {
      setIsLoading(false);
      return;
    }

    const initPayPal = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
        if (!clientId) throw new Error('PayPal Client ID not configured');

        await loadPayPalSdk(clientId, currencyRef.current);

        if (!isMountedRef.current || !containerRef.current) return;

        if (buttonRenderedRef.current) {
          setIsLoading(false);
          return;
        }

        if (!window.paypal?.Buttons) throw new Error('PayPal not available');

        buttonRenderedRef.current = true;

        const buttons = window.paypal.Buttons({
          createOrder: async (_data: unknown, actions: {
            order: {
              create: (payload: Record<string, unknown>) => Promise<string>;
            };
          }) => {
            const orderPayload: Record<string, unknown> = {
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: currencyRef.current,
                    value: amountRef.current.toFixed(2),
                  },
                },
              ],
            };

            if (vaultRef.current) {
              const origin =
                typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
              const currentPath =
                typeof window !== 'undefined'
                  ? `${window.location.origin}${window.location.pathname}`
                  : `${origin}/pricing`;

              orderPayload.payment_source = {
                paypal: {
                  attributes: {
                    vault: {
                      store_in_vault: 'ON_SUCCESS',
                      usage_type: 'MERCHANT',
                      customer_type: 'CONSUMER',
                    },
                  },
                  experience_context: {
                    return_url: currentPath,
                    cancel_url: currentPath,
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'PAY_NOW',
                  },
                },
              };
            }

            return await actions.order.create(orderPayload);
          },
          onApprove: async (data: { orderID?: string }, actions: {
            order: {
              capture: () => Promise<Record<string, unknown>>;
            };
          }) => {
            const details = await actions.order.capture();
            if (details.status === 'COMPLETED') {
              const purchaseUnits = details.purchase_units as Array<Record<string, unknown>> | undefined;
              const payments = purchaseUnits?.[0]?.payments as Record<string, unknown> | undefined;
              const captures = payments?.captures as Array<Record<string, unknown>> | undefined;
              const transactionId =
                (captures?.[0]?.id as string | undefined) ||
                (details.id as string | undefined) ||
                data.orderID ||
                '';

              onSuccessRef.current?.(transactionId, {
                orderId: (details.id as string | undefined) || data.orderID,
                vaultId: extractVaultId(details),
              });
            } else {
              onErrorRef.current?.(`Payment status: ${String(details.status ?? 'unknown')}`);
            }
          },
          onError: (err: { message?: string }) => {
            onErrorRef.current?.(err?.message || 'Payment failed');
          },
        });

        await buttons.render(containerRef.current);

        if (isMountedRef.current) setIsLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load PayPal';
        buttonRenderedRef.current = false;
        onErrorRef.current?.(message);
        if (isMountedRef.current) setIsLoading(false);
      }
    };

    initPayPal();

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
