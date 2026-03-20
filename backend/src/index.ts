import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { createMollieClient } from '@mollie/api-client'

// ─── Mollie initialiseren ──────────────────────────────────────────────────────

const mollieKey = process.env.MOLLIE_API_KEY
if (!mollieKey || mollieKey.trim() === '') {
  console.error('╔══════════════════════════════════════════════════════════╗')
  console.error('║  FOUT: MOLLIE_API_KEY is niet ingesteld in backend/.env  ║')
  console.error('║  Voeg toe: MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxx       ║')
  console.error('║  Te vinden op: my.mollie.com → Developers → API keys     ║')
  console.error('╚══════════════════════════════════════════════════════════╝')
  process.exit(1)
}

const mollie     = createMollieClient({ apiKey: mollieKey })
const isTestMode = mollieKey.startsWith('test_')

console.log(`[Mollie] Client geïnitialiseerd | testModus=${isTestMode} | key=${mollieKey.slice(0, 12)}…`)

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

// Sta alle localhost-poorten toe (Vite kiest soms 5174, 5175 etc.)
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const toegestaan = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    callback(toegestaan ? null : new Error(`CORS: origin niet toegestaan: ${origin}`), toegestaan)
  },
}))
app.use(express.json())

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /terminals
 *
 * Haalt beschikbare Mollie Terminal readers op.
 * In testmodus worden de gesimuleerde terminals teruggegeven.
 *
 * Respons: { terminals: Terminal[] }
 */
app.get('/terminals', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[Terminals] Terminals ophalen via Mollie API…')
    // @mollie/api-client v4 gebruikt .page() i.p.v. .list()
    const page = await mollie.terminals.page()
    const terminals = Array.from(page).map((t) => ({
      id:          t.id,
      description: t.description,
      brand:       t.brand        ?? '',
      model:       t.model        ?? '',
      status:      t.status       ?? 'active',
    }))
    console.log(`[Terminals] ${terminals.length} terminal(s) opgehaald:`, terminals.map((t) => t.id))
    res.json({ terminals })
  } catch (err) {
    console.error('[Terminals] FOUT bij ophalen terminals:')
    console.error('  Message:', (err as Error).message)
    console.error('  Stack:',   (err as Error).stack)
    next(err)
  }
})

/**
 * POST /create-terminal-payment
 *
 * Maakt een Mollie betaling aan voor een betaalterminal.
 *
 * Body:    { amount: number, terminalId: string }
 *          amount is in eurocenten (bijv. 1050 = €10,50)
 * Respons: { id, status, changePaymentStateUrl? }
 *          changePaymentStateUrl is alleen aanwezig in testmodus
 */
app.post('/create-terminal-payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, terminalId } = req.body as { amount: unknown; terminalId: unknown }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      res.status(400).json({
        error: 'amount moet een positief geheel getal zijn (in centen, bijv. 1050 voor €10,50)',
      })
      return
    }

    if (typeof terminalId !== 'string' || !terminalId) {
      res.status(400).json({ error: 'terminalId is verplicht' })
      return
    }

    const euros = (amount / 100).toFixed(2)

    const payment = await mollie.payments.create({
      amount:     { currency: 'EUR', value: euros },
      description: 'POS betaling',
      method:     'pointofsale' as unknown as never,
      terminalId,
      // Webhook URL voor betaalstatus updates.
      // Lokaal testen: gebruik ngrok → https://JOUW-NGROK-ID.ngrok.io/webhook
      // Productie:     https://JOUW-DOMEIN.nl/webhook
      // webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
    })

    const response: Record<string, unknown> = {
      id:     payment.id,
      status: payment.status,
    }

    // In testmodus: geef de changePaymentState URL terug zodat betaalstatussen
    // gesimuleerd kunnen worden via POST /simulate-payment
    if (isTestMode && payment._links.changePaymentState?.href) {
      response.changePaymentStateUrl = payment._links.changePaymentState.href
    }

    res.json(response)
  } catch (err) {
    next(err)
  }
})

