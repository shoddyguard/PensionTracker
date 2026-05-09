#!/usr/bin/env node
"use strict";

/**
 * Seed script, populates the database with realistic test data.
 *
 * Four pensions:
 *   1. Workplace Pension (active)        - 64 monthly snapshots, 2 funds with 60/40 targets,
 *                                          £500/month, receives transfer-in from pension 3
 *   2. Personal SIPP (active)            - 13 quarterly snapshots, 3 funds with ISINs,
 *                                          irregular contributions
 *   3. Old Workplace Pension (closed)    - 12 monthly snapshots with £300/month,
 *                                          final snapshot records full transfer-out to pension 1
 *   4. Legacy SIPP (active)              - £20,000 opening balance, 12 monthly snapshots,
 *                                          £100/month contributions
 *
 * Run:  npm run db:seed
 */

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const { mkdirSync } = require("fs");

const dbUrl = process.env.DATABASE_URL ?? "file:./data/pension.db";
const dbPath = path.resolve(dbUrl.replace("file:", ""));
mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// ---------------------------------------------------------------------------
// Clear existing data (child-first order since FK enforcement is off by default)
// ---------------------------------------------------------------------------
db.exec(`
  DELETE FROM contributions;
  DELETE FROM snapshot_entries;
  DELETE FROM snapshots;
  DELETE FROM funds;
  DELETE FROM pensions;
  DELETE FROM users;
`);
console.log("Cleared existing data.\n");

// ---------------------------------------------------------------------------
// Test user  username: pensiontracker / password: pensiontracker
// ---------------------------------------------------------------------------
const passwordHash = bcrypt.hashSync("pensiontracker", 12);
db.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)").run(
  "pensiontracker",
  passwordHash,
  Math.floor(Date.now() / 1000)
);
console.log("Test user created username: pensiontracker / password: pensiontracker\n");

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------
const insP  = db.prepare("INSERT INTO pensions (provider, name, status, opening_balance_date) VALUES (?, ?, ?, ?)");
const insF  = db.prepare("INSERT INTO funds (pension_id, name, target_allocation, ticker_isin, opening_balance) VALUES (?, ?, ?, ?, ?)");
const insS  = db.prepare("INSERT INTO snapshots (pension_id, date, created_at) VALUES (?, ?, ?)");
const insSE = db.prepare("INSERT INTO snapshot_entries (snapshot_id, fund_id, shares_held, value) VALUES (?, ?, ?, ?)");
const insC  = db.prepare("INSERT INTO contributions (snapshot_id, amount, type) VALUES (?, ?, ?)");

/** Add n whole months to a UTC date without day-of-month overflow issues */
function addMonths(date, n) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

/** Round to 2 decimal places */
function r2(n) { return Math.round(n * 100) / 100; }

/**
 * Drizzle's integer({ mode: "timestamp" }) stores Unix timestamps in SECONDS.
 * date.getTime() returns milliseconds, so we must divide by 1000 before inserting.
 */
function sec(date) { return Math.floor(date.getTime() / 1000); }

// ---------------------------------------------------------------------------
// PENSION 3 - Old Workplace Pension (closed)
// Built first so we can capture the transfer amount for pension 1.
//
// Timeline:
//   Jan 2021 – Dec 2021  12 monthly snapshots, £300/month contributions
//   Jul 2022             Final snapshot + full transfer_out (pension then closed)
// ---------------------------------------------------------------------------
const p3 = insP.run("Previous Employer", "Old Workplace Pension", "closed", null).lastInsertRowid;
const f3 = insF.run(p3, "Diversified Growth Fund", null, null, null).lastInsertRowid;

const P3_CONTRIB = 300;
let total3 = 0;
const start3 = new Date("2021-01-01");

for (let m = 0; m < 12; m++) {
  total3 = total3 * 1.0045 + P3_CONTRIB; // 0.45%/month growth + contribution
  const date = addMonths(start3, m);
  const snap = insS.run(p3, sec(date), sec(date)).lastInsertRowid;
  // Notional unit price rises slowly (£1.50 → ~£1.56 over 12 months)
  const unitPrice = 1.50 + m * 0.005;
  insSE.run(snap, f3, r2(total3 / unitPrice), r2(total3));
  insC.run(snap, P3_CONTRIB, "contribution");
}

// 7 months of passive growth (no contributions): Jan 2022 → Jul 2022
for (let m = 0; m < 7; m++) total3 = total3 * 1.0045;

const transferAmount = r2(total3);
const closeDate = new Date("2022-07-01");
const closeSnap = insS.run(p3, sec(closeDate), sec(closeDate)).lastInsertRowid;
insSE.run(closeSnap, f3, r2(transferAmount / (1.50 + 18 * 0.005)), r2(transferAmount));
insC.run(closeSnap, transferAmount, "transfer_out");

console.log(`Old Workplace Pension - 12 monthly + 1 transfer snapshot (transfer out: £${transferAmount.toFixed(2)})`);

// ---------------------------------------------------------------------------
// PENSION 1 - Workplace Pension (active)
// 2 funds, 60/40 target split. Allocation drifts over time to test
// the rebalancing indicator (equity drifts high, bonds drift low).
//
// Timeline:
//   Jan 2021 – Apr 2026  64 monthly snapshots, £500/month
//   Jul 2022 (month 18)  Also receives transfer_in from Old Workplace Pension
// ---------------------------------------------------------------------------
const p1 = insP.run("Employer Scheme", "Workplace Pension", "active", null).lastInsertRowid;
const f1a = insF.run(p1, "Global Equity Fund", 60, null, null).lastInsertRowid; // target 60%
const f1b = insF.run(p1, "Bond Fund",          40, null, null).lastInsertRowid; // target 40%

