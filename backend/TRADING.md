# Private trading dashboard

The admin's **Trading** screen reads Zerodha through Kite Connect. Kite MCP is
Zerodha's AI-assistant bridge built on these same APIs; this dashboard calls the
APIs directly and does not require an AI model or MCP connection to fetch data.
No account information, real trade fixtures, or credentials belong in Git.

## 1. Prepare private storage

In the Supabase SQL editor, run
`migrations/20261106_private_trading.sql`. It creates three tables with RLS
enabled and access revoked from `anon` and `authenticated`. Only the server's
service-role client accesses them. The existing admin JWT is deliberately not
used as a Supabase browser session.

Do not add public read policies or expose the service-role key to the browser.
The migration contains schema only and is safe to commit.

For historical reports, also run `migrations/20261107_trading_history.sql`.
It adds private import/ledger tables, date-aware fill identifiers, and the
service-role-only `import_trading_report` function. Re-running this migration
preserves records. The function commits one report and all its rows together;
conflicting fills roll the transaction back, and repeated reports add nothing.

## 2. Configure Zerodha

Create a personal app at <https://developers.kite.trade/>. Check Zerodha's
current plan/permissions for holdings, positions, margins, and trades; this
dashboard does not use a paid streaming feed or historical candle API.

Register this exact redirect URL in the Kite app:

```text
https://portfolio-website-nine-red-56.vercel.app/api/trading/callback
```

Set these **backend** environment variables in Vercel and, for local work, in
the ignored `backend/.env`:

```dotenv
KITE_API_KEY=<your app key>
KITE_API_SECRET=<your app secret>
KITE_REDIRECT_URL=https://portfolio-website-nine-red-56.vercel.app/api/trading/callback
TRADING_ENCRYPTION_KEY=<generated Fernet key>
TRADING_ADMIN_URL=https://shyampatadia.github.io/portfolio-website/admin/index.html
```

Generate the encryption key once from `backend/`:

```powershell
uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Copy the result straight into your environment configuration. Keep the same
key across deployments; replacing it makes existing tokens unreadable. It is
separate from `SECRET_KEY`. Never prefix these variables with `VITE_`.

For local testing, configure a Kite app redirect to
`http://127.0.0.1:8000/api/trading/callback` and set `TRADING_ADMIN_URL` to
`http://127.0.0.1:4173/admin/index.html` in the local environment.

## 3. Deploy and connect

Run `uv sync` and `uv run pytest` from `backend/`, and `npm run build` from
the repository root. Deploy the backend and frontend through their normal
pipelines. Sign into the admin, choose **Trading**, and click **Connect Kite**.
Complete the password/2FA steps only on Zerodha's login page. The callback
exchanges its single-use request token on the backend, stores the access token
encrypted in Supabase, and redirects to the dashboard. The dashboard starts
syncing after the redirect.

The login state is signed, expires in ten minutes, is bound to the admin, and
is consumed atomically. Financial responses have `Cache-Control: no-store`.
There are no order placement/modification endpoints. The repository-wide
`/static` mount was removed to avoid exposing environment/source files. The
admin entry point does not load Clarity or portfolio visitor analytics.

## 4. Keep it updated

While Trading is visible it checks every 60 seconds; syncs within 55 seconds
reuse the saved snapshot. The last successful snapshot time is always shown.
Returning to the tab triggers another check. Kite tokens expire at 6 AM IST
the next day, or sooner if revoked. Click **Reconnect Kite** each trading day.
There is no automated password/TOTP login.

To capture fills while the dashboard is closed, configure a trusted scheduler
(for example n8n or a server cron) to call:

```text
POST https://portfolio-website-nine-red-56.vercel.app/api/trading/scheduled-sync
Authorization: Bearer <TRADING_CRON_SECRET>
```

Set `TRADING_CRON_SECRET` to an independent random secret in the backend and
the scheduler's credential store. Do not put it in a workflow committed to Git
or in a query string. Schedule every 5–15 minutes during Indian market hours,
with a final capture after the last trade. A daily Kite login is still needed.
A 409 means reconnect; 429/502/503 mean retry later. An admin login token is
not accepted as the scheduler credential. No scheduler is activated by this code.

## Data scope and retention

### Import historical reports

In **Trading → Import reports**, select original Console tradebook and/or
funds-statement CSV files. Click **Validate files** to check the complete file
without saving it, review its dates and row count, then click **Import**.
The authenticated backend parses files in memory, with a 5 MB / 30,000-row
limit. It does not write a copy to the checkout or public storage. Keep original
reports outside the repository, such as in your private Downloads directory.

