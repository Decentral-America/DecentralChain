import { CheckCircle, Droplets, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useRouteLoaderData } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import { type loader as rootLoader } from '../root';

// ── reCAPTCHA v3 helper (no package needed — loads the script lazily) ─────────
function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(resolve);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.onload = () => window.grecaptcha?.ready(resolve);
    document.head.appendChild(script);
  });
}

async function getRecaptchaToken(siteKey: string): Promise<string> {
  await loadRecaptchaScript(siteKey);
  return window.grecaptcha?.execute(siteKey, { action: 'faucet' }) ?? '';
}

// ── Address validation (same regex as server + Address page) ──────────────────
const DCC_ADDRESS_RE = /^3[1-9A-HJ-NP-Za-km-z]{34}$/;

// ── Page ──────────────────────────────────────────────────────────────────────
type FaucetStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; txId: string; amount: number }
  | { kind: 'error'; message: string };

export function meta() {
  return [
    { title: 'DCC Faucet — DecentralScan' },
    {
      content: 'Request free DCC testnet tokens for development and testing.',
      name: 'description',
    },
  ];
}

export default function FaucetPage() {
  const config = useRouteLoaderData<typeof rootLoader>('root');
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [status, setStatus] = useState<FaucetStatus>({ kind: 'idle' });
  const addressRef = useRef<HTMLInputElement>(null);

  const faucetEnabled = config?.faucetEnabled ?? false;
  const faucetAmountDcc = config?.faucetAmountDcc ?? 10;
  const recaptchaSiteKey = config?.recaptchaSiteKey ?? '';

  // Pre-load reCAPTCHA script as soon as site key is available
  useEffect(() => {
    if (recaptchaSiteKey) {
      loadRecaptchaScript(recaptchaSiteKey).catch(() => undefined);
    }
  }, [recaptchaSiteKey]);

  function validateAddress(value: string): string {
    if (!value.trim()) return t('faucetAddressRequired');
    if (!DCC_ADDRESS_RE.test(value.trim())) return t('faucetAddressInvalid');
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = address.trim();
    const err = validateAddress(trimmed);
    if (err) {
      setAddressError(err);
      addressRef.current?.focus();
      return;
    }
    setAddressError('');
    setStatus({ kind: 'loading' });

    try {
      let captchaToken = '';
      if (recaptchaSiteKey) {
        captchaToken = await getRecaptchaToken(recaptchaSiteKey);
      }

      const res = await fetch('/api/faucet', {
        body: JSON.stringify({ address: trimmed, captchaToken }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const json = (await res.json()) as {
        amount?: number;
        error?: string;
        success?: boolean;
        txId?: string;
      };

      if (!res.ok || !json.success) {
        setStatus({ kind: 'error', message: json.error ?? t('faucetErrorGeneric') });
        return;
      }

      setStatus({ amount: json.amount ?? 0, kind: 'success', txId: json.txId ?? '' });
      setAddress('');
    } catch {
      setStatus({ kind: 'error', message: t('faucetErrorGeneric') });
    }
  }

  function handleAddressChange(value: string) {
    setAddress(value);
    if (addressError) setAddressError(validateAddress(value));
    if (status.kind !== 'idle') setStatus({ kind: 'idle' });
  }

  if (!faucetEnabled) {
    return (
      <div className="max-w-xl mx-auto mt-12 text-center">
        <Droplets className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">{t('faucet')}</h1>
        <p className="text-muted-foreground">{t('faucetNotAvailable')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('faucet')}</h1>
        <p className="text-muted-foreground mt-1">{t('faucetSubtitle')}</p>
      </div>

      {/* Main card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            {t('faucetTestnetAddress')}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Illustration + description */}
          <div className="flex items-start gap-6">
            <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shadow-sm">
              <Droplets className="w-10 h-10 text-primary/70" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {t('faucetDescription', { amount: String(faucetAmountDcc) })}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <div className="space-y-1">
              <Input
                ref={addressRef}
                type="text"
                placeholder={t('faucetAddressPlaceholder')}
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                disabled={status.kind === 'loading'}
                aria-label={t('faucetAddressLabel')}
                aria-invalid={!!addressError}
                aria-describedby={addressError ? 'address-error' : undefined}
                className={addressError ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {addressError && (
                <p id="address-error" className="text-xs text-destructive">
                  {addressError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={status.kind === 'loading'}>
              {status.kind === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('faucetSending')}
                </>
              ) : (
                <>
                  <Droplets className="w-4 h-4 mr-2" />
                  {t('faucetRequestButton', { amount: String(faucetAmountDcc) })}
                </>
              )}
            </Button>
          </form>

          {/* Status messages */}
          {status.kind === 'success' && (
            <div className="flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">
                  {t('faucetSuccess', { amount: String(status.amount) })}
                </p>
                <p className="text-green-700 dark:text-green-400">
                  {t('faucetTxId')}{' '}
                  <Link
                    to={`${createPageUrl('Transaction')}?id=${status.txId}`}
                    className="font-mono underline hover:no-underline inline-flex items-center gap-1"
                  >
                    {status.txId.slice(0, 16)}…
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </p>
              </div>
            </div>
          )}

          {status.kind === 'error' && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{status.message}</p>
            </div>
          )}

          {/* reCAPTCHA + support notice */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
            {recaptchaSiteKey ? (
              <span>
                {t('faucetRecaptchaNotice')}{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {t('faucetPrivacyPolicy')}
                </a>{' '}
                {t('faucetAnd')}{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {t('faucetTermsOfService')}
                </a>{' '}
                {t('faucetApply')}.
              </span>
            ) : (
              <span />
            )}
            <span>
              {t('faucetProblems')}{' '}
              <a href="mailto:info@decentralchain.io" className="underline hover:no-underline">
                info@decentralchain.io
              </a>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
