# MetroGlassOps API (v1)

Bearer-token JSON API for bots and integrations. Runs at
`https://www.ops.metroglasspro.com/api/v1/*`.

All requests need:

```
Authorization: Bearer <token>
Content-Type: application/json
```

## Issuing a key

Migration `007_api_keys.sql` adds a table and two SQL helpers. Once the
migration is applied, run this from the Supabase SQL editor — **only the
returned `token` is ever shown, copy it into your bot's env immediately**:

```sql
SELECT * FROM public.issue_api_key('permit-pulse bot');
-- Optional: explicit scopes (default is read+write).
SELECT * FROM public.issue_api_key('read-only dashboard reader', ARRAY['read']::text[]);
```

To revoke:

```sql
SELECT public.revoke_api_key('00000000-0000-0000-0000-000000000000'::uuid);
```

To list (without exposing tokens):

```sql
SELECT id, name, key_prefix, scopes, created_at, last_used_at, revoked_at
FROM public.api_keys ORDER BY created_at DESC;
```

## Errors

Every error response has the shape:

```json
{ "error": { "code": "bad_request", "message": "...", "details": ... } }
```

Common codes:

| Code | Status | Meaning |
| --- | --- | --- |
| `missing_token` | 401 | No `Authorization: Bearer` header. |
| `invalid_token` | 401 | Token is unknown, malformed, or revoked. |
| `insufficient_scope` | 403 | Key lacks the required scope (`read` or `write`). |
| `bad_request` | 400 | Validation error — `details` describes what's wrong. |
| `not_found` | 404 | Target row does not exist. |
| `internal_error` | 500 | Unhandled exception; check Vercel logs. |

## Endpoints

### `GET /api/v1/dashboard` — KPI roll-up

Scope: `read`.

```
curl -s https://www.ops.metroglasspro.com/api/v1/dashboard \
  -H "Authorization: Bearer $MGOPS_TOKEN" | jq
```

Returns month-to-date revenue (gross), expenses, net, open job count,
upcoming installs (next 7 days), reminders due in the next 3 days, and
expenses bucketed by category.

### `GET /api/v1/jobs` — list jobs

Scope: `read`. Query params: `status`, `limit` (max 200, default 50).

```
curl -s "https://www.ops.metroglasspro.com/api/v1/jobs?status=installed&limit=20" \
  -H "Authorization: Bearer $MGOPS_TOKEN"
```

### `POST /api/v1/jobs` — create a job

Scope: `write`. Required: `job_name`, `address`. Optional: `client_id`,
`status`, `install_date`, `install_end_date`, `quoted_price`,
`deposit_amount`, `scope_of_work`, `area`, `glass_type`, `glass_thickness`,
`hardware_finish`, `configuration`, `dimensions`, `notes`.

```
curl -s https://www.ops.metroglasspro.com/api/v1/jobs \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_name": "Smith — Master Bath",
    "address": "120 W 81st St, Apt 4B",
    "status": "estimate",
    "quoted_price": 4800,
    "deposit_amount": 1500,
    "install_date": "2026-06-12"
  }'
```

### `GET /api/v1/jobs/{id}` — fetch one job

Scope: `read`. Returns the job plus its invoices, payments, expenses, and
the linked client.

### `PATCH /api/v1/jobs/{id}` — partial update

Scope: `write`. Send only the fields you want to change. Status transitions
follow the existing enum (`estimate`, `deposit_received`, `measured`,
`ordered`, `installed`, `closed`).

```
curl -s -X PATCH https://www.ops.metroglasspro.com/api/v1/jobs/<id> \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "ordered", "install_date": "2026-06-19" }'
```

### `POST /api/v1/expenses` — record an expense

Scope: `write`. Required: `amount` (>0), `vendor`, `category`. Optional:
`payment_method`, `date` (YYYY-MM-DD), `job_id`, `note`,
`receipt_image_url`.

```
curl -s https://www.ops.metroglasspro.com/api/v1/expenses \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 312.40,
    "vendor": "Mr Glass",
    "category": "glass",
    "payment_method": "stripe",
    "job_id": "<uuid>",
    "note": "Tempered 3/8 inch panel"
  }'
```