/**
 * GET /payment-status/:id
 *
 * Haalt de actuele betaalstatus op van een betaling.
 * Gebruikt door de frontend om te pollen (elke 2 seconden).
 *
 * Respons: { id, status, changePaymentStateUrl? }
 */
app.get('/payment-status/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await mollie.payments.get(req.params.id)

    const response: Record<string, unknown> = {
      id:     payment.id,
      status: payment.status,
    }

    if (isTestMode && payment._links.changePaymentState?.href) {
      response.changePaymentStateUrl = payment._links.changePaymentState.href
    }

    res.json(response)
  } catch (err) {
    next(err)
  }
})

/**
 * POST /webhook
 *
 * Ontvangt Mollie status-updates (webhook).
 *
 * Stel de webhook URL in op je Mollie dashboard:
 *   Lokaal testen: gebruik ngrok → https://JOUW-NGROK-ID.ngrok.io/webhook
 *   Productie:     https://JOUW-DOMEIN.nl/webhook
 *
 * Body: { id: string }  — de Mollie betaling-ID
 */
app.post('/webhook', (req: Request, res: Response) => {
  const id = req.body?.id as string | undefined
  console.log(`[Webhook] Betaalstatus update ontvangen voor payment:`, id)
  // Hier kun je de status ophalen en opslaan in een database:
  //   const payment = await mollie.payments.get(id)
  //   console.log('Nieuwe status:', payment.status)
  res.status(200).send('OK')
})

/**
 * POST /simulate-payment  (alleen testmodus)
 *
 * Simuleert een betaalstatus via de Mollie test API.
 * Handig voor testen zonder echte betaalterminal.
 *
 * Body:    { paymentId: string, state: 'paid' | 'failed' | 'expired' }
 * Respons: Mollie payment object
 */
app.post('/simulate-payment', async (req: Request, res: Response, next: NextFunction) => {
  if (!isTestMode) {
    res.status(403).json({ error: 'Simulatie is alleen beschikbaar in testmodus' })
    return
  }

  const { paymentId, state } = req.body as { paymentId: unknown; state: unknown }

  if (typeof paymentId !== 'string' || !paymentId) {
    res.status(400).json({ error: 'paymentId is verplicht' })
    return
  }
  if (typeof state !== 'string' || !['paid', 'failed', 'expired'].includes(state)) {
    res.status(400).json({ error: 'state moet "paid", "failed" of "expired" zijn' })
    return
  }

  try {
    // Roept de Mollie change-payment-state endpoint aan
    const response = await fetch(
      `https://api.mollie.com/v2/payments/${paymentId}/change-payment-state`,
      {
        method: 'POST',
        headers: {
          'Authorization':  `Bearer ${mollieKey}`,
          'Content-Type':   'application/json',
        },
        body: JSON.stringify({ status: state }),
      },
    )

    const data = await response.json() as object
    res.status(response.ok ? 200 : response.status).json(data)
  } catch (err) {
    next(err)
  }
})

// Eenvoudige health-check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), testMode: isTestMode })
})

// ─── Foutafhandeling ──────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Interne serverfout'
  console.error('Onverwachte fout:', message)
  res.status(500).json({ error: message })
})

// ─── Server starten ───────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✓ Mollie Terminal backend draait op http://localhost:${PORT}`)
  console.log(`  Modus: ${isTestMode ? 'TEST' : 'LIVE'}`)
  console.log(`  Endpoints:`)
  console.log(`    GET  http://localhost:${PORT}/terminals`)
  console.log(`    POST http://localhost:${PORT}/create-terminal-payment`)
  console.log(`    GET  http://localhost:${PORT}/payment-status/:id`)
  console.log(`    POST http://localhost:${PORT}/webhook`)
  if (isTestMode) {
    console.log(`    POST http://localhost:${PORT}/simulate-payment  (testmodus)`)
  }
})