For an operator importing local files, run from `backend/`:

```powershell
uv run python scripts/import_trading_reports.py --dry-run "C:\private\tradebook.csv" "C:\private\ledger.csv"
uv run python scripts/import_trading_reports.py "C:\private\tradebook.csv" "C:\private\ledger.csv"
```

All files are parsed before any imports begin. Each file commits separately.
The script logs only counts and dates, never financial rows or credentials.
Reimporting the same file is safe. Overlapping reports deduplicate fills by
owner, trading date, normalized exchange, and trade ID. Console NSE/BSE F&O
records map to Kite's NFO/BFO exchanges; differing exchange/broker order IDs
do not cause duplicates. Existing conflicting symbol, side, units, or prices
are rejected rather than silently replaced. Ledger movements retain six-decimal
precision and deduplicate using their full content and reported balance.

### Read the historical views

The default **Overview** starts with total deposits, withdrawals, net money
added, net F&O profit/loss after charges, and the statement closing balance.
The before-charges result and the charges/adjustments are shown alongside the
net result. An expandable reconciliation includes opening and other balances.

The GitHub-style **Daily profit & loss** calendar defaults to after-charges
ledger results. Green means profit and red means loss. Both use the same five
absolute-rupee bands (up to 500 / 2,000 / 5,000 / 10,000 / over 10,000), with
darker shades for larger amounts. Zero, missing data, and trading days awaiting
a statement are separate states. Hover, focus, or select a date for exact
amounts; use the day details to open its trades. Arrow keys navigate dates.

Detailed records are available under **Trades**, **Funds & ledger**, and
**Live account**. The former fill-count calendar and the always-visible
holdings/positions sections were moved or replaced to keep the default view
focused on funding and actual profit/loss. No records or account features were
removed. Daily and instrument tables are expandable on Overview.

- **Gross realized F&O P&L:** sale proceeds minus purchase costs on days where
  every F&O instrument's net quantity is zero. Non-flat days are excluded and
  counted explicitly; no missing opening cost basis is invented.
- **Net F&O settlements:** credits minus debits on F&O obligation entries in
  the imported funds statement. Deposits, withdrawals (including quarterly
  settlements), and unrelated ledger movements are excluded.
- **Costs and adjustments:** gross less ledger settlement on dates present
  in both sources. This is a derived reconciliation amount, not an itemized
  brokerage/tax report or proof that both exports cover every segment.
- **Settlement drawdown:** peak-to-trough decline of cumulative net F&O
  settlements, including a zero starting baseline. It excludes external
  funding and is not a percentage drawdown of invested capital.
- **Funding and ledger balance:** bank receipts and payments appear separately.
  The ledger closing figure is dated and can differ from the current Kite
  margin/cash figure. It is not cash-flow-adjusted investment performance.
- The tradebook supports symbol, side, date, and page filters across all saved
  fills. Clicking a calendar date or daily result filters the complete
  tradebook, including older rows beyond the first 100.

### Live-data scope

- Cost basis and value cover current delivery holdings, including T+1 shares.
  They are not lifetime deposits, net worth, or withdrawable funds. Mutual
  funds, MTF financing, brokerage, taxes, and lifetime realized P&L are excluded.
- Equity margin, cash, and net positions P&L are shown separately. Position
  P&L includes the broker's net positions, including closed intraday positions.
- Kite's trade endpoint supplies **today's executed fills**, not past-year
  history. The calendar accumulates only captured fills; resyncs deduplicate
  on owner, exchange, and trade ID. It does not count submitted/rejected orders.
- Missing capture days remain unknown. A partial day's capture does not
  guarantee the entire day was observed. Import Console tradebook exports
  to backfill earlier dates; this does not invent old holdings snapshots.
- Value history saves the latest snapshot for each IST day. Purchases, sales,
  transfers, and corporate actions change these values; it is not a return or
  time-weighted performance chart. The complete tradebook is paginated.
- Disconnect removes the stored connection token and pending login state.
  Saved history remains private in Supabase. To erase it, delete this owner's
  rows from `trading_ledger`, `trading_imports`, `trading_trades`,
  `trading_days`, then `trading_connections` in SQL.
  You can also revoke the app's access in Zerodha.

Official references: [Kite MCP](https://zerodha.com/products/mcp),
[login/session](https://kite.trade/docs/connect/v3/user/),
[holdings](https://kite.trade/docs/connect/v3/portfolio/),
[today's trades](https://kite.trade/docs/connect/v3/orders/).