### `POST /api/v1/payments` — record a payment

Scope: `write`. Required: `job_id`, `gross_amount` (>0). Optional:
`invoice_id`, `payment_type` (`deposit` | `final` | `other`), `method`,
`date`, `note`, `confirmation_image_url`.

For `method: "stripe"` the route auto-derives the 2.9% + $0.30 fee and
stores the post-fee net in `amount`, matching the webhook.

```
curl -s https://www.ops.metroglasspro.com/api/v1/payments \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "<uuid>",
    "invoice_id": "<uuid-or-null>",
    "gross_amount": 1500,
    "payment_type": "deposit",
    "method": "zelle",
    "note": "Deposit received"
  }'
```

### `POST /api/v1/reminders` — create a reminder

Scope: `write`. Required: `title`. Optional: `job_id`, `reminder_date`,
`priority` (`high` | `moderate` | `low`).

```
curl -s https://www.ops.metroglasspro.com/api/v1/reminders \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Confirm install with super",
    "reminder_date": "2026-06-10",
    "priority": "high"
  }'
```

### `PATCH /api/v1/reminders/{id}` — toggle done / edit

Scope: `write`. Send any subset of `done` (boolean), `title`,
`reminder_date`, `priority`.

```
curl -s -X PATCH https://www.ops.metroglasspro.com/api/v1/reminders/<id> \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "done": true }'
```

### `GET /api/v1/clients` — list clients

Scope: `read`. Query params: `search` (case-insensitive name match), `limit`
(max 200, default 50).

### `POST /api/v1/clients` — create a client

Scope: `write`. Required: `name`. Optional: `email`, `phone`,
`billing_address`. Common pattern: bot creates a new client, captures the
returned `id`, then POSTs `/api/v1/jobs` with `client_id` set to that id.

```
curl -s https://www.ops.metroglasspro.com/api/v1/clients \
  -H "Authorization: Bearer $MGOPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smith Family Trust",
    "email": "smith@example.com",
    "phone": "212-555-0188"
  }'
```

### `GET /api/v1/invoices` — list invoices

Scope: `read`. Query params: `status` (`sent` | `deposit_paid` | `paid`),
`job_id`, `limit` (max 200, default 50), `before` (cursor, see below).
Each row includes the linked job basics and the `pdf_url` if generated.

### `GET /api/v1/payment-events` — Stripe webhook event log

Scope: `read`. Query params: `event_type` (e.g. `charge.refunded`),
`limit`, `before`. Backed by the `payment_events` table that the webhook
populates for `charge.refunded`, `charge.dispute.created`, and
`charge.dispute.closed` events. Use this to surface refunds and disputes
the bot should flag for manual reconciliation — the ledger does not
auto-mutate on these yet, so they need follow-up in the dashboard.

```
curl -s "https://www.ops.metroglasspro.com/api/v1/payment-events?event_type=charge.refunded&limit=10" \
  -H "Authorization: Bearer $MGOPS_TOKEN"
```

## Pagination

`/api/v1/jobs`, `/api/v1/invoices`, `/api/v1/clients`, and
`/api/v1/payment-events` return `next_cursor` (ISO timestamp) when the page
is full. Pass it as `?before=<cursor>` on the next request to walk
backwards in time. When `next_cursor` is `null`, you've hit the end.

```
# pseudo-code
cursor = None
while True:
    res = GET /api/v1/jobs?limit=200 + (f"&before={cursor}" if cursor else "")
    process(res["jobs"])
    cursor = res["next_cursor"]
    if not cursor:
        break
```

## Notes for the bot

- The API ignores RLS — the keys themselves are the auth boundary. Scope a
  bot to `read` only when it just needs to query.
- `last_used_at` is updated on every authenticated request, so you can spot
  dormant keys and prune them.
- Responses are JSON. Successful `POST` returns `201`; everything else
  returns `200`.
- Dates are sent as `YYYY-MM-DD`. Timestamps are ISO-8601 UTC.
- All money amounts are stored as Postgres `NUMERIC(12,2)` and serialized as
  JSON numbers.
