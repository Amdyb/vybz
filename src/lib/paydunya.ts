// PayDunya checkout helpers — SERVER ONLY. Never import from client components.
// Secrets are read from env: PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN.
// PAYDUNYA_MODE = 'live' | 'test' (default test → sandbox API).

const MODE = process.env.PAYDUNYA_MODE === 'live' ? 'live' : 'test'
const BASE = MODE === 'live'
  ? 'https://app.paydunya.com/api/v1'
  : 'https://app.paydunya.com/sandbox-api/v1'

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY':  process.env.PAYDUNYA_MASTER_KEY  ?? '',
    'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY ?? '',
    'PAYDUNYA-TOKEN':       process.env.PAYDUNYA_TOKEN        ?? '',
  }
}

export function paydunyaConfigured(): boolean {
  return Boolean(
    process.env.PAYDUNYA_MASTER_KEY &&
    process.env.PAYDUNYA_PRIVATE_KEY &&
    process.env.PAYDUNYA_TOKEN
  )
}

interface CreateInvoiceArgs {
  amount: number
  planLabel: string
  description: string
  returnUrl: string
  cancelUrl: string
  callbackUrl: string
  customData: Record<string, string>
}

export type CreateInvoiceResult =
  | { ok: true; token: string; url: string }
  | { ok: false; error: string }

/** Create a PayDunya checkout invoice. Returns the hosted checkout URL + token. */
export async function createInvoice(args: CreateInvoiceArgs): Promise<CreateInvoiceResult> {
  const amountStr = String(args.amount)
  const body = {
    invoice: {
      total_amount: args.amount,
      description: args.description,
      items: {
        item_0: {
          name: `VYBZ ${args.planLabel}`,
          quantity: 1,
          unit_price: amountStr,
          total_price: amountStr,
          description: args.description,
        },
      },
    },
    store: { name: 'VYBZ', tagline: 'Nightlife & events' },
    actions: {
      return_url: args.returnUrl,
      cancel_url: args.cancelUrl,
      callback_url: args.callbackUrl,
    },
    custom_data: args.customData,
  }

  try {
    const res = await fetch(`${BASE}/checkout-invoice/create`, {
      method: 'POST', headers: headers(), body: JSON.stringify(body),
    })
    const data = await res.json() as { response_code?: string; response_text?: string; token?: string }
    if (data.response_code === '00' && data.token && data.response_text) {
      return { ok: true, token: data.token, url: data.response_text }
    }
    return { ok: false, error: data.response_text || 'Échec de la création du paiement.' }
  } catch {
    return { ok: false, error: 'PayDunya injoignable.' }
  }
}

export interface ConfirmResult {
  status: 'completed' | 'cancelled' | 'pending' | 'unknown'
  amount: number | null
  customData: Record<string, string>
}

/** Confirm an invoice by token (server-to-server). Source of truth for activation. */
export async function confirmInvoice(token: string): Promise<ConfirmResult> {
  try {
    const res = await fetch(`${BASE}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
      method: 'GET', headers: headers(),
    })
    const data = await res.json() as {
      status?: string
      invoice?: { total_amount?: number | string }
      custom_data?: Record<string, string>
    }
    const status = (['completed', 'cancelled', 'pending'].includes(data.status ?? '')
      ? data.status : 'unknown') as ConfirmResult['status']
    return {
      status,
      amount: data.invoice?.total_amount != null ? Number(data.invoice.total_amount) : null,
      customData: data.custom_data ?? {},
    }
  } catch {
    return { status: 'unknown', amount: null, customData: {} }
  }
}