const P1_CONTRIB      = 500;
const TRANSFER_MONTH  = 18; // 18 months from Jan 2021 = Jul 2022

// Most months grow at 0.55%. Two outlier months to exercise the period-return display:
//   Month 24 (Jan 2023): +9%  - strong rally
//   Month 38 (Mar 2024): -4%  - market dip
const P1_MONTHLY_RATE = { 24: 1.09, 38: 0.96 };

let total1 = 0;
const start1 = new Date("2021-01-01");

for (let m = 0; m < 64; m++) {
  const rate = P1_MONTHLY_RATE[m] ?? 1.0055;
  total1 = total1 * rate + P1_CONTRIB;
  if (m === TRANSFER_MONTH) total1 += transferAmount;

  const date = addMonths(start1, m);
  const snap = insS.run(p1, sec(date), sec(date)).lastInsertRowid;

  // Allocation drifts over time:
  //   Global Equity: target 60%, actual drifts 60% → 70% (over 63 months)
  //   Bonds:         target 40%, actual drifts 40% → 30%
  // This means at the final snapshot both funds show >5% drift.
  const progress  = m / 63;
  const equityPct = 60 + 10 * progress; // 60% → 70%
  const bondsPct  = 40 - 10 * progress; // 40% → 30%

  const equityVal = r2(total1 * equityPct / 100);
  const bondsVal  = r2(total1 * bondsPct  / 100);

  // Unit prices rise at different rates (equity outperforms bonds)
  const equityUnit = 10 * (1 + m * 0.0055); // £10.00 → £12.47
  const bondsUnit  = 10 * (1 + m * 0.0010); // £10.00 → £10.63

  insSE.run(snap, f1a, r2(equityVal / equityUnit), equityVal);
  insSE.run(snap, f1b, r2(bondsVal  / bondsUnit),  bondsVal);

  insC.run(snap, P1_CONTRIB, "contribution");
  if (m === TRANSFER_MONTH) insC.run(snap, transferAmount, "transfer_in");
}
console.log("Workplace Pension        - 64 monthly snapshots, £500/month, transfer-in at Jul 2022");

// ---------------------------------------------------------------------------
// PENSION 2 - Personal SIPP (active)
// 3 funds with ISINs but no target allocations (rebalancing dormant).
// Quarterly snapshots with irregular contributions to test £0-contribution months.
//
// Timeline: Jan 2023 – Jan 2026 (13 quarters)
// ---------------------------------------------------------------------------
const p2  = insP.run("Investment Platform", "Personal SIPP", "active", null).lastInsertRowid;
const f2a = insF.run(p2, "Global All Cap Index",    null, "IE00B4L5Y983", null).lastInsertRowid;
const f2b = insF.run(p2, "Short Duration Bond",     null, "IE00B4WXJJ64", null).lastInsertRowid;
const f2c = insF.run(p2, "Emerging Markets Equity", null, "IE00B3F81G20", null).lastInsertRowid;

// Irregular contributions (£0 = no contribution row inserted)
const P2_CONTRIBS = [1200, 0, 800, 1200, 1200, 0, 1200, 800, 1200, 1200, 0, 1200, 1000];
const P2_ALLOCS   = [65, 25, 10]; // % split across [f2a, f2b, f2c]
const p2Funds     = [f2a, f2b, f2c];

let total2 = 0;
const start2 = new Date("2023-01-01");

for (let q = 0; q < 13; q++) {
  total2 = total2 * 1.0168 + P2_CONTRIBS[q]; // ~6.8% annual = 1.68%/quarter

  const date = addMonths(start2, q * 3);
  const snap = insS.run(p2, sec(date), sec(date)).lastInsertRowid;

  const unitPrice = 10 * (1 + q * 0.012); // rising unit price across all 3 funds
  p2Funds.forEach((fid, i) => {
    const val = r2(total2 * P2_ALLOCS[i] / 100);
    insSE.run(snap, fid, r2(val / unitPrice), val);
  });

  if (P2_CONTRIBS[q] > 0) insC.run(snap, P2_CONTRIBS[q], "contribution");
}
console.log("Personal SIPP            - 13 quarterly snapshots, irregular contributions, 3 funds with ISINs");

// ---------------------------------------------------------------------------
// PENSION 4 - Legacy SIPP (active)
// Single fund with a £20,000 opening balance set at Dec 2022.
// 12 monthly snapshots from Jan 2023, £100/month contributions.
// ---------------------------------------------------------------------------
const p4obDate = new Date("2022-12-01");
const p4 = insP.run("Heritage Provider", "Legacy SIPP", "active", sec(p4obDate)).lastInsertRowid;
const f4 = insF.run(p4, "Balanced Growth Fund", null, null, 20000).lastInsertRowid;

const P4_CONTRIB = 100;
let total4 = 20000; // starts from opening balance
const start4 = new Date("2023-01-01");

for (let m = 0; m < 12; m++) {
  total4 = total4 * 1.004 + P4_CONTRIB; // 0.4%/month growth + contribution
  const date = addMonths(start4, m);
  const snap = insS.run(p4, sec(date), sec(date)).lastInsertRowid;
  const unitPrice = 5.00 + m * 0.02; // £5.00 → £5.22
  insSE.run(snap, f4, r2(total4 / unitPrice), r2(total4));
  insC.run(snap, P4_CONTRIB, "contribution");
}
console.log("Legacy SIPP              - £20,000 opening balance, 12 monthly snapshots, £100/month");

// ---------------------------------------------------------------------------
console.log("\nSeed complete.");
