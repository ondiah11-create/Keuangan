import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Home, Receipt, PiggyBank, Target, LayoutGrid, Plus, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, X, ChevronRight, ChevronLeft, ChevronDown, Search, SlidersHorizontal,
  Trash2, Pencil, Check, AlertTriangle, Calendar, Users, Tag, CreditCard, Landmark,
  Smartphone, Banknote, TrendingUp, TrendingDown, Sparkles, Bell, Settings, Info,
  RefreshCw, User, UserPlus, ArrowLeft, CheckCircle2, Clock, Coins, MoreHorizontal,
  Wallet, BarChart3, FileText, ReceiptText, Inbox
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

/* ============================================================
   CONSTANTS & HELPERS
   ============================================================ */

const STORAGE_KEY = "kk-data-v1";

// Theme: warm mustard-gold + seafoam mint + soft orange, matching the reference mockups.
const C = {
  blue: "#F7C948", // PRIMARY brand color (mustard/gold) — name kept for minimal diff
  blueDark: "#DFA22A", // deep amber, used for gradients + any small text/icon on light bg
  blueLight: "#FFF4D9", // pale gold tint for badges/cards
  mint: "#8AC6B8", // secondary brand color (seafoam mint)
  mintDark: "#5D9C8D",
  mintLight: "#E8F5F1",
  yellow: "#F4A93B", // mid amber, decorative
  yellowDark: "#C97B12", // warning text/badges (budget hampir habis, etc.)
  orange: "#F2924A", // accent / expense
  green: "#22B573", // semantic success / income — unchanged
  greenLight: "#E6F8EF",
  red: "#F0475B", // semantic danger — unchanged
  redLight: "#FDECEE",
  ink: "#22303A",
  muted: "#8A8FA3",
  bg: "#F6F7FB",
  card: "#FFFFFF",
  border: "#EEF0F5",
};

// Picks readable text (dark ink or white) for a given background hex.
function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16) || 0;
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const chan = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
function contrastText(hex) {
  try {
    return relativeLuminance(hex) > 0.53 ? C.ink : "#FFFFFF";
  } catch (e) {
    return "#FFFFFF";
  }
}
function darkenHex(hex, amount = 0.3) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
    return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  } catch (e) {
    return hex;
  }
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

let __idc = 0;
function uid(p = "id") {
  __idc += 1;
  return `${p}_${Date.now().toString(36)}${__idc}${Math.random().toString(36).slice(2, 6)}`;
}

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatMoney(n) {
  const v = Math.round(Number(n) || 0);
  const neg = v < 0;
  const s = Math.abs(v).toLocaleString("id-ID");
  return `${neg ? "-" : ""}Rp${s}`;
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDateLong(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${HARI[dt.getDay()]}, ${d} ${BULAN[m - 1]} ${y}`;
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "";
}

function parseDigits(str) {
  return String(str || "").replace(/[^\d]/g, "");
}

/* ---------- Default categories ---------- */
const DEFAULT_INCOME_CATS = [
  { nama: "Gaji", icon: "\u{1F4BC}", warna: "#3B82F6" },
  { nama: "Bisnis", icon: "\u{1F3E2}", warna: "#8B5CF6" },
  { nama: "Freelance", icon: "\u{1F4BB}", warna: "#06B6D4" },
  { nama: "Bonus", icon: "\u{1F381}", warna: "#F59E0B" },
  { nama: "Investasi", icon: "\u{1F4C8}", warna: "#10B981" },
  { nama: "Hadiah", icon: "\u{1F389}", warna: "#EC4899" },
  { nama: "Lainnya", icon: "\u{1F4B0}", warna: "#64748B" },
];
const DEFAULT_EXPENSE_CATS = [
  { nama: "Makanan", icon: "\u{1F354}", warna: "#F97316" },
  { nama: "Belanja", icon: "\u{1F6CD}\uFE0F", warna: "#EC4899" },
  { nama: "Rumah", icon: "\u{1F3E0}", warna: "#8B5CF6" },
  { nama: "Listrik", icon: "\u{1F4A1}", warna: "#F59E0B" },
  { nama: "Air", icon: "\u{1F6B0}", warna: "#0EA5E9" },
  { nama: "Internet", icon: "\u{1F310}", warna: "#6366F1" },
  { nama: "Transportasi", icon: "\u{1F697}", warna: "#14B8A6" },
  { nama: "Pendidikan", icon: "\u{1F393}", warna: "#3B82F6" },
  { nama: "Kesehatan", icon: "\u{1F3E5}", warna: "#EF4444" },
  { nama: "Cicilan", icon: "\u{1F4B3}", warna: "#DC2626" },
  { nama: "Hiburan", icon: "\u{1F3AC}", warna: "#A855F7" },
  { nama: "Belanja Online", icon: "\u{1F4E6}", warna: "#F472B6" },
  { nama: "Pulsa & Paket Data", icon: "\u{1F4F1}", warna: "#22C55E" },
  { nama: "Tabungan & Investasi", icon: "\u{1F3E6}", warna: "#8AC6B8" },
  { nama: "Lainnya", icon: "\u{1F516}", warna: "#64748B" },
];
const GOAL_SAVING_CATEGORY_NAME = "Tabungan & Investasi";

function buildDefaultCategories() {
  const list = [];
  DEFAULT_INCOME_CATS.forEach((c) =>
    list.push({ id: uid("cat"), tipe: "INCOME", nama: c.nama, icon: c.icon, warna: c.warna, parent_id: null, is_default: true, is_active: true })
  );
  DEFAULT_EXPENSE_CATS.forEach((c) =>
    list.push({ id: uid("cat"), tipe: "EXPENSE", nama: c.nama, icon: c.icon, warna: c.warna, parent_id: null, is_default: true, is_active: true })
  );
  return list;
}

function createDefaultData() {
  return {
    settings: { onboarded: false, familyName: "", currency: "IDR" },
    members: [],
    accounts: [],
    categories: buildDefaultCategories(),
    transactions: [],
    budgets: [],
    goals: [],
    goalDeposits: [],
    goalInstallments: [],
    bills: [],
    billPayments: [],
  };
}

/* ---------- Derived calculations ---------- */
function accountBalance(acc, d) {
  let bal = Number(acc.saldo_awal) || 0;
  for (const t of d.transactions) {
    const nom = Number(t.nominal) || 0;
    if (t.tipe === "INCOME" && t.account_id === acc.id) bal += nom;
    else if (t.tipe === "EXPENSE" && t.account_id === acc.id) bal -= nom;
    else if (t.tipe === "ADJUSTMENT" && t.account_id === acc.id) bal += nom;
    else if (t.tipe === "TRANSFER") {
      if (t.account_id === acc.id) bal -= nom;
      if (t.to_account_id === acc.id) bal += nom;
    }
    // Goal deposits are recorded as EXPENSE (so they show in expense reports) but can
    // also carry a to_account_id — the goal's own destination account — which receives the money.
    if (t.tipe === "EXPENSE" && t.to_account_id === acc.id) bal += nom;
  }
  for (const g of d.goalDeposits) if (g.account_id === acc.id) bal -= Number(g.nominal) || 0;
  // Only legacy bill payments (created before payments became real transactions) are
  // subtracted here — new ones already reduce the balance via their linked transaction.
  for (const b of d.billPayments) if (!b.linked_tx_id && b.account_id === acc.id) bal -= Number(b.nominal) || 0;
  return bal;
}

function totalBalance(d) {
  return d.accounts.filter((a) => a.is_active).reduce((s, a) => s + accountBalance(a, d), 0);
}

// Only Kas, Tunai, and E-Wallet accounts count toward the "Saldo kamu" figure on the home dashboard.
function liquidBalance(d) {
  return d.accounts
    .filter((a) => a.is_active && LIQUID_ACCOUNT_TYPES.includes(a.tipe))
    .reduce((s, a) => s + accountBalance(a, d), 0);
}

// Income: every INCOME transaction from every account (transfers never count as income).
// Expense: every EXPENSE transaction — which now includes bill payments and goal deposits,
// since those are created as real categorized EXPENSE transactions — plus, for backward
// compatibility, any pre-existing bill payment / goal deposit that predates that change and
// therefore only lives in the old billPayments/goalDeposits ledgers. This is the one shared
// source of truth used by the dashboard, charts, category summaries, insights, and reports.
function monthTotals(d, ym) {
  let income = 0, expense = 0;
  d.transactions.forEach((t) => {
    if (monthKey(t.tanggal) !== ym) return;
    const nom = Number(t.nominal) || 0;
    if (t.tipe === "INCOME") income += nom;
    if (t.tipe === "EXPENSE") expense += nom;
  });
  (d.billPayments || []).forEach((p) => {
    if (!p.linked_tx_id && monthKey(p.tanggal) === ym) expense += Number(p.nominal) || 0;
  });
  (d.goalDeposits || []).forEach((g) => {
    if (monthKey(g.tanggal) === ym) expense += Number(g.nominal) || 0;
  });
  return { income, expense };
}

function ymNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function categorySpent(d, categoryId, ym) {
  return d.transactions
    .filter((t) => t.tipe === "EXPENSE" && t.category_id === categoryId && monthKey(t.tanggal) === ym)
    .reduce((s, t) => s + (Number(t.nominal) || 0), 0);
}

function catById(d, id) {
  return d.categories.find((c) => c.id === id);
}
function accById(d, id) {
  return d.accounts.find((a) => a.id === id);
}
function memberById(d, id) {
  return d.members.find((m) => m.id === id);
}

// Finds (or lazily creates) the default "Tabungan & Investasi" expense category used
// to classify goal deposits, so goal savings show up in expense reports/budgets.
function ensureSavingCategoryId(data, mutate) {
  const existing = data.categories.find((c) => c.tipe === "EXPENSE" && c.nama === GOAL_SAVING_CATEGORY_NAME);
  if (existing) return existing.id;
  const id = uid("cat");
  mutate.addItem("categories", { id, tipe: "EXPENSE", nama: GOAL_SAVING_CATEGORY_NAME, icon: "\u{1F3E6}", warna: C.mint, parent_id: null, is_default: true, is_active: true });
  return id;
}

// Builds the actual EXPENSE transaction for a goal deposit: reduces the source account,
// credits the goal's destination account (if any), and tags it to the goal + savings category.
// Centralized here (instead of duplicated per call site) so every deposit path is guaranteed
// to include every required field (this exact bug — a missing `nominal` — happened before).
function buildGoalDepositTx(goal, payload, data, mutate, catatanFallback) {
  const catId = ensureSavingCategoryId(data, mutate);
  const nominal = Number(payload.nominal) || 0;
  return {
    id: uid("tx"),
    tipe: "EXPENSE",
    nominal,
    account_id: payload.account_id,
    to_account_id: goal.account_id || null,
    category_id: catId,
    member_id: null,
    tanggal: payload.tanggal,
    catatan: payload.catatan || catatanFallback || null,
    merchant: null,
    goal_id: goal.id,
  };
}

// Finds a real category to attach to a bill's payments: prefers the bill's own category_id,
// falls back to matching its legacy free-text `kategori` name, else a generic "Lainnya".
// This is what makes bill payments show up correctly in category-based charts/reports.
function resolveBillCategoryId(bill, data, mutate) {
  if (bill.category_id) {
    const exists = data.categories.find((c) => c.id === bill.category_id && c.tipe === "EXPENSE");
    if (exists) return exists.id;
  }
  if (bill.kategori) {
    const match = data.categories.find((c) => c.tipe === "EXPENSE" && c.nama.toLowerCase() === String(bill.kategori).toLowerCase());
    if (match) return match.id;
  }
  const lainnya = data.categories.find((c) => c.tipe === "EXPENSE" && c.nama === "Lainnya");
  if (lainnya) return lainnya.id;
  const id = uid("cat");
  mutate.addItem("categories", { id, tipe: "EXPENSE", nama: "Lainnya", icon: "\u{1F516}", warna: C.muted, parent_id: null, is_default: true, is_active: true });
  return id;
}

// Builds the actual EXPENSE transaction for a bill payment, so it shows up everywhere a
// normal expense would: transactions list, category summaries, charts, insights, reports.
function buildBillPaymentTx(bill, payload, data, mutate) {
  const catId = resolveBillCategoryId(bill, data, mutate);
  const nominal = Number(payload.nominal) || 0;
  return {
    id: uid("tx"),
    tipe: "EXPENSE",
    nominal,
    account_id: payload.account_id,
    to_account_id: null,
    category_id: catId,
    member_id: null,
    tanggal: payload.tanggal,
    catatan: payload.catatan || bill.nama,
    merchant: null,
    bill_id: bill.id,
  };
}

function billNextDue(bill, ref) {
  const day = Math.min(31, Math.max(1, Number(bill.jatuh_tempo) || 1));
  const y = ref.getFullYear(), m = ref.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last));
}

function billStatus(bill, d, ref = new Date()) {
  const ym = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  const paidThisPeriod = d.billPayments.some((p) => p.bill_id === bill.id && monthKey(p.tanggal) === ym);
  if (paidThisPeriod) return { status: "PAID", label: "Sudah dibayar", due: billNextDue(bill, ref) };
  const due = billNextDue(bill, ref);
  const todayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (due.getTime() === todayStart.getTime()) return { status: "TODAY", label: "Hari ini", due };
  if (due.getTime() < todayStart.getTime()) return { status: "LATE", label: "Terlambat", due };
  return { status: "UPCOMING", label: "Akan datang", due };
}

function goalCollected(goal, d) {
  const base = Number(goal.current_nominal) || 0;
  const oldDep = (d.goalDeposits || []).filter((g) => g.goal_id === goal.id).reduce((s, g) => s + (Number(g.nominal) || 0), 0);
  const newDep = (d.transactions || []).filter((t) => t.goal_id === goal.id && t.tipe === "EXPENSE").reduce((s, t) => s + (Number(t.nominal) || 0), 0);
  return base + oldDep + newDep;
}

// Goal savings reminder — mirrors billStatus(), but for "time to deposit into this goal" nudges.
function goalReminderInfo(goal, d, ref = new Date()) {
  if (!goal.reminder_day || goal.status !== "ACTIVE") return null;
  const ym = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  const depositedThisMonth =
    (d.goalDeposits || []).some((g) => g.goal_id === goal.id && monthKey(g.tanggal) === ym) ||
    (d.transactions || []).some((t) => t.goal_id === goal.id && t.tipe === "EXPENSE" && monthKey(t.tanggal) === ym);
  const day = Math.min(31, Math.max(1, Number(goal.reminder_day) || 1));
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const due = new Date(ref.getFullYear(), ref.getMonth(), Math.min(day, lastDay));
  if (depositedThisMonth) return { status: "DONE", label: "Sudah setor bulan ini", due };
  const todayStart = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (due.getTime() === todayStart.getTime()) return { status: "TODAY", label: "Hari ini", due };
  if (due.getTime() < todayStart.getTime()) return { status: "LATE", label: "Terlambat", due };
  return { status: "UPCOMING", label: "Akan datang", due };
}

function budgetInfo(b, d) {
  const spent = categorySpent(d, b.category_id, `${b.tahun}-${String(b.bulan).padStart(2, "0")}`);
  const limit = Number(b.nominal_limit) || 0;
  const percent = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;
  let status = "AMAN";
  if (percent >= 100) status = "LEWAT";
  else if (percent >= (b.alert_percentage || 80)) status = "HAMPIR";
  return { spent, limit, percent, status };
}

/* ---------- Insight engine ---------- */
function buildInsights(d) {
  const insights = [];
  const now = new Date();
  const ymThis = ymNow();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const ymPrev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const { income: incThis, expense: expThis } = monthTotals(d, ymThis);
  const { expense: expPrev } = monthTotals(d, ymPrev);

  const hasDataThisMonth = d.transactions.some((t) => monthKey(t.tanggal) === ymThis);
  if (!hasDataThisMonth) return insights;

  // Rule: category spend increase vs last month
  const expenseCats = d.categories.filter((c) => c.tipe === "EXPENSE");
  let biggestJump = null;
  expenseCats.forEach((c) => {
    const spentThis = categorySpent(d, c.id, ymThis);
    const spentPrev = categorySpent(d, c.id, ymPrev);
    if (spentPrev > 0 && spentThis > 0) {
      const pct = Math.round(((spentThis - spentPrev) / spentPrev) * 100);
      if (pct >= 15 && (!biggestJump || pct > biggestJump.pct)) biggestJump = { nama: c.nama, pct };
    }
  });
  if (biggestJump) {
    insights.push({ tone: "warning", icon: "up", text: `Pengeluaran ${biggestJump.nama} naik ${biggestJump.pct}% dibanding bulan lalu.` });
  }

  // Rule: budgets over threshold
  const thisBudgets = d.budgets.filter((b) => b.bulan === now.getMonth() + 1 && b.tahun === now.getFullYear());
  thisBudgets.forEach((b) => {
    const info = budgetInfo(b, d);
    const cat = catById(d, b.category_id);
    if (info.status === "LEWAT" && cat) {
      insights.push({ tone: "danger", icon: "alert", text: `Budget ${cat.nama} sudah melebihi limit (${info.percent}%).` });
    } else if (info.status === "HAMPIR" && cat) {
      insights.push({ tone: "warning", icon: "alert", text: `Budget ${cat.nama} sudah terpakai ${info.percent}%.` });
    }
  });

  // Rule: expense > income
  if (incThis > 0 && expThis > incThis) {
    insights.push({ tone: "danger", icon: "down", text: "Bulan ini pengeluaranmu lebih besar daripada pemasukan." });
  }

  // Rule: goal near target
  d.goals.filter((g) => g.status === "ACTIVE").forEach((g) => {
    const collected = goalCollected(g, d);
    const target = Number(g.target_nominal) || 0;
    if (target > 0) {
      const pct = Math.round((collected / target) * 100);
      if (pct >= 80 && pct < 100) insights.push({ tone: "success", icon: "target", text: `Goal ${g.nama} sudah mencapai ${pct}%.` });
    }
  });

  // Rule: projection for remaining month
  const dayNow = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (dayNow >= 5 && incThis > 0 && expThis > 0) {
    const avgDaily = expThis / dayNow;
    const projectedExpense = avgDaily * daysInMonth;
    const estimasiSisa = incThis - projectedExpense;
    insights.push({
      tone: estimasiSisa >= 0 ? "info" : "danger",
      icon: "sparkle",
      text: `Jika pola pengeluaran tetap seperti sekarang, estimasi sisa uang akhir bulan sekitar ${formatMoney(estimasiSisa)}.`,
    });
  }

  return insights.slice(0, 5);
}

/* ============================================================
   PERSISTENT STORAGE HOOK
   ============================================================ */
function usePersistentData(userId) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);
  const storageKey = userId ? `${STORAGE_KEY}-${userId}` : null;

  useEffect(() => {
    if (!storageKey) {
      setData(null);
      setReady(false);
      return;
    }
    let mounted = true;
    setReady(false);
    setData(null);
    (async () => {
      let loaded = null;
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) loaded = JSON.parse(raw);
      } catch (e) {
        loaded = null;
      }
      if (!mounted) return;
      setData(loaded ? { ...createDefaultData(), ...loaded } : createDefaultData());
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !data || !storageKey) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        /* storage full or blocked - ignore, data still safe in memory this session */
      }
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [data, ready, storageKey]);

  return [data, setData, ready];
}

/* ============================================================
   AUTH — local accounts (register/login/logout), stored on-device.
   No server: each browser/device keeps its own list of household
   accounts, each with its own isolated data namespace. Passwords are
   hashed (SHA-256 via the browser's own crypto) before being stored —
   reasonable for casual protection, but this is not a substitute for
   real server-side authentication.
   ============================================================ */
const USERS_KEY = "kk-users-v1";
const SESSION_KEY = "kk-session-v1";
const LEGACY_DATA_KEY = "kk-data-v1"; // fixed single-household key used before multi-account support

async function hashPassword(password) {
  try {
    const enc = new TextEncoder().encode(password);
    const buf = await window.crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return null;
  }
}

function useAuth() {
  const [users, setUsers] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let loadedUsers = [];
    try {
      const raw = window.localStorage.getItem(USERS_KEY);
      if (raw) loadedUsers = JSON.parse(raw);
    } catch (e) {
      loadedUsers = [];
    }

    let loadedSession = null;
    try {
      const raw2 = window.localStorage.getItem(SESSION_KEY);
      if (raw2) loadedSession = JSON.parse(raw2);
    } catch (e) {
      loadedSession = null;
    }

    if (loadedUsers.length === 0) {
      try {
        const legacyRaw = window.localStorage.getItem(LEGACY_DATA_KEY);
        if (legacyRaw) {
          const legacyData = JSON.parse(legacyRaw);
          if (legacyData && legacyData.settings && legacyData.settings.onboarded) {
            const userId = uid("user");
            const user = {
              id: userId,
              nama: legacyData.settings.familyName || "Keluarga",
              email: legacyData.settings.email || null,
              password_hash: null,
              avatar: legacyData.settings.avatar || null,
              authProvider: legacyData.settings.authProvider || "manual",
              created_at: Date.now(),
            };
            loadedUsers = [user];
            loadedSession = { userId };
            window.localStorage.setItem(USERS_KEY, JSON.stringify(loadedUsers));
            window.localStorage.setItem(SESSION_KEY, JSON.stringify(loadedSession));
            window.localStorage.setItem(`${STORAGE_KEY}-${userId}`, JSON.stringify(legacyData));
          }
        }
      } catch (e) {
        /* no legacy data */
      }
    }

    setUsers(loadedUsers);
    setSessionUserId((loadedSession && loadedSession.userId) || null);
    setReady(true);
  }, []);

  function persistUsers(next) {
    setUsers(next);
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(next));
    } catch (e) {
      /* ignore */
    }
  }
  function persistSession(userId) {
    setSessionUserId(userId);
    try {
      if (userId) window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
      else window.localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  async function register(nama, email, password) {
    setAuthError("");
    const emailNorm = (email || "").trim().toLowerCase();
    if (!nama.trim()) return setAuthError("Nama keluarga wajib diisi."), false;
    if (!emailNorm || !emailNorm.includes("@")) return setAuthError("Email tidak valid."), false;
    if (!password || password.length < 6) return setAuthError("Password minimal 6 karakter."), false;
    if ((users || []).some((u) => u.email && u.email.toLowerCase() === emailNorm)) return setAuthError("Email sudah terdaftar. Coba masuk."), false;
    const hash = await hashPassword(password);
    const userId = uid("user");
    const user = { id: userId, nama: nama.trim(), email: emailNorm, password_hash: hash, avatar: null, authProvider: "manual", created_at: Date.now() };
    persistUsers([...(users || []), user]);
    persistSession(userId);
    return true;
  }

  async function login(email, password) {
    setAuthError("");
    const emailNorm = (email || "").trim().toLowerCase();
    const user = (users || []).find((u) => u.email && u.email.toLowerCase() === emailNorm);
    if (!user) return setAuthError("Email belum terdaftar."), false;
    if (!user.password_hash) return setAuthError("Akun ini belum punya password (dibuat lewat Google). Masuk dengan Google, atau atur password lewat Pengaturan setelah masuk."), false;
    const hash = await hashPassword(password);
    if (!hash || hash !== user.password_hash) return setAuthError("Password salah."), false;
    persistSession(user.id);
    return true;
  }

  async function loginWithGoogle(profile) {
    setAuthError("");
    const emailNorm = (profile.email || "").trim().toLowerCase();
    let user = emailNorm ? (users || []).find((u) => u.email && u.email.toLowerCase() === emailNorm) : null;
    if (!user) {
      const userId = uid("user");
      user = { id: userId, nama: profile.name || "Keluarga", email: emailNorm || null, password_hash: null, avatar: profile.avatar || null, authProvider: "google", created_at: Date.now() };
      persistUsers([...(users || []), user]);
    }
    persistSession(user.id);
    return true;
  }

  async function logout() {
    persistSession(null);
  }

  async function setPasswordForCurrentUser(userId, password) {
    setAuthError("");
    if (!password || password.length < 6) return setAuthError("Password minimal 6 karakter."), false;
    const hash = await hashPassword(password);
    persistUsers((users || []).map((u) => (u.id === userId ? { ...u, password_hash: hash } : u)));
    return true;
  }

  const currentUser = (users || []).find((u) => u.id === sessionUserId) || null;

  return { ready, users: users || [], currentUser, register, login, loginWithGoogle, logout, setPasswordForCurrentUser, authError, setAuthError };
}

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */

function IconChip({ emoji, color, size = 44 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: (color || C.blue) + "22", fontSize: size * 0.46 }}
    >
      {emoji}
    </div>
  );
}

const ACCOUNT_ICONS = {
  KAS: Coins,
  CASH: Banknote,
  BANK: Landmark,
  E_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
  SAVING: PiggyBank,
  PENAMPUNG: Inbox,
  OTHER: Wallet,
};
const ACCOUNT_LABELS = {
  KAS: "Kas",
  CASH: "Tunai",
  BANK: "Bank",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  SAVING: "Tabungan",
  PENAMPUNG: "Penampung",
  OTHER: "Lainnya",
};
// Account types counted in the "Saldo kamu" (liquid balance) figure on the home dashboard.
const LIQUID_ACCOUNT_TYPES = ["KAS", "CASH", "E_WALLET", "BANK"];

function AccountIconChip({ tipe, color, size = 44 }) {
  const Ico = ACCOUNT_ICONS[tipe] || Wallet;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: (color || C.blue) + "22" }}
    >
      <Ico size={size * 0.46} color={color || C.blue} strokeWidth={2.2} />
    </div>
  );
}

function ProgressBar({ percent, status }) {
  const color = status === "LEWAT" ? C.red : status === "HAMPIR" ? C.yellowDark : C.green;
  const w = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#EEF0F5" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function EmptyState({ title, subtitle, icon: Ico = Info }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl px-6 py-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: C.blueLight }}>
        <Ico size={26} color={C.blue} />
      </div>
      <div className="font-bold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{title}</div>
      {subtitle && <div className="mt-1 text-sm" style={{ color: C.muted }}>{subtitle}</div>}
    </div>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{children}</h2>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold" style={{ color: C.blueDark }}>
          {action}
        </button>
      )}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border-2 px-4 py-3 text-[15px] font-medium outline-none transition-colors"
      style={{ borderColor: C.border, background: "#FAFBFD", color: C.ink }}
      onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.background = "#fff"; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.background = "#FAFBFD"; }}
    />
  );
}

function SelectInput({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none rounded-2xl border-2 px-4 py-3 pr-10 text-[15px] font-medium outline-none"
        style={{ borderColor: C.border, background: "#FAFBFD", color: C.ink }}
      >
        {children}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" color={C.muted} />
    </div>
  );
}

function MoneyInput({ value, onChange, autoFocus }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border-2 px-4 py-3" style={{ borderColor: C.border, background: "#FAFBFD" }}>
      <span className="text-lg font-extrabold" style={{ color: C.muted, fontFamily: "'Baloo 2', sans-serif" }}>Rp</span>
      <input
        autoFocus={autoFocus}
        type="text"
        inputMode="numeric"
        placeholder="0"
        className="w-full flex-1 bg-transparent text-xl font-extrabold outline-none"
        style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}
        value={value ? Number(value).toLocaleString("id-ID") : ""}
        onChange={(e) => onChange(parseDigits(e.target.value))}
      />
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-bold" style={{ color: C.ink }}>
        {label} {required && <span style={{ color: C.red }}>*</span>}
      </span>
      {children}
    </label>
  );
}

function PrimaryButton({ children, onClick, color = C.blue, type = "button", disabled, full = true }) {
  const bg = disabled ? C.muted : color;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl py-3.5 text-[15px] font-bold shadow-sm transition active:scale-[0.98] ${full ? "w-full" : "px-6"}`}
      style={{ background: bg, color: disabled ? "#FFFFFF" : contrastText(bg), fontFamily: "'Baloo 2', sans-serif" }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, color = C.ink }) {
  return (
    <button onClick={onClick} className="w-full rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.98]" style={{ color, background: "#F1F2F8", fontFamily: "'Baloo 2', sans-serif" }}>
      {children}
    </button>
  );
}

function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(20,22,40,0.45)" }} onClick={onClose}>
      <div
        className="kk-sheet kk-hide-scroll relative flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-[28px] bg-white pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[28px] bg-white px-5 pb-3 pt-4">
          <h3 className="text-[17px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "#F1F2F8" }}>
            <X size={18} color={C.ink} />
          </button>
        </div>
        <div className="px-5">{children}</div>
        {footer && <div className="mt-2 px-5">{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" style={{ background: "rgba(20,22,40,0.5)" }} onClick={onCancel}>
      <div className="kk-sheet w-full max-w-[340px] rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: danger ? C.redLight : C.blueLight }}>
          <AlertTriangle size={22} color={danger ? C.red : C.blue} />
        </div>
        <div className="mb-1 text-[16px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{title}</div>
        <div className="mb-5 text-[14px]" style={{ color: C.muted }}>{message}</div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-2xl py-3 text-[14px] font-bold" style={{ background: "#F1F2F8", color: C.ink }}>Batal</button>
          <button onClick={onConfirm} className="flex-1 rounded-2xl py-3 text-[14px] font-bold" style={{ background: danger ? C.red : C.blue, color: contrastText(danger ? C.red : C.blue) }}>Ya, lanjutkan</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-6">
      <div className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg" style={{ background: C.ink }}>
        <CheckCircle2 size={16} color={C.green} />
        {message}
      </div>
    </div>
  );
}

const EMOJI_CHOICES = ["\u{1F600}", "\u{1F3E0}", "\u{1F697}", "\u{1F354}", "\u{1F6D2}", "\u{1F3E5}", "\u{1F393}", "\u{1F3AC}", "\u{1F4F1}", "\u{1F4A1}", "\u{1F6B0}", "\u{1F310}", "\u{1F4B3}", "\u{1F381}", "\u{1F4B0}", "\u{2708}\uFE0F", "\u{1F455}", "\u{1F436}", "\u{26BD}", "\u{1F3E6}", "\u{1F4E6}", "\u2615"];
const COLOR_CHOICES = ["#F7C948", "#8AC6B8", "#F2924A", "#22C55E", "#EC4899", "#8B5CF6", "#0EA5E9", "#EF4444", "#4F5FF6", "#64748B"];

function EmojiPicker({ value, onChange }) {
  const isCustom = value && !EMOJI_CHOICES.includes(value);
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-2">
        {EMOJI_CHOICES.map((e) => (
          <button key={e} type="button" onClick={() => onChange(e)} className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: value === e ? C.blueLight : "#F6F7FB", border: value === e ? `2px solid ${C.blue}` : "2px solid transparent" }}>
            {e}
          </button>
        ))}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl" style={{ background: isCustom ? C.blueLight : "#F6F7FB", border: isCustom ? `2px solid ${C.blue}` : `2px dashed ${C.border}` }}>
          <input
            type="text"
            value={isCustom ? value : ""}
            onChange={(e) => {
              const v = Array.from(e.target.value).slice(-1).join("");
              onChange(v || EMOJI_CHOICES[0]);
            }}
            placeholder="+"
            className="h-full w-full bg-transparent text-center text-xl outline-none"
            style={{ color: C.ink }}
          />
        </div>
      </div>
      <p className="text-[11.5px]" style={{ color: C.muted }}>Pilih salah satu, atau ketik/tempel emoji sendiri di kotak terakhir.</p>
    </div>
  );
}
function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_CHOICES.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} className="h-9 w-9 rounded-full" style={{ background: c, outline: value === c ? `3px solid ${c}55` : "none", outlineOffset: 2, border: value === c ? "2px solid white" : "2px solid transparent", boxShadow: value === c ? "0 0 0 2px " + c : "none" }} />
      ))}
    </div>
  );
}

/* ============================================================
   GOOGLE SIGN-IN (opsional)
   ============================================================
   Untuk mengaktifkan tombol "Masuk dengan Google" di halaman awal:
   1. Buka https://console.cloud.google.com/apis/credentials
   2. Buat project baru (gratis) -> "Create Credentials" -> "OAuth client ID"
   3. Application type: "Web application"
   4. Di "Authorized JavaScript origins", isi alamat hosting kamu,
      contoh: https://nama-app-kamu.netlify.app
   5. Salin "Client ID" yang dihasilkan, tempel di bawah ini.
   Catatan: hanya berfungsi di alamat https:// yang benar-benar kamu daftarkan di
   langkah 4 — tidak berfungsi saat pratinjau di dalam chat Claude, hanya setelah
   di-hosting sendiri. Kalau dikosongkan, aplikasi tetap jalan normal dengan
   isi nama manual seperti biasa. */
const GOOGLE_CLIENT_ID = "";

function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function GoogleAuthButton({ onCredential }) {
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    function init() {
      if (cancelled || !window.google || !window.google.accounts || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => {
          const payload = decodeJwt(resp.credential);
          if (payload) {
            onCredential({ name: payload.name || payload.email || "Keluarga", email: payload.email || null, avatar: payload.picture || null });
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: "outline", size: "large", width: 260, shape: "pill" });
    }
    if (document.getElementById("google-identity-script")) {
      init();
    } else {
      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="mb-4">
      <div ref={googleBtnRef} className="flex justify-center" />
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: C.border }} />
        <span className="text-[11px] font-semibold" style={{ color: C.muted }}>atau</span>
        <div className="h-px flex-1" style={{ background: C.border }} />
      </div>
    </div>
  );
}

function AuthHero({ title, subtitle }) {
  return (
    <div>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(34,48,58,0.10)" }}>
        <Sparkles size={14} color={C.mintDark} />
        <span className="text-[12px] font-bold" style={{ color: C.ink }}>{title}</span>
      </div>
      <h1 className="text-[34px] font-extrabold leading-tight" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>
        Keuangan{"\n"}Keluarga
      </h1>
      <p className="mt-3 max-w-[280px] text-[15px]" style={{ color: "rgba(34,48,58,0.72)" }}>{subtitle}</p>
      <div className="mt-8 flex gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-2xl" style={{ background: C.mint }}>{"\u{1F4B0}"}</div>
        <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-3xl text-2xl" style={{ background: C.orange }}>{"\u{1F3E0}"}</div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl text-2xl" style={{ background: "white" }}>{"\u{1F3AF}"}</div>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN
   ============================================================ */
function LoginPage({ auth, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) return;
    setBusy(true);
    await auth.login(email, password);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pb-8 pt-16" style={{ background: `linear-gradient(160deg, ${C.blue}, ${C.blueDark})` }}>
      <AuthHero title="Selamat datang kembali" subtitle="Masuk untuk melanjutkan catatan keuangan keluargamu." />
      <div className="rounded-[28px] bg-white p-5">
        <GoogleAuthButton onCredential={(profile) => auth.loginWithGoogle(profile)} />
        <Field label="Email"><TextInput type="email" autoCapitalize="none" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><TextInput type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {auth.authError && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{auth.authError}</div>}
        <PrimaryButton disabled={busy || !email.trim() || !password} onClick={submit}>{busy ? "Memeriksa..." : "Masuk"}</PrimaryButton>
        <button onClick={() => { auth.setAuthError(""); onSwitch(); }} className="mt-4 w-full text-center text-[13px] font-semibold" style={{ color: C.blueDark }}>
          Belum punya akun? <span style={{ textDecoration: "underline" }}>Daftar</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   REGISTER
   ============================================================ */
function RegisterPage({ auth, onSwitch }) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState("");

  async function submit() {
    setLocalErr("");
    if (password !== confirm) return setLocalErr("Konfirmasi password tidak cocok.");
    setBusy(true);
    await auth.register(nama, email, password);
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pb-8 pt-16" style={{ background: `linear-gradient(160deg, ${C.blue}, ${C.blueDark})` }}>
      <AuthHero title="Selamat datang" subtitle="Buat akun keluarga untuk mulai mencatat uang masuk, uang keluar, tagihan, dan tabungan." />
      <div className="rounded-[28px] bg-white p-5">
        <GoogleAuthButton onCredential={(profile) => auth.loginWithGoogle(profile)} />
        <Field label="Nama keluarga"><TextInput placeholder="Contoh: Keluarga Santoso" value={nama} onChange={(e) => setNama(e.target.value)} /></Field>
        <Field label="Email"><TextInput type="email" autoCapitalize="none" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><TextInput type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="Ulangi password"><TextInput type="password" placeholder="Ketik ulang password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {(localErr || auth.authError) && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{localErr || auth.authError}</div>}
        <PrimaryButton disabled={busy || !nama.trim() || !email.trim() || !password} onClick={submit}>{busy ? "Memproses..." : "Daftar"}</PrimaryButton>
        <button onClick={() => { auth.setAuthError(""); onSwitch(); }} className="mt-4 w-full text-center text-[13px] font-semibold" style={{ color: C.blueDark }}>
          Sudah punya akun? <span style={{ textDecoration: "underline" }}>Masuk</span>
        </button>
        <p className="mt-3 text-center text-[11.5px] leading-relaxed" style={{ color: C.muted }}>Akun & data tersimpan di perangkat ini saja (belum sinkron ke perangkat lain).</p>
      </div>
    </div>
  );
}

/* ============================================================
   BOTTOM NAV + FAB
   ============================================================ */
const TABS = [
  { key: "dashboard", label: "Beranda", icon: Home },
  { key: "transactions", label: "Transaksi", icon: Receipt },
  { key: "budgets", label: "Budget", icon: PiggyBank },
  { key: "goals", label: "Goals", icon: Target },
  { key: "more", label: "Lainnya", icon: LayoutGrid },
];

function BottomNav({ active, onChange, onFabClick }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="flex w-full max-w-[480px] items-stretch justify-between rounded-t-[26px] bg-white px-2 pb-2 pt-2" style={{ boxShadow: "0 -6px 24px rgba(20,24,60,0.08)" }}>
        {TABS.map((t) => {
          const Ico = t.icon;
          const isActive = active === t.key;
          const isLast = t.key === "more";
          return (
            <div key={t.key} className="relative flex flex-1 flex-col items-center">
              {isLast && (
                <button
                  onClick={onFabClick}
                  className="absolute flex items-center justify-center rounded-full shadow-lg active:scale-95"
                  style={{ top: -50, left: "50%", transform: "translateX(-50%)", width: 50, height: 50, background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`, color: C.ink, boxShadow: "0 8px 20px rgba(223,162,42,0.45)" }}
                >
                  <Plus size={24} strokeWidth={2.6} />
                </button>
              )}
              <button onClick={() => onChange(t.key)} className="flex w-full flex-col items-center gap-1 rounded-2xl py-1.5">
                <Ico size={22} color={isActive ? C.blueDark : C.muted} strokeWidth={isActive ? 2.6 : 2} />
                <span className="text-[10.5px] font-bold" style={{ color: isActive ? C.blueDark : C.muted }}>{t.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FabSheet({ open, onClose, onPick }) {
  if (!open) return null;
  return (
    <Sheet title="Catat transaksi" onClose={onClose}>
      <div className="flex flex-col gap-3 pb-2">
        <QuickActionRow icon={ArrowDownLeft} color={C.orange} label="Pengeluaran" desc="Uang keluar dari rekening" onClick={() => { onClose(); onPick("EXPENSE"); }} />
        <QuickActionRow icon={ArrowUpRight} color={C.green} label="Pemasukan" desc="Uang masuk ke rekening" onClick={() => { onClose(); onPick("INCOME"); }} />
        <QuickActionRow icon={ArrowLeftRight} color={C.mint} label="Transfer" desc="Pindah saldo antar rekening" onClick={() => { onClose(); onPick("TRANSFER"); }} />
      </div>
    </Sheet>
  );
}

function QuickActionRow({ icon: Ico, color, label, desc, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-3xl p-3.5 text-left active:scale-[0.98]" style={{ background: color + "14" }}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: color }}>
        <Ico size={22} color={contrastText(color)} />
      </div>
      <div className="flex-1">
        <div className="text-[15px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{label}</div>
        <div className="text-[12.5px]" style={{ color: C.muted }}>{desc}</div>
      </div>
      <ChevronRight size={18} color={C.muted} />
    </button>
  );
}

/* ============================================================
   PAGE HEADER (generic)
   ============================================================ */
function PageHeader({ title, onBack, right }) {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-5 pb-3 pt-5" style={{ background: C.bg }}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <ArrowLeft size={18} color={C.ink} />
          </button>
        )}
        <h1 className="text-[19px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ data, go, openTx }) {
  const ym = ymNow();
  const now = new Date();
  const { income, expense } = monthTotals(data, ym);
  const balance = liquidBalance(data);
  const insights = useMemo(() => buildInsights(data), [data]);

  const upcomingBills = useMemo(() => {
    return data.bills
      .filter((b) => b.is_active !== false)
      .map((b) => ({ b, st: billStatus(b, data, now) }))
      .filter((x) => x.st.status !== "PAID")
      .sort((a, c) => a.st.due - c.st.due)
      .slice(0, 3);
  }, [data]);

  const nearBudgets = useMemo(() => {
    return data.budgets
      .filter((b) => b.bulan === now.getMonth() + 1 && b.tahun === now.getFullYear())
      .map((b) => ({ b, info: budgetInfo(b, data) }))
      .filter((x) => x.info.percent >= (x.b.alert_percentage || 80))
      .sort((a, c) => c.info.percent - a.info.percent)
      .slice(0, 3);
  }, [data]);

  const activeGoals = data.goals.filter((g) => g.status === "ACTIVE").slice(0, 4);

  const goalReminders = useMemo(() => {
    return data.goals
      .filter((g) => g.status === "ACTIVE" && g.reminder_day)
      .map((g) => ({ g, r: goalReminderInfo(g, data, now) }))
      .filter((x) => x.r && x.r.status !== "DONE")
      .sort((a, c) => a.r.due - c.r.due);
  }, [data]);

  const topCats = useMemo(() => {
    const map = {};
    data.transactions.forEach((t) => {
      if (t.tipe !== "EXPENSE" || monthKey(t.tanggal) !== ym) return;
      map[t.category_id] = (map[t.category_id] || 0) + (Number(t.nominal) || 0);
    });
    return Object.entries(map)
      .map(([id, val]) => ({ cat: catById(data, id), val }))
      .filter((x) => x.cat)
      .sort((a, b) => b.val - a.val)
      .slice(0, 4);
  }, [data]);

  const chartData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const t = monthTotals(data, key);
      arr.push({ label: BULAN_PENDEK[dt.getMonth()], Pemasukan: t.income, Pengeluaran: t.expense });
    }
    return arr;
  }, [data]);

  return (
    <div className="pb-6">
      <div className="px-5 pb-16 pt-6" style={{ background: `linear-gradient(160deg, ${C.blue}, ${C.blueDark})`, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px]" style={{ color: "rgba(34,48,58,0.68)" }}>Halo, {data.settings.familyName || "Keluarga"} {"\u{1F44B}"}</div>
            <div className="text-[12px]" style={{ color: "rgba(34,48,58,0.52)" }}>{formatDateLong(todayISO())}</div>
          </div>
          <button onClick={() => go({ page: "settings" })} className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(34,48,58,0.10)" }}>
            <Bell size={18} color={C.ink} />
          </button>
        </div>
        <div className="mt-6">
          <div className="text-[13px]" style={{ color: "rgba(34,48,58,0.68)" }}>Saldo kamu <span style={{ opacity: 0.75 }}>(Kas, Tunai, E-Wallet, Bank)</span></div>
          <div className="text-[32px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(balance)}</div>
        </div>
      </div>

      <div className="-mt-10 grid grid-cols-2 gap-3 px-5">
        <div className="rounded-3xl p-4" style={{ background: C.card, boxShadow: "0 8px 24px rgba(20,24,60,0.08)" }}>
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: C.greenLight }}>
            <TrendingUp size={16} color={C.green} />
          </div>
          <div className="text-[11.5px] font-semibold" style={{ color: C.muted }}>Pemasukan bulan ini</div>
          <div className="text-[16px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(income)}</div>
        </div>
        <div className="rounded-3xl p-4" style={{ background: C.card, boxShadow: "0 8px 24px rgba(20,24,60,0.08)" }}>
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: C.redLight }}>
            <TrendingDown size={16} color={C.red} />
          </div>
          <div className="text-[11.5px] font-semibold" style={{ color: C.muted }}>Pengeluaran bulan ini</div>
          <div className="text-[16px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(expense)}</div>
        </div>
      </div>

      <div className="mt-6 px-5">
        <SectionTitle action="Lihat semua" onAction={() => go({ page: "bills" })}>Tagihan terdekat</SectionTitle>
        {upcomingBills.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Belum ada tagihan" subtitle="Tambahkan tagihan supaya tidak lupa bayar." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {upcomingBills.map(({ b, st }) => (
              <BillRow key={b.id} bill={b} st={st} onClick={() => go({ page: "billDetail", params: { id: b.id } })} />
            ))}
          </div>
        )}
      </div>

      {goalReminders.length > 0 && (
        <div className="mt-6 px-5">
          <SectionTitle action="Lihat semua" onAction={() => go({ page: "goals" })}>Pengingat setoran</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {goalReminders.map(({ g, r }) => {
              const color = { LATE: C.red, TODAY: C.yellowDark, UPCOMING: C.blueDark }[r.status];
              const bg = { LATE: C.redLight, TODAY: "#FFF7E0", UPCOMING: C.blueLight }[r.status];
              return (
                <button key={g.id} onClick={() => go({ page: "goalDetail", params: { id: g.id } })} className="flex w-full items-center gap-3 rounded-3xl p-4 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <IconChip emoji={g.icon || "\u{1F3AF}"} color={g.warna} size={40} />
                  <div className="flex-1">
                    <div className="text-[14px] font-bold" style={{ color: C.ink }}>{g.nama}</div>
                    <div className="text-[12px]" style={{ color: C.muted }}>Tanggal {g.reminder_day} tiap bulan</div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: bg, color }}>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {nearBudgets.length > 0 && (
        <div className="mt-6 px-5">
          <SectionTitle action="Lihat semua" onAction={() => go({ page: "budgets" })}>Budget hampir habis</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {nearBudgets.map(({ b, info }) => {
              const cat = catById(data, b.category_id);
              return (
                <div key={b.id} className="rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconChip emoji={cat?.icon} color={cat?.warna} size={32} />
                      <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>{cat?.nama}</span>
                    </div>
                    <span className="text-[13px] font-extrabold" style={{ color: info.status === "LEWAT" ? C.red : C.yellowDark }}>{info.percent}%</span>
                  </div>
                  <ProgressBar percent={info.percent} status={info.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeGoals.length > 0 && (
        <div className="mt-6">
          <div className="px-5"><SectionTitle action="Lihat semua" onAction={() => go({ page: "goals" })}>Goal aktif</SectionTitle></div>
          <div className="kk-hide-scroll flex gap-3 overflow-x-auto px-5 pb-1">
            {activeGoals.map((g) => {
              const collected = goalCollected(g, data);
              const pct = g.target_nominal > 0 ? Math.min(100, Math.round((collected / g.target_nominal) * 100)) : 0;
              return (
                <div key={g.id} onClick={() => go({ page: "goalDetail", params: { id: g.id } })} className="w-[170px] shrink-0 rounded-3xl p-4" style={{ background: (g.warna || C.blue) + "18" }}>
                  <div className="mb-2 text-2xl">{g.icon || "\u{1F3AF}"}</div>
                  <div className="mb-1 text-[13.5px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{g.nama}</div>
                  <div className="mb-2 text-[11.5px]" style={{ color: C.muted }}>{formatMoney(collected)} / {formatMoney(g.target_nominal)}</div>
                  <ProgressBar percent={pct} status={pct >= 100 ? "LEWAT" : "AMAN"} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topCats.length > 0 && (
        <div className="mt-6 px-5">
          <SectionTitle>Ringkasan pengeluaran</SectionTitle>
          <div className="flex flex-col gap-2.5 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {topCats.map(({ cat, val }) => (
              <div key={cat.id} className="flex items-center gap-3">
                <IconChip emoji={cat.icon} color={cat.warna} size={36} />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-semibold" style={{ color: C.ink }}>{cat.nama}</span>
                    <span className="font-bold" style={{ color: C.ink }}>{formatMoney(val)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#EEF0F5" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (val / (topCats[0].val || 1)) * 100)}%`, background: cat.warna }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 px-5">
        <SectionTitle>Pemasukan vs Pengeluaran</SectionTitle>
        <div className="rounded-3xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#F0F1F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v)} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
              <Bar dataKey="Pemasukan" fill={C.green} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill={C.orange} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="mt-6 px-5">
          <SectionTitle>Insight keuangan</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }) {
  const toneColor = { warning: C.yellowDark, danger: C.red, success: C.green, info: C.blue }[insight.tone] || C.blue;
  const toneBg = { warning: "#FFF7E0", danger: C.redLight, success: C.greenLight, info: C.blueLight }[insight.tone] || C.blueLight;
  const Ico = { up: TrendingUp, down: TrendingDown, alert: AlertTriangle, target: Target, sparkle: Sparkles }[insight.icon] || Sparkles;
  return (
    <div className="flex items-start gap-3 rounded-3xl p-4" style={{ background: toneBg }}>
      <div className="mt-0.5"><Ico size={18} color={toneColor} /></div>
      <div className="text-[13.5px] font-medium leading-snug" style={{ color: C.ink }}>{insight.text}</div>
    </div>
  );
}

function BillRow({ bill, st, onClick }) {
  const badgeColor = { LATE: C.red, TODAY: C.yellowDark, UPCOMING: C.blue, PAID: C.green }[st.status];
  const badgeBg = { LATE: C.redLight, TODAY: "#FFF7E0", UPCOMING: C.blueLight, PAID: C.greenLight }[st.status];
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-3xl p-4 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <IconChip emoji={"\u{1F4C4}"} color={C.blue} size={40} />
      <div className="flex-1">
        <div className="text-[14px] font-bold" style={{ color: C.ink }}>{bill.nama}</div>
        <div className="text-[12px]" style={{ color: C.muted }}>Jatuh tempo {formatDate(st.due.toISOString().slice(0, 10))}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[13px] font-extrabold" style={{ color: C.ink }}>{formatMoney(bill.nominal_default)}</span>
        <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold" style={{ background: badgeBg, color: badgeColor }}>{st.label}</span>
      </div>
    </button>
  );
}

/* ============================================================
   TRANSACTIONS PAGE
   ============================================================ */
function TransactionRow({ t, data, onClick }) {
  const cat = catById(data, t.category_id);
  const acc = accById(data, t.account_id);
  const toAcc = t.to_account_id ? accById(data, t.to_account_id) : null;
  const isIncome = t.tipe === "INCOME";
  const isTransfer = t.tipe === "TRANSFER";
  const color = isTransfer ? C.blue : isIncome ? C.green : C.orange;
  const emoji = isTransfer ? "\u{1F504}" : cat?.icon || "\u{1F4B8}";
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-3xl p-3.5 text-left" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <IconChip emoji={emoji} color={cat?.warna || color} size={42} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold" style={{ color: C.ink }}>
          {isTransfer ? `${acc?.nama || "-"} \u2192 ${toAcc?.nama || "-"}` : (cat?.nama || "Lainnya")}
        </div>
        <div className="truncate text-[12px]" style={{ color: C.muted }}>
          {formatDate(t.tanggal)} {t.merchant ? `\u2022 ${t.merchant}` : ""} {!isTransfer && acc ? `\u2022 ${acc.nama}` : ""}
        </div>
      </div>
      <span className="shrink-0 text-[14px] font-extrabold" style={{ color: isTransfer ? C.ink : isIncome ? C.green : C.red }}>
        {isTransfer ? "" : isIncome ? "+" : "-"}{formatMoney(t.nominal)}
      </span>
    </button>
  );
}

function FilterSheet({ data, filters, setFilters, onClose }) {
  const [f, setF] = useState(filters);
  return (
    <Sheet title="Filter transaksi" onClose={onClose} footer={
      <div className="flex gap-2 pb-2">
        <button onClick={() => { const empty = { tipe: "", account_id: "", category_id: "", member_id: "", from: "", to: "" }; setF(empty); setFilters(empty); onClose(); }} className="flex-1 rounded-2xl py-3 text-[14px] font-bold" style={{ background: "#F1F2F8", color: C.ink }}>Reset</button>
        <button onClick={() => { setFilters(f); onClose(); }} className="flex-1 rounded-2xl py-3 text-[14px] font-bold" style={{ background: C.blue, color: contrastText(C.blue) }}>Terapkan</button>
      </div>
    }>
      <Field label="Tipe transaksi">
        <SelectInput value={f.tipe} onChange={(e) => setF({ ...f, tipe: e.target.value })}>
          <option value="">Semua</option>
          <option value="INCOME">Pemasukan</option>
          <option value="EXPENSE">Pengeluaran</option>
          <option value="TRANSFER">Transfer</option>
        </SelectInput>
      </Field>
      <Field label="Rekening">
        <SelectInput value={f.account_id} onChange={(e) => setF({ ...f, account_id: e.target.value })}>
          <option value="">Semua rekening</option>
          {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
        </SelectInput>
      </Field>
      <Field label="Kategori">
        <SelectInput value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
          <option value="">Semua kategori</option>
          {data.categories.map((c) => <option key={c.id} value={c.id}>{c.nama} ({c.tipe === "INCOME" ? "Masuk" : "Keluar"})</option>)}
        </SelectInput>
      </Field>
      <Field label="Anggota keluarga">
        <SelectInput value={f.member_id} onChange={(e) => setF({ ...f, member_id: e.target.value })}>
          <option value="">Semua anggota</option>
          {data.members.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
        </SelectInput>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dari tanggal"><TextInput type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="Sampai tanggal"><TextInput type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
      </div>
    </Sheet>
  );
}

function TransactionsPage({ data, go, openTx, onDelete }) {
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ tipe: "", account_id: "", category_id: "", member_id: "", from: "", to: "" });
  const [visible, setVisible] = useState(20);

  const filtered = useMemo(() => {
    return data.transactions
      .filter((t) => {
        if (filters.tipe && t.tipe !== filters.tipe) return false;
        if (filters.account_id && t.account_id !== filters.account_id && t.to_account_id !== filters.account_id) return false;
        if (filters.category_id && t.category_id !== filters.category_id) return false;
        if (filters.member_id && t.member_id !== filters.member_id) return false;
        if (filters.from && t.tanggal < filters.from) return false;
        if (filters.to && t.tanggal > filters.to) return false;
        if (q) {
          const cat = catById(data, t.category_id);
          const hay = `${t.catatan || ""} ${t.merchant || ""} ${cat?.nama || ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0));
  }, [data, filters, q]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="pb-6">
      <PageHeader title="Transaksi" />
      <div className="px-5">
        <div className="mb-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 px-3.5" style={{ borderColor: C.border, background: C.card }}>
            <Search size={17} color={C.muted} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari transaksi..." className="w-full bg-transparent py-3 text-[14px] outline-none" style={{ color: C.ink }} />
          </div>
          <button onClick={() => setShowFilter(true)} className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl" style={{ background: activeFilterCount ? C.blue : C.card, border: `2px solid ${activeFilterCount ? C.blue : C.border}` }}>
            <SlidersHorizontal size={18} color={activeFilterCount ? "white" : C.ink} />
            {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: C.red }}>{activeFilterCount}</span>}
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="Belum ada transaksi" subtitle="Yuk catat transaksi pertamamu." />
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {filtered.slice(0, visible).map((t) => (
                <TransactionRow key={t.id} t={t} data={data} onClick={() => go({ page: "transactionDetail", params: { id: t.id } })} />
              ))}
            </div>
            {visible < filtered.length && (
              <button onClick={() => setVisible((v) => v + 20)} className="mt-3 w-full rounded-2xl py-3 text-[13.5px] font-bold" style={{ background: C.blueLight, color: C.blueDark }}>
                Muat lebih banyak ({filtered.length - visible})
              </button>
            )}
          </>
        )}
      </div>
      {showFilter && <FilterSheet data={data} filters={filters} setFilters={setFilters} onClose={() => setShowFilter(false)} />}
    </div>
  );
}

/* ============================================================
   TRANSACTION FORM (add/edit)
   ============================================================ */
function TransactionForm({ data, initialTipe, editing, onSave, onClose, onDelete }) {
  const isEdit = !!editing;
  const [tipe, setTipe] = useState(editing?.tipe || initialTipe || "EXPENSE");
  const [nominal, setNominal] = useState(editing ? String(editing.nominal) : "");
  const [accountId, setAccountId] = useState(editing?.account_id || data.accounts.find((a) => a.is_active)?.id || "");
  const [toAccountId, setToAccountId] = useState(editing?.to_account_id || "");
  const [categoryId, setCategoryId] = useState(editing?.category_id || "");
  const [memberId, setMemberId] = useState(editing?.member_id || "");
  const [tanggal, setTanggal] = useState(editing?.tanggal || todayISO());
  const [merchant, setMerchant] = useState(editing?.merchant || "");
  const [catatan, setCatatan] = useState(editing?.catatan || "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr] = useState("");

  const activeAccounts = data.accounts.filter((a) => a.is_active);
  const cats = data.categories.filter((c) => c.tipe === tipe && c.is_active);

  useEffect(() => {
    if (!isEdit) setCategoryId("");
  }, [tipe]);

  if (activeAccounts.length === 0) {
    return (
      <Sheet title="Tambah rekening dulu" onClose={onClose}>
        <p className="mb-4 text-[14px]" style={{ color: C.muted }}>Kamu perlu punya minimal satu rekening (misalnya Dompet atau Bank) sebelum mencatat transaksi.</p>
      </Sheet>
    );
  }

  function submit() {
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal harus lebih dari 0.");
    if (!accountId) return setErr("Pilih rekening.");
    if (tipe === "TRANSFER") {
      if (!toAccountId) return setErr("Pilih rekening tujuan.");
      if (toAccountId === accountId) return setErr("Rekening asal dan tujuan tidak boleh sama.");
    } else if (!categoryId) {
      return setErr("Pilih kategori.");
    }
    if (!tanggal) return setErr("Pilih tanggal.");

    const payload = {
      id: editing?.id || uid("tx"),
      tipe,
      nominal: nom,
      account_id: accountId,
      to_account_id: tipe === "TRANSFER" ? toAccountId : editing?.goal_id ? editing.to_account_id || null : null,
      category_id: tipe === "TRANSFER" ? null : categoryId,
      member_id: memberId || null,
      tanggal,
      merchant: merchant || null,
      catatan: catatan || null,
      goal_id: editing?.goal_id || null,
      bill_id: editing?.bill_id || null,
    };
    onSave(payload, isEdit);
  }

  const tipeConfig = {
    EXPENSE: { label: "Pengeluaran", color: C.orange },
    INCOME: { label: "Pemasukan", color: C.green },
    TRANSFER: { label: "Transfer", color: C.blue },
  };

  return (
    <Sheet
      title={isEdit ? "Edit transaksi" : "Transaksi baru"}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 pb-2">
          <PrimaryButton color={tipeConfig[tipe].color} onClick={submit}>{isEdit ? "Simpan perubahan" : "Simpan transaksi"}</PrimaryButton>
          {isEdit && <GhostButton color={C.red} onClick={() => setConfirmDel(true)}>Hapus transaksi</GhostButton>}
        </div>
      }
    >
      {!isEdit && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {Object.entries(tipeConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setTipe(key)} className="rounded-2xl py-2.5 text-[12.5px] font-bold" style={{ background: tipe === key ? cfg.color : "#F1F2F8", color: tipe === key ? "white" : C.muted }}>
              {cfg.label}
            </button>
          ))}
        </div>
      )}

      {isEdit && editing?.goal_id && (
        <div className="mb-4 rounded-2xl p-3 text-[12px] font-medium" style={{ background: C.mintLight, color: C.ink }}>
          Ini setoran untuk sebuah goal. Nominal & tanggal ikut memengaruhi progres goal itu; tautan ke rekening tujuannya tetap tersimpan.
        </div>
      )}
      {isEdit && editing?.bill_id && (
        <div className="mb-4 rounded-2xl p-3 text-[12px] font-medium" style={{ background: C.blueLight, color: C.ink }}>
          Ini pembayaran sebuah tagihan. Mengubah nominal & tanggal di sini juga ikut mengubah riwayat pembayaran tagihan itu.
        </div>
      )}

      <Field label="Nominal" required><MoneyInput value={nominal} onChange={setNominal} autoFocus /></Field>

      {tipe === "TRANSFER" ? (
        <>
          <Field label="Dari rekening" required>
            <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </SelectInput>
          </Field>
          <Field label="Ke rekening" required>
            <SelectInput value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Pilih rekening tujuan</option>
              {activeAccounts.filter((a) => a.id !== accountId).map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </SelectInput>
          </Field>
        </>
      ) : (
        <>
          <Field label="Rekening" required>
            <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </SelectInput>
          </Field>
          <Field label="Kategori" required>
            <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Pilih kategori</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nama}</option>)}
            </SelectInput>
          </Field>
        </>
      )}

      <Field label="Tanggal" required><TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>

      {tipe !== "TRANSFER" && (
        <>
          <Field label="Anggota keluarga (opsional)">
            <SelectInput value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Tidak dipilih</option>
              {data.members.filter((m) => m.is_active).map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
            </SelectInput>
          </Field>
          <Field label="Merchant / toko (opsional)"><TextInput value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Contoh: Indomaret" /></Field>
        </>
      )}

      <Field label="Catatan (opsional)"><TextInput value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tambahkan catatan..." /></Field>

      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}

      {confirmDel && (
        <ConfirmDialog
          title="Hapus transaksi?"
          message="Saldo rekening akan disesuaikan kembali secara otomatis."
          danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { onDelete(editing.id); setConfirmDel(false); }}
        />
      )}
    </Sheet>
  );
}

/* ============================================================
   ACCOUNTS
   ============================================================ */
function AccountForm({ editing, onSave, onClose }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const [tipe, setTipe] = useState(editing?.tipe || "CASH");
  const [saldoAwal, setSaldoAwal] = useState(editing ? String(editing.saldo_awal) : "0");
  const [warna, setWarna] = useState(editing?.warna || COLOR_CHOICES[0]);
  const [err, setErr] = useState("");

  function submit() {
    if (!nama.trim()) return setErr("Nama rekening wajib diisi.");
    onSave({ id: editing?.id || uid("acc"), nama: nama.trim(), tipe, saldo_awal: Number(saldoAwal) || 0, warna, icon: null, is_active: editing ? editing.is_active : true });
  }

  return (
    <Sheet title={editing ? "Edit rekening" : "Tambah rekening"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan rekening</PrimaryButton>}>
      <Field label="Nama rekening" required><TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: BCA, Dompet, GoPay" /></Field>
      <Field label="Tipe rekening" required>
        <SelectInput value={tipe} onChange={(e) => setTipe(e.target.value)}>
          {Object.entries(ACCOUNT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectInput>
      </Field>
      <Field label={editing ? "Saldo awal" : "Saldo awal"}><MoneyInput value={saldoAwal} onChange={setSaldoAwal} /></Field>
      <Field label="Warna"><ColorPicker value={warna} onChange={setWarna} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function AccountsPage({ data, go, mutate }) {
  const [form, setForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  return (
    <div className="pb-6">
      <PageHeader title="Rekening" right={
        <button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>
      } />
      <div className="px-5">
        {data.accounts.length === 0 ? (
          <EmptyState icon={Wallet} title="Belum ada rekening" subtitle="Tambahkan dompet, bank, atau e-wallet keluargamu." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.accounts.map((a) => {
              const bal = accountBalance(a, data);
              return (
                <div key={a.id} onClick={() => go({ page: "accountDetail", params: { id: a.id } })} className="flex items-center gap-3 rounded-3xl p-4" style={{ background: a.is_active ? C.card : "#F5F5F8", border: `1px solid ${C.border}`, opacity: a.is_active ? 1 : 0.6 }}>
                  <AccountIconChip tipe={a.tipe} color={a.warna} />
                  <div className="flex-1">
                    <div className="text-[14.5px] font-bold" style={{ color: C.ink }}>{a.nama}</div>
                    <div className="text-[12px]" style={{ color: C.muted }}>{ACCOUNT_LABELS[a.tipe]}{!a.is_active ? " \u2022 Nonaktif" : ""}</div>
                  </div>
                  <span className="text-[15px] font-extrabold" style={{ color: bal < 0 ? C.red : C.ink }}>{formatMoney(bal)}</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 rounded-3xl p-4" style={{ background: C.blueLight }}>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>Total saldo aktif</span>
            <span className="text-[16px] font-extrabold" style={{ color: C.blueDark, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(totalBalance(data))}</span>
          </div>
        </div>
      </div>
      {form && <AccountForm editing={form.id ? form : null} onSave={(payload) => { form.id ? mutate.updateItem("accounts", payload.id, payload) : mutate.addItem("accounts", payload); setForm(null); }} onClose={() => setForm(null)} />}
    </div>
  );
}

function AccountDetailPage({ data, id, go, back, mutate }) {
  const acc = accById(data, id);
  const [form, setForm] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  if (!acc) return <div className="p-5"><PageHeader title="Rekening" onBack={back} /><EmptyState title="Rekening tidak ditemukan" /></div>;
  const bal = accountBalance(acc, data);
  const history = data.transactions.filter((t) => t.account_id === acc.id || t.to_account_id === acc.id).sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1)).slice(0, 30);

  return (
    <div className="pb-6">
      <PageHeader title="Detail Rekening" onBack={back} right={
        <button onClick={() => setForm(acc)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><Pencil size={16} color={C.ink} /></button>
      } />
      <div className="px-5">
        {(() => {
          const baseColor = acc.warna || C.blue;
          const headerText = contrastText(baseColor);
          const isDark = headerText === "#FFFFFF";
          const softText = isDark ? "rgba(255,255,255,0.78)" : "rgba(34,48,58,0.68)";
          const chipBg = isDark ? "rgba(255,255,255,0.22)" : "rgba(34,48,58,0.12)";
          return (
            <div className="mb-4 rounded-3xl p-5" style={{ background: `linear-gradient(135deg, ${baseColor}, ${darkenHex(baseColor, 0.32)})`, color: headerText }}>
              <div className="mb-1 text-[17px] font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{acc.nama}</div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: chipBg }}>
                  {React.createElement(ACCOUNT_ICONS[acc.tipe] || Wallet, { size: 16, color: headerText, strokeWidth: 2.2 })}
                </div>
                <span className="text-[13px]" style={{ color: softText }}>{ACCOUNT_LABELS[acc.tipe]}</span>
              </div>
              <div className="mt-3 text-[13px]" style={{ color: softText }}>Saldo saat ini</div>
              <div className="text-[26px] font-extrabold" style={{ fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(bal)}</div>
            </div>
          );
        })()}
        <button onClick={() => setConfirmDeactivate(true)} className="mb-4 w-full rounded-2xl py-3 text-[13.5px] font-bold" style={{ background: acc.is_active ? "#F1F2F8" : C.greenLight, color: acc.is_active ? C.red : C.green }}>
          {acc.is_active ? "Nonaktifkan rekening" : "Aktifkan kembali"}
        </button>
        <SectionTitle>Riwayat transaksi</SectionTitle>
        {history.length === 0 ? <EmptyState icon={Receipt} title="Belum ada transaksi" /> : (
          <div className="flex flex-col gap-2.5">
            {history.map((t) => <TransactionRow key={t.id} t={t} data={data} onClick={() => go({ page: "transactionDetail", params: { id: t.id } })} />)}
          </div>
        )}
      </div>
      {form && <AccountForm editing={form} onSave={(payload) => { mutate.updateItem("accounts", payload.id, payload); setForm(null); }} onClose={() => setForm(null)} />}
      {confirmDeactivate && (
        <ConfirmDialog
          title={acc.is_active ? "Nonaktifkan rekening?" : "Aktifkan rekening?"}
          message={acc.is_active ? "Rekening tidak akan muncul di daftar rekening aktif, namun riwayat transaksi tetap tersimpan." : "Rekening akan aktif kembali dan bisa dipakai untuk transaksi baru."}
          danger={acc.is_active}
          onCancel={() => setConfirmDeactivate(false)}
          onConfirm={() => { mutate.updateItem("accounts", acc.id, { is_active: !acc.is_active }); setConfirmDeactivate(false); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   CATEGORIES
   ============================================================ */
function CategoryForm({ editing, tipeDefault, categories, onSave, onClose }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const [tipe, setTipe] = useState(editing?.tipe || tipeDefault || "EXPENSE");
  const [icon, setIcon] = useState(editing?.icon || EMOJI_CHOICES[0]);
  const [warna, setWarna] = useState(editing?.warna || COLOR_CHOICES[0]);
  const [parentId, setParentId] = useState(editing?.parent_id || "");
  const [err, setErr] = useState("");
  const parentOptions = categories.filter((c) => c.tipe === tipe && !c.parent_id && c.id !== editing?.id);

  function submit() {
    if (!nama.trim()) return setErr("Nama kategori wajib diisi.");
    onSave({ id: editing?.id || uid("cat"), nama: nama.trim(), tipe, icon, warna, parent_id: parentId || null, is_default: editing?.is_default || false, is_active: editing ? editing.is_active : true });
  }

  return (
    <Sheet title={editing ? "Edit kategori" : "Kategori baru"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan kategori</PrimaryButton>}>
      {!editing && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button onClick={() => setTipe("EXPENSE")} className="rounded-2xl py-2.5 text-[13px] font-bold" style={{ background: tipe === "EXPENSE" ? C.orange : "#F1F2F8", color: tipe === "EXPENSE" ? "white" : C.muted }}>Pengeluaran</button>
          <button onClick={() => setTipe("INCOME")} className="rounded-2xl py-2.5 text-[13px] font-bold" style={{ background: tipe === "INCOME" ? C.green : "#F1F2F8", color: tipe === "INCOME" ? "white" : C.muted }}>Pemasukan</button>
        </div>
      )}
      <Field label="Nama kategori" required><TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Hobi" /></Field>
      <Field label="Induk kategori (opsional, untuk subkategori)">
        <SelectInput value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">Tidak ada (kategori utama)</option>
          {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
        </SelectInput>
      </Field>
      <Field label="Ikon"><EmojiPicker value={icon} onChange={setIcon} /></Field>
      <Field label="Warna"><ColorPicker value={warna} onChange={setWarna} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function CategoriesPage({ data, back, mutate }) {
  const [tab, setTab] = useState("EXPENSE");
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState("");
  const list = data.categories.filter((c) => c.tipe === tab && !c.parent_id);
  const subOf = (id) => data.categories.filter((c) => c.parent_id === id);

  function usedElsewhere(id) {
    return (
      data.transactions.some((t) => t.category_id === id) ||
      data.budgets.some((b) => b.category_id === id) ||
      data.categories.some((c) => c.parent_id === id) ||
      data.bills.some((b) => b.category_id === id)
    );
  }

  return (
    <div className="pb-6">
      <PageHeader title="Kategori" right={<button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>} />
      <div className="px-5">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button onClick={() => setTab("EXPENSE")} className="rounded-2xl py-2.5 text-[13px] font-bold" style={{ background: tab === "EXPENSE" ? C.orange : "#F1F2F8", color: tab === "EXPENSE" ? "white" : C.muted }}>Pengeluaran</button>
          <button onClick={() => setTab("INCOME")} className="rounded-2xl py-2.5 text-[13px] font-bold" style={{ background: tab === "INCOME" ? C.green : "#F1F2F8", color: tab === "INCOME" ? "white" : C.muted }}>Pemasukan</button>
        </div>
        <div className="flex flex-col gap-2.5">
          {list.map((c) => (
            <div key={c.id}>
              <div className="flex items-center gap-3 rounded-3xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, opacity: c.is_active ? 1 : 0.55 }}>
                <IconChip emoji={c.icon} color={c.warna} size={40} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold" style={{ color: C.ink }}>{c.nama}</div>
                  {!c.is_active && <div className="text-[11.5px]" style={{ color: C.muted }}>Nonaktif</div>}
                </div>
                <button onClick={() => setForm(c)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><Pencil size={14} color={C.ink} /></button>
                <button
                  onClick={() => {
                    if (!c.is_default && !usedElsewhere(c.id)) mutate.removeItem("categories", c.id);
                    else mutate.updateItem("categories", c.id, { is_active: !c.is_active });
                    setNotice(!c.is_default && !usedElsewhere(c.id) ? "Kategori dihapus" : c.is_active ? "Kategori dinonaktifkan" : "Kategori diaktifkan");
                    setTimeout(() => setNotice(""), 1800);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ background: C.redLight }}
                >
                  <Trash2 size={14} color={C.red} />
                </button>
              </div>
              {subOf(c.id).length > 0 && (
                <div className="ml-6 mt-1.5 flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: C.border }}>
                  {subOf(c.id).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-2xl p-2.5" style={{ background: "#FAFBFD" }}>
                      <IconChip emoji={s.icon} color={s.warna} size={30} />
                      <span className="flex-1 text-[13px] font-semibold" style={{ color: C.ink }}>{s.nama}</span>
                      <button onClick={() => setForm(s)}><Pencil size={13} color={C.muted} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Toast message={notice} />
      {form && <CategoryForm editing={form.id ? form : null} tipeDefault={tab} categories={data.categories} onSave={(payload) => { form.id ? mutate.updateItem("categories", payload.id, payload) : mutate.addItem("categories", payload); setForm(null); }} onClose={() => setForm(null)} />}
    </div>
  );
}

/* ============================================================
   MEMBERS
   ============================================================ */
function MemberForm({ editing, onSave, onClose }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const [hubungan, setHubungan] = useState(editing?.hubungan || "Anak");
  const [avatar, setAvatar] = useState(editing?.avatar_url || "\u{1F9D1}");
  const [err, setErr] = useState("");
  function submit() {
    if (!nama.trim()) return setErr("Nama anggota wajib diisi.");
    onSave({ id: editing?.id || uid("mem"), nama: nama.trim(), hubungan, avatar_url: avatar, is_active: editing ? editing.is_active : true });
  }
  return (
    <Sheet title={editing ? "Edit anggota" : "Tambah anggota"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan anggota</PrimaryButton>}>
      <Field label="Nama" required><TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Budi" /></Field>
      <Field label="Hubungan">
        <SelectInput value={["Saya", "Pasangan", "Anak", "Orang Tua"].includes(hubungan) ? hubungan : "Lainnya"} onChange={(e) => setHubungan(e.target.value === "Lainnya" ? "" : e.target.value)}>
          {["Saya", "Pasangan", "Anak", "Orang Tua", "Lainnya"].map((h) => <option key={h} value={h}>{h}</option>)}
        </SelectInput>
        {!["Saya", "Pasangan", "Anak", "Orang Tua"].includes(hubungan) && (
          <div className="mt-2"><TextInput value={hubungan} onChange={(e) => setHubungan(e.target.value)} placeholder="Ketik hubungan sendiri, contoh: Kakek" /></div>
        )}
      </Field>
      <Field label="Avatar"><EmojiPicker value={avatar} onChange={setAvatar} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function MembersPage({ data, back, mutate }) {
  const [form, setForm] = useState(null);
  return (
    <div className="pb-6">
      <PageHeader title="Anggota Keluarga" right={<button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>} />
      <div className="px-5">
        {data.members.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada anggota" subtitle="Tambahkan anggota keluarga untuk melacak siapa yang belanja." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-3xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}`, opacity: m.is_active ? 1 : 0.55 }}>
                <IconChip emoji={m.avatar_url} color={C.blue} size={42} />
                <div className="flex-1">
                  <div className="text-[14px] font-bold" style={{ color: C.ink }}>{m.nama}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{m.hubungan}{!m.is_active ? " \u2022 Nonaktif" : ""}</div>
                </div>
                <button onClick={() => setForm(m)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><Pencil size={14} color={C.ink} /></button>
                <button onClick={() => mutate.updateItem("members", m.id, { is_active: !m.is_active })} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: m.is_active ? C.redLight : C.greenLight }}>
                  {m.is_active ? <X size={14} color={C.red} /> : <Check size={14} color={C.green} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {form && <MemberForm editing={form.id ? form : null} onSave={(payload) => { form.id ? mutate.updateItem("members", payload.id, payload) : mutate.addItem("members", payload); setForm(null); }} onClose={() => setForm(null)} />}
    </div>
  );
}

/* ============================================================
   BUDGETS
   ============================================================ */
function BudgetForm({ editing, categories, bulan, tahun, onSave, onClose }) {
  const [categoryId, setCategoryId] = useState(editing?.category_id || "");
  const [nominal, setNominal] = useState(editing ? String(editing.nominal_limit) : "");
  const [alertPct, setAlertPct] = useState(editing ? String(editing.alert_percentage) : "80");
  const [err, setErr] = useState("");
  const expenseCats = categories.filter((c) => c.tipe === "EXPENSE" && c.is_active);

  function submit() {
    if (!categoryId) return setErr("Pilih kategori.");
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal budget harus lebih dari 0.");
    const cat = categories.find((c) => c.id === categoryId);
    onSave({ id: editing?.id || uid("bud"), category_id: categoryId, nama: cat?.nama, bulan, tahun, nominal_limit: nom, alert_percentage: Number(alertPct) || 80 });
  }

  return (
    <Sheet title={editing ? "Edit budget" : "Budget baru"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan budget</PrimaryButton>}>
      <Field label={`Untuk ${BULAN[bulan - 1]} ${tahun}`}>
        <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!!editing}>
          <option value="">Pilih kategori pengeluaran</option>
          {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nama}</option>)}
        </SelectInput>
      </Field>
      <Field label="Batas budget" required><MoneyInput value={nominal} onChange={setNominal} /></Field>
      <Field label="Ingatkan saat terpakai (%)"><TextInput type="number" value={alertPct} onChange={(e) => setAlertPct(e.target.value)} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function BudgetsPage({ data, mutate }) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [form, setForm] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const list = data.budgets.filter((b) => b.bulan === bulan && b.tahun === tahun);

  function shiftMonth(delta) {
    let m = bulan + delta, y = tahun;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setBulan(m); setTahun(y);
  }

  return (
    <div className="pb-6">
      <PageHeader title="Budget" right={<button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>} />
      <div className="px-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl p-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <button onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><ChevronLeft size={16} /></button>
          <span className="text-[14px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{BULAN[bulan - 1]} {tahun}</span>
          <button onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><ChevronRight size={16} /></button>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={PiggyBank} title="Belum ada budget bulan ini" subtitle="Buat batas pengeluaran per kategori supaya keuangan terkontrol." />
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((b) => {
              const info = budgetInfo(b, data);
              const cat = catById(data, b.category_id);
              const statusLabel = { AMAN: "Aman", HAMPIR: "Hampir habis", LEWAT: "Melebihi budget" }[info.status];
              const statusColor = { AMAN: C.green, HAMPIR: C.yellowDark, LEWAT: C.red }[info.status];
              return (
                <div key={b.id} className="rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <IconChip emoji={cat?.icon} color={cat?.warna} size={38} />
                      <div>
                        <div className="text-[14px] font-bold" style={{ color: C.ink }}>{cat?.nama}</div>
                        <div className="text-[11.5px] font-semibold" style={{ color: statusColor }}>{statusLabel}</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setForm(b)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><Pencil size={13} color={C.ink} /></button>
                      <button onClick={() => setConfirmDel(b)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: C.redLight }}><Trash2 size={13} color={C.red} /></button>
                    </div>
                  </div>
                  <ProgressBar percent={info.percent} status={info.status} />
                  <div className="mt-2 flex items-center justify-between text-[12.5px]" style={{ color: C.muted }}>
                    <span>Terpakai {formatMoney(info.spent)}</span>
                    <span>Sisa {formatMoney(info.limit - info.spent)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {form && <BudgetForm editing={form.id ? form : null} categories={data.categories} bulan={bulan} tahun={tahun} onSave={(payload) => { form.id ? mutate.updateItem("budgets", payload.id, payload) : mutate.addItem("budgets", payload); setForm(null); }} onClose={() => setForm(null)} />}
      {confirmDel && <ConfirmDialog title="Hapus budget?" message={`Budget untuk ${catById(data, confirmDel.category_id)?.nama} akan dihapus.`} danger onCancel={() => setConfirmDel(null)} onConfirm={() => { mutate.removeItem("budgets", confirmDel.id); setConfirmDel(null); }} />}
    </div>
  );
}

/* ============================================================
   BILLS
   ============================================================ */
function BillForm({ editing, data, onSave, onClose }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const expenseCats = data.categories.filter((c) => c.tipe === "EXPENSE" && c.is_active);
  const initialCatId = editing?.category_id || expenseCats.find((c) => c.nama.toLowerCase() === String(editing?.kategori || "").toLowerCase())?.id || "";
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [nominal, setNominal] = useState(editing ? String(editing.nominal_default) : "");
  const [jatuhTempo, setJatuhTempo] = useState(editing ? String(editing.jatuh_tempo) : "1");
  const [frekuensi, setFrekuensi] = useState(editing?.frekuensi || "BULANAN");
  const [reminderDays, setReminderDays] = useState(editing ? String(editing.reminder_days) : "3");
  const [autoRepeat, setAutoRepeat] = useState(editing ? !!editing.auto_repeat : true);
  const [err, setErr] = useState("");

  function submit() {
    if (!nama.trim()) return setErr("Nama tagihan wajib diisi.");
    if (!categoryId) return setErr("Pilih kategori.");
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal harus lebih dari 0.");
    const day = Number(jatuhTempo);
    if (!day || day < 1 || day > 31) return setErr("Tanggal jatuh tempo 1-31.");
    const cat = data.categories.find((c) => c.id === categoryId);
    onSave({
      id: editing?.id || uid("bill"), nama: nama.trim(), category_id: categoryId, kategori: cat?.nama || "Lainnya", nominal_default: nom,
      jatuh_tempo: day, frekuensi, reminder_days: Number(reminderDays) || 3, auto_repeat: autoRepeat, is_active: editing ? editing.is_active : true,
    });
  }

  return (
    <Sheet title={editing ? "Edit tagihan" : "Tagihan baru"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan tagihan</PrimaryButton>}>
      <Field label="Nama tagihan" required><TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Listrik PLN" /></Field>
      <Field label="Kategori" required>
        <SelectInput value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Pilih kategori</option>
          {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.nama}</option>)}
        </SelectInput>
      </Field>
      <Field label="Nominal" required><MoneyInput value={nominal} onChange={setNominal} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal jatuh tempo" required><TextInput type="number" min="1" max="31" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} /></Field>
        <Field label="Frekuensi">
          <SelectInput value={frekuensi} onChange={(e) => setFrekuensi(e.target.value)}>
            <option value="BULANAN">Bulanan</option>
            <option value="MINGGUAN">Mingguan</option>
            <option value="TAHUNAN">Tahunan</option>
            <option value="SEKALI">Sekali</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Ingatkan berapa hari sebelumnya"><TextInput type="number" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} /></Field>
      <label className="mb-4 flex items-center gap-2.5">
        <input type="checkbox" checked={autoRepeat} onChange={(e) => setAutoRepeat(e.target.checked)} className="h-5 w-5 rounded" />
        <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>Ulangi otomatis setiap periode</span>
      </label>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function BillPaymentForm({ bill, data, onSave, onClose }) {
  const [accountId, setAccountId] = useState(data.accounts.find((a) => a.is_active)?.id || "");
  const [nominal, setNominal] = useState(String(bill.nominal_default));
  const [tanggal, setTanggal] = useState(todayISO());
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState("");
  const activeAccounts = data.accounts.filter((a) => a.is_active);

  function submit() {
    if (!accountId) return setErr("Pilih rekening sumber pembayaran.");
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal harus lebih dari 0.");
    onSave({ account_id: accountId, nominal: nom, tanggal, catatan: catatan || null });
  }

  return (
    <Sheet title={`Bayar ${bill.nama}`} onClose={onClose} footer={<PrimaryButton color={C.green} onClick={submit}>Catat pembayaran</PrimaryButton>}>
      <Field label="Bayar dari rekening" required>
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.nama} ({formatMoney(accountBalance(a, data))})</option>)}
        </SelectInput>
      </Field>
      <Field label="Nominal" required><MoneyInput value={nominal} onChange={setNominal} /></Field>
      <Field label="Tanggal" required><TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
      <Field label="Catatan (opsional)"><TextInput value={catatan} onChange={(e) => setCatatan(e.target.value)} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function BillsPage({ data, go, mutate }) {
  const [form, setForm] = useState(null);
  const now = new Date();
  const items = data.bills.map((b) => ({ b, st: billStatus(b, data, now) }));
  const order = { LATE: 0, TODAY: 1, UPCOMING: 2, PAID: 3 };
  items.sort((a, c) => order[a.st.status] - order[c.st.status] || a.st.due - c.st.due);

  return (
    <div className="pb-6">
      <PageHeader title="Tagihan" right={<button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>} />
      <div className="px-5">
        {items.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Belum ada tagihan" subtitle="Tambahkan tagihan rutin seperti listrik, internet, atau cicilan." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map(({ b, st }) => (
              <BillRow key={b.id} bill={b} st={st} onClick={() => go({ page: "billDetail", params: { id: b.id } })} />
            ))}
          </div>
        )}
      </div>
      {form && <BillForm editing={form.id ? form : null} data={data} onSave={(payload) => { form.id ? mutate.updateItem("bills", payload.id, payload) : mutate.addItem("bills", payload); setForm(null); }} onClose={() => setForm(null)} />}
    </div>
  );
}

function BillDetailPage({ data, id, back, mutate }) {
  const bill = data.bills.find((b) => b.id === id);
  const [form, setForm] = useState(null);
  const [payForm, setPayForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!bill) return <div className="p-5"><PageHeader title="Tagihan" onBack={back} /><EmptyState title="Tagihan tidak ditemukan" /></div>;
  const st = billStatus(bill, data);
  // Merge legacy bill-payment records (pre-transaction era) with the real linked transactions,
  // reading amounts from the transaction when one exists so an edited transaction always wins.
  const legacyPayments = data.billPayments.filter((p) => p.bill_id === bill.id && !p.linked_tx_id).map((p) => ({ id: p.id, tanggal: p.tanggal, nominal: p.nominal, account_id: p.account_id, catatan: p.catatan }));
  const txPayments = data.transactions.filter((t) => t.bill_id === bill.id && t.tipe === "EXPENSE").map((t) => ({ id: t.id, tanggal: t.tanggal, nominal: t.nominal, account_id: t.account_id, catatan: t.catatan }));
  const payments = [...legacyPayments, ...txPayments].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  const hasPayments = payments.length > 0;
  const badgeColor = { LATE: C.red, TODAY: C.yellowDark, UPCOMING: C.blue, PAID: C.green }[st.status];

  function payBill(payload) {
    const tx = buildBillPaymentTx(bill, payload, data, mutate);
    mutate.addItem("transactions", tx);
    mutate.addItem("billPayments", { id: uid("bp"), bill_id: bill.id, account_id: payload.account_id, nominal: tx.nominal, tanggal: payload.tanggal, catatan: payload.catatan || null, linked_tx_id: tx.id });
    setPayForm(false);
  }
  const badgeBg = { LATE: C.redLight, TODAY: "#FFF7E0", UPCOMING: C.blueLight, PAID: C.greenLight }[st.status];

  return (
    <div className="pb-6">
      <PageHeader title="Detail Tagihan" onBack={back} right={<button onClick={() => setForm(bill)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><Pencil size={16} color={C.ink} /></button>} />
      <div className="px-5">
        <div className="mb-4 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="mb-2 text-[16.5px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{bill.nama}</div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px]" style={{ color: C.muted }}>{bill.kategori} \u2022 {bill.frekuensi}</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: badgeBg, color: badgeColor }}>{st.label}</span>
          </div>
          <div className="text-[13px]" style={{ color: C.muted }}>Nominal</div>
          <div className="mb-2 text-[22px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(bill.nominal_default)}</div>
          <div className="text-[13px]" style={{ color: C.muted }}>Jatuh tempo tanggal {bill.jatuh_tempo} setiap {bill.frekuensi.toLowerCase()} \u2022 Diingatkan {bill.reminder_days} hari sebelumnya</div>
        </div>
        {st.status !== "PAID" && <div className="mb-4"><PrimaryButton color={C.green} onClick={() => setPayForm(true)}>Catat pembayaran</PrimaryButton></div>}
        <button onClick={() => setConfirmDel(true)} className="mb-4 w-full rounded-2xl py-3 text-[13.5px] font-bold" style={{ background: "#F1F2F8", color: C.red }}>Hapus tagihan</button>
        <SectionTitle>Riwayat pembayaran</SectionTitle>
        {!hasPayments ? <EmptyState icon={ReceiptText} title="Belum ada pembayaran" /> : (
          <div className="flex flex-col gap-2.5">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-3xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <IconChip emoji={"\u2705"} color={C.green} size={38} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold" style={{ color: C.ink }}>{formatDate(p.tanggal)}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>{accById(data, p.account_id)?.nama || "-"}</div>
                </div>
                <span className="text-[14px] font-extrabold" style={{ color: C.ink }}>{formatMoney(p.nominal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {form && <BillForm editing={form} data={data} onSave={(payload) => { mutate.updateItem("bills", payload.id, payload); setForm(null); }} onClose={() => setForm(null)} />}
      {payForm && <BillPaymentForm bill={bill} data={data} onSave={payBill} onClose={() => setPayForm(false)} />}
      {confirmDel && (
        <ConfirmDialog
          title="Hapus tagihan?"
          message={hasPayments ? "Tagihan ini punya riwayat pembayaran—tagihan akan dinonaktifkan, bukan dihapus permanen." : "Tagihan akan dihapus permanen."}
          danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => { hasPayments ? mutate.updateItem("bills", bill.id, { is_active: false }) : mutate.removeItem("bills", bill.id); setConfirmDel(false); back(); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   GOALS
   ============================================================ */
function GoalForm({ editing, data, onSave, onClose }) {
  const [nama, setNama] = useState(editing?.nama || "");
  const [target, setTarget] = useState(editing ? String(editing.target_nominal) : "");
  const [targetDate, setTargetDate] = useState(editing?.target_date || "");
  const [icon, setIcon] = useState(editing?.icon || "\u{1F3AF}");
  const [warna, setWarna] = useState(editing?.warna || COLOR_CHOICES[0]);
  const [accountId, setAccountId] = useState(editing?.account_id || "");
  const [reminderOn, setReminderOn] = useState(!!editing?.reminder_day);
  const [reminderDay, setReminderDay] = useState(editing?.reminder_day ? String(editing.reminder_day) : "1");
  const [err, setErr] = useState("");
  const activeAccounts = data.accounts.filter((a) => a.is_active);

  function submit() {
    if (!nama.trim()) return setErr("Nama goal wajib diisi.");
    const t = Number(target);
    if (!t || t <= 0) return setErr("Target nominal harus lebih dari 0.");
    onSave({
      id: editing?.id || uid("goal"), nama: nama.trim(), target_nominal: t, current_nominal: editing?.current_nominal || 0,
      target_date: targetDate || null, icon, warna, status: editing?.status || "ACTIVE",
      account_id: accountId || null,
      reminder_day: reminderOn ? Math.min(31, Math.max(1, Number(reminderDay) || 1)) : null,
    });
  }

  return (
    <Sheet title={editing ? "Edit Goal" : "Goal Baru"} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan Goal</PrimaryButton>}>
      <Field label="Nama Goal" required><TextInput value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Dana Darurat" /></Field>
      <Field label="Target dana" required><MoneyInput value={target} onChange={setTarget} /></Field>
      <Field label="Target tanggal (opsional)"><TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
      <Field label="Rekening tujuan (opsional)">
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">Tidak ditentukan</option>
          {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.nama} ({ACCOUNT_LABELS[a.tipe]})</option>)}
        </SelectInput>
        <p className="mt-1.5 text-[11.5px]" style={{ color: C.muted }}>Setoran ke goal ini akan otomatis masuk ke rekening tersebut, dan tercatat sebagai pengeluaran kategori "{GOAL_SAVING_CATEGORY_NAME}".</p>
      </Field>
      <Field label="Ikon"><EmojiPicker value={icon} onChange={setIcon} /></Field>
      <Field label="Warna"><ColorPicker value={warna} onChange={setWarna} /></Field>
      <label className="mb-3 flex items-center gap-2.5">
        <input type="checkbox" checked={reminderOn} onChange={(e) => setReminderOn(e.target.checked)} className="h-5 w-5 rounded" />
        <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>Ingatkan saya untuk menabung tiap bulan</span>
      </label>
      {reminderOn && (
        <Field label="Tanggal pengingat tiap bulan">
          <TextInput type="number" min="1" max="31" value={reminderDay} onChange={(e) => setReminderDay(e.target.value)} />
        </Field>
      )}
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function GoalDepositForm({ goal, data, onSave, onClose }) {
  const [accountId, setAccountId] = useState(data.accounts.find((a) => a.is_active && a.id !== goal.account_id)?.id || data.accounts.find((a) => a.is_active)?.id || "");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [catatan, setCatatan] = useState("");
  const [err, setErr] = useState("");
  const activeAccounts = data.accounts.filter((a) => a.is_active);

  function submit() {
    if (!accountId) return setErr("Pilih rekening sumber.");
    if (goal.account_id && accountId === goal.account_id) return setErr("Rekening sumber tidak boleh sama dengan rekening tujuan goal.");
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal harus lebih dari 0.");
    onSave({ account_id: accountId, nominal: nom, tanggal, catatan: catatan || null });
  }

  return (
    <Sheet title={`Setoran untuk ${goal.nama}`} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan setoran</PrimaryButton>}>
      {goal.account_id && (
        <div className="mb-4 rounded-2xl p-3 text-[12.5px]" style={{ background: C.mintLight, color: C.ink }}>
          Akan masuk ke rekening tujuan: <b>{accById(data, goal.account_id)?.nama || "-"}</b>
        </div>
      )}
      <Field label="Dari rekening" required>
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {activeAccounts.filter((a) => a.id !== goal.account_id).map((a) => <option key={a.id} value={a.id}>{a.nama} ({formatMoney(accountBalance(a, data))})</option>)}
        </SelectInput>
      </Field>
      <Field label="Nominal" required><MoneyInput value={nominal} onChange={setNominal} autoFocus /></Field>
      <Field label="Tanggal" required><TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
      <Field label="Catatan (opsional)"><TextInput value={catatan} onChange={(e) => setCatatan(e.target.value)} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

/* ---------- Installment plan: split a deposit into 1x / 2x / ... setoran ---------- */
function addIntervalDate(startISO, interval, i) {
  const [y, m, d] = startISO.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (interval === "MINGGUAN") dt.setDate(dt.getDate() + 7 * i);
  else if (interval === "HARIAN") dt.setDate(dt.getDate() + i);
  else dt.setMonth(dt.getMonth() + i);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function splitEvenly(total, n) {
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i === n - 1 ? remainder : 0));
}

function GoalInstallmentPlanForm({ goal, remaining, onSave, onClose }) {
  const [count, setCount] = useState(remaining > 0 ? 2 : 1);
  const [total, setTotal] = useState(String(Math.max(0, Math.round(remaining))));
  const [startDate, setStartDate] = useState(todayISO());
  const [interval, setIntervalVal] = useState("BULANAN");
  const [rows, setRows] = useState(() => {
    const amounts = splitEvenly(Math.max(0, Math.round(remaining)), remaining > 0 ? 2 : 1);
    return amounts.map((amt, i) => ({ nominal: String(amt), tanggal: addIntervalDate(todayISO(), "BULANAN", i) }));
  });
  const [err, setErr] = useState("");

  function regenerate(n, totalStr, start, interv) {
    const totalNum = Math.max(0, Number(totalStr) || 0);
    const nn = Math.max(1, Math.min(60, Number(n) || 1));
    const amounts = splitEvenly(totalNum, nn);
    setRows(amounts.map((amt, i) => ({ nominal: String(amt), tanggal: addIntervalDate(start, interv, i) })));
  }

  function updateCount(n) { setCount(n); regenerate(n, total, startDate, interval); }
  function updateTotal(v) { setTotal(v); regenerate(count, v, startDate, interval); }
  function updateStart(v) { setStartDate(v); regenerate(count, total, v, interval); }
  function updateIntervalField(v) { setIntervalVal(v); regenerate(count, total, startDate, v); }
  function updateRow(i, patch) { setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row))); }

  const sumRows = rows.reduce((s, r) => s + (Number(r.nominal) || 0), 0);

  function submit() {
    if (rows.length === 0) return setErr("Minimal 1 kali setoran.");
    if (rows.some((r) => !r.nominal || Number(r.nominal) <= 0)) return setErr("Semua nominal setoran harus lebih dari 0.");
    if (rows.some((r) => !r.tanggal)) return setErr("Semua tanggal wajib diisi.");
    const items = rows.map((r, i) => ({
      id: uid("gi"), goal_id: goal.id, urutan: i + 1, total_kali: rows.length,
      nominal: Number(r.nominal), tanggal: r.tanggal, status: "PLANNED", deposit_id: null,
    }));
    onSave(items);
  }

  return (
    <Sheet title={`Rencana setoran \u2014 ${goal.nama}`} onClose={onClose} footer={<PrimaryButton onClick={submit}>Simpan rencana ({rows.length}x)</PrimaryButton>}>
      <div className="mb-4 rounded-2xl p-3" style={{ background: C.blueLight }}>
        <div className="flex items-center justify-between text-[12.5px]" style={{ color: C.ink }}>
          <span>Sisa menuju target</span>
          <span className="font-extrabold">{formatMoney(remaining)}</span>
        </div>
      </div>

      <Field label="Mau dicicil berapa kali?">
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 6, 12].map((n) => (
            <button key={n} type="button" onClick={() => updateCount(n)} className="rounded-2xl px-3.5 py-2 text-[13px] font-bold" style={{ background: count === n ? C.blue : "#F1F2F8", color: count === n ? "white" : C.muted }}>
              {n}x
            </button>
          ))}
          <input
            type="number" min="1" max="60" value={count}
            onChange={(e) => updateCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-16 rounded-2xl border-2 px-2 py-2 text-center text-[13px] font-bold outline-none"
            style={{ borderColor: C.border, color: C.ink }}
          />
        </div>
      </Field>

      <Field label="Total yang mau disetor"><MoneyInput value={total} onChange={updateTotal} /></Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mulai tanggal"><TextInput type="date" value={startDate} onChange={(e) => updateStart(e.target.value)} /></Field>
        <Field label="Setiap">
          <SelectInput value={interval} onChange={(e) => updateIntervalField(e.target.value)}>
            <option value="BULANAN">Bulan</option>
            <option value="MINGGUAN">Minggu</option>
            <option value="HARIAN">Hari</option>
          </SelectInput>
        </Field>
      </div>

      <div className="mb-2 mt-1 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: C.ink }}>Rincian per setoran</span>
        <span className="text-[11.5px] font-semibold" style={{ color: sumRows === Math.round(Number(total) || 0) ? C.muted : C.red }}>Total: {formatMoney(sumRows)}</span>
      </div>
      <div className="mb-3 flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 rounded-2xl p-2.5" style={{ background: "#FAFBFD", border: `1px solid ${C.border}` }}>
            <span className="w-5 shrink-0 text-center text-[12px] font-bold" style={{ color: C.muted }}>{i + 1}</span>
            <input
              type="date" value={r.tanggal} onChange={(e) => updateRow(i, { tanggal: e.target.value })}
              className="w-[124px] shrink-0 rounded-xl border-2 px-2 py-2 text-[12px] font-semibold outline-none"
              style={{ borderColor: C.border, color: C.ink }}
            />
            <div className="flex flex-1 items-center gap-1 rounded-xl border-2 px-2.5 py-2" style={{ borderColor: C.border }}>
              <span className="text-[12px] font-bold" style={{ color: C.muted }}>Rp</span>
              <input
                type="text" inputMode="numeric"
                value={r.nominal ? Number(r.nominal).toLocaleString("id-ID") : ""}
                onChange={(e) => updateRow(i, { nominal: parseDigits(e.target.value) })}
                className="w-full bg-transparent text-[13px] font-bold outline-none"
                style={{ color: C.ink }}
              />
            </div>
          </div>
        ))}
      </div>

      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
      <p className="mb-2 text-[11.5px] leading-relaxed" style={{ color: C.muted }}>Setiap nominal & tanggal di atas bisa kamu ubah sendiri. Rencana ini belum memotong saldo rekening — tandai "Sudah disetor" satu per satu saat uangnya benar-benar disetor.</p>
    </Sheet>
  );
}

function RealizeInstallmentForm({ item, data, goalAccountId, onSave, onClose }) {
  const [accountId, setAccountId] = useState(data.accounts.find((a) => a.is_active && a.id !== goalAccountId)?.id || "");
  const [nominal, setNominal] = useState(String(item.nominal));
  const [tanggal, setTanggal] = useState(item.tanggal);
  const [err, setErr] = useState("");
  const activeAccounts = data.accounts.filter((a) => a.is_active);

  function submit() {
    if (!accountId) return setErr("Pilih rekening sumber.");
    if (goalAccountId && accountId === goalAccountId) return setErr("Rekening sumber tidak boleh sama dengan rekening tujuan goal.");
    const nom = Number(nominal);
    if (!nom || nom <= 0) return setErr("Nominal harus lebih dari 0.");
    onSave({ account_id: accountId, nominal: nom, tanggal });
  }

  return (
    <Sheet title={`Setor cicilan ke-${item.urutan} dari ${item.total_kali}`} onClose={onClose} footer={<PrimaryButton color={C.green} onClick={submit}>Tandai sudah disetor</PrimaryButton>}>
      <Field label="Dari rekening" required>
        <SelectInput value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {activeAccounts.filter((a) => a.id !== goalAccountId).map((a) => <option key={a.id} value={a.id}>{a.nama} ({formatMoney(accountBalance(a, data))})</option>)}
        </SelectInput>
      </Field>
      <Field label="Nominal" required><MoneyInput value={nominal} onChange={setNominal} /></Field>
      <Field label="Tanggal" required><TextInput type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></Field>
      {err && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{err}</div>}
    </Sheet>
  );
}

function GoalsPage({ data, go, mutate }) {
  const [form, setForm] = useState(null);
  return (
    <div className="pb-6">
      <PageHeader title="Goals" right={<button onClick={() => setForm({})} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: C.blue, color: contrastText(C.blue) }}><Plus size={18} /></button>} />
      <div className="px-5">
        {data.goals.length === 0 ? (
          <EmptyState icon={Target} title="Belum ada goal" subtitle="Buat target menabung, misalnya Dana Darurat atau Liburan." />
        ) : (
          <div className="flex flex-col gap-3">
            {data.goals.map((g) => {
              const collected = goalCollected(g, data);
              const pct = g.target_nominal > 0 ? Math.min(100, Math.round((collected / g.target_nominal) * 100)) : 0;
              return (
                <button key={g.id} onClick={() => go({ page: "goalDetail", params: { id: g.id } })} className="rounded-3xl p-4 text-left" style={{ background: (g.warna || C.blue) + "14" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <div className="text-[14.5px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{g.nama}</div>
                        {g.target_date && <div className="text-[11.5px]" style={{ color: C.muted }}>Target {formatDate(g.target_date)}</div>}
                      </div>
                    </div>
                    {g.status === "COMPLETED" && <span className="rounded-full px-2 py-1 text-[10.5px] font-bold" style={{ background: C.greenLight, color: C.green }}>Selesai</span>}
                  </div>
                  <div className="mb-1.5 flex items-center justify-between text-[12.5px]" style={{ color: C.muted }}>
                    <span>{formatMoney(collected)}</span>
                    <span>{formatMoney(g.target_nominal)}</span>
                  </div>
                  <ProgressBar percent={pct} status={pct >= 100 ? "LEWAT" : "AMAN"} />
                </button>
              );
            })}
          </div>
        )}
      </div>
      {form && <GoalForm editing={form.id ? form : null} data={data} onSave={(payload) => { form.id ? mutate.updateItem("goals", payload.id, payload) : mutate.addItem("goals", payload); setForm(null); }} onClose={() => setForm(null)} />}
    </div>
  );
}

function GoalDetailPage({ data, id, back, mutate }) {
  const goal = data.goals.find((g) => g.id === id);
  const [form, setForm] = useState(null);
  const [depForm, setDepForm] = useState(false);
  const [planForm, setPlanForm] = useState(false);
  const [realizeItem, setRealizeItem] = useState(null);
  const [confirmDelPlanItem, setConfirmDelPlanItem] = useState(null);
  const [confirmClearPlan, setConfirmClearPlan] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (!goal) return <div className="p-5"><PageHeader title="Goal" onBack={back} /><EmptyState title="Goal tidak ditemukan" /></div>;
  const collected = goalCollected(goal, data);
  const pct = goal.target_nominal > 0 ? Math.min(100, Math.round((collected / goal.target_nominal) * 100)) : 0;
  const remaining = Math.max(0, goal.target_nominal - collected);
  const goalAccount = goal.account_id ? accById(data, goal.account_id) : null;
  const reminder = goalReminderInfo(goal, data);
  const oldDeposits = data.goalDeposits.filter((d) => d.goal_id === goal.id).map((d) => ({ id: d.id, tanggal: d.tanggal, nominal: d.nominal, account_id: d.account_id, catatan: d.catatan }));
  const newDeposits = data.transactions.filter((t) => t.goal_id === goal.id && t.tipe === "EXPENSE").map((t) => ({ id: t.id, tanggal: t.tanggal, nominal: t.nominal, account_id: t.account_id, catatan: t.catatan }));
  const deposits = [...oldDeposits, ...newDeposits].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  const planned = (data.goalInstallments || [])
    .filter((x) => x.goal_id === goal.id && x.status === "PLANNED")
    .sort((a, b) => a.urutan - b.urutan);
  const doneCount = (data.goalInstallments || []).filter((x) => x.goal_id === goal.id && x.status === "DONE").length;
  const totalPlanCount = planned.length + doneCount;

  function makeDepositTransaction(payload) {
    mutate.addItem("transactions", buildGoalDepositTx(goal, payload, data, mutate));
  }

  function realize(item, payload) {
    const tx = buildGoalDepositTx(goal, payload, data, mutate, `Cicilan ke-${item.urutan} dari ${item.total_kali}`);
    mutate.addItem("transactions", tx);
    mutate.updateItem("goalInstallments", item.id, { status: "DONE", deposit_id: tx.id, nominal: tx.nominal, tanggal: tx.tanggal });
    setRealizeItem(null);
  }

  const reminderColor = reminder && { LATE: C.red, TODAY: C.yellowDark, UPCOMING: C.blueDark, DONE: C.green }[reminder.status];
  const reminderBg = reminder && { LATE: C.redLight, TODAY: "#FFF7E0", UPCOMING: C.blueLight, DONE: C.greenLight }[reminder.status];

  return (
    <div className="pb-6">
      <PageHeader title="Detail Goal" onBack={back} right={<button onClick={() => setForm(goal)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><Pencil size={16} color={C.ink} /></button>} />
      <div className="px-5">
        <div className="mb-4 rounded-3xl p-5" style={{ background: (goal.warna || C.blue) + "18" }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">{goal.icon}</span>
            <span className="text-[17px] font-extrabold leading-tight" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{goal.nama}</span>
          </div>
          <div className="mb-1 flex items-center justify-between text-[13px]" style={{ color: C.muted }}>
            <span>Terkumpul</span><span>Target</span>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[19px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(collected)}</span>
            <span className="text-[14px] font-semibold" style={{ color: C.muted }}>{formatMoney(goal.target_nominal)}</span>
          </div>
          <ProgressBar percent={pct} status={pct >= 100 ? "LEWAT" : "AMAN"} />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12.5px] font-bold" style={{ color: goal.warna || C.blue }}>{pct}% tercapai</span>
            {goalAccount && <span className="text-[11.5px] font-semibold" style={{ color: C.muted }}>Rekening: {goalAccount.nama}</span>}
          </div>
        </div>

        {reminder && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl p-3.5" style={{ background: reminderBg }}>
            <Bell size={16} color={reminderColor} />
            <span className="flex-1 text-[12.5px] font-semibold" style={{ color: C.ink }}>Pengingat nabung tanggal {goal.reminder_day} tiap bulan</span>
            <span className="text-[12px] font-extrabold" style={{ color: reminderColor }}>{reminder.label}</span>
          </div>
        )}

        {goal.status === "ACTIVE" && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <PrimaryButton onClick={() => setDepForm(true)}>Tambah setoran</PrimaryButton>
            <GhostButton color={C.blueDark} onClick={() => setPlanForm(true)}>Cicil beberapa kali</GhostButton>
          </div>
        )}
        <div className="mb-4 grid grid-cols-2 gap-2">
          {goal.status === "ACTIVE" ? (
            <GhostButton color={C.ink} onClick={() => mutate.updateItem("goals", goal.id, { status: "CANCELLED" })}>Batalkan goal</GhostButton>
          ) : (
            <GhostButton color={C.ink} onClick={() => mutate.updateItem("goals", goal.id, { status: "ACTIVE" })}>Aktifkan lagi</GhostButton>
          )}
          <GhostButton color={C.red} onClick={() => setConfirmDel(true)}>Hapus goal</GhostButton>
        </div>

        {planned.length > 0 && (
          <div className="mb-5">
            <SectionTitle action="Hapus rencana" onAction={() => setConfirmClearPlan(true)}>
              Rencana setoran ({doneCount}/{totalPlanCount} selesai)
            </SectionTitle>
            <div className="flex flex-col gap-2.5">
              {planned.map((item) => (
                <div key={item.id} className="rounded-3xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12.5px] font-bold" style={{ color: C.muted }}>Cicilan ke-{item.urutan} dari {item.total_kali}</span>
                    <button onClick={() => setConfirmDelPlanItem(item)} className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: C.redLight }}><Trash2 size={13} color={C.red} /></button>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="date" value={item.tanggal}
                      onChange={(e) => mutate.updateItem("goalInstallments", item.id, { tanggal: e.target.value })}
                      className="w-[124px] shrink-0 rounded-xl border-2 px-2 py-2 text-[12px] font-semibold outline-none"
                      style={{ borderColor: C.border, color: C.ink }}
                    />
                    <div className="flex flex-1 items-center gap-1 rounded-xl border-2 px-2.5 py-2" style={{ borderColor: C.border }}>
                      <span className="text-[12px] font-bold" style={{ color: C.muted }}>Rp</span>
                      <input
                        type="text" inputMode="numeric"
                        value={item.nominal ? Number(item.nominal).toLocaleString("id-ID") : ""}
                        onChange={(e) => mutate.updateItem("goalInstallments", item.id, { nominal: Number(parseDigits(e.target.value)) || 0 })}
                        className="w-full bg-transparent text-[13px] font-bold outline-none"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </div>
                  <button onClick={() => setRealizeItem(item)} className="flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-[13px] font-bold text-white" style={{ background: C.green }}>
                    <CheckCircle2 size={15} /> Tandai sudah disetor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionTitle>Riwayat setoran</SectionTitle>
        {deposits.length === 0 ? <EmptyState icon={Coins} title="Belum ada setoran" /> : (
          <div className="flex flex-col gap-2.5">
            {deposits.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-3xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <IconChip emoji={"\u{1F4B5}"} color={C.green} size={38} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold" style={{ color: C.ink }}>{formatDate(d.tanggal)}</div>
                  <div className="text-[12px]" style={{ color: C.muted }}>dari {accById(data, d.account_id)?.nama || "-"}{d.catatan ? ` \u2022 ${d.catatan}` : ""}</div>
                </div>
                <span className="text-[14px] font-extrabold" style={{ color: C.green }}>+{formatMoney(d.nominal)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {form && <GoalForm editing={form} data={data} onSave={(payload) => { mutate.updateItem("goals", payload.id, payload); setForm(null); }} onClose={() => setForm(null)} />}
      {depForm && <GoalDepositForm goal={goal} data={data} onSave={(payload) => { makeDepositTransaction(payload); setDepForm(false); }} onClose={() => setDepForm(false)} />}
      {planForm && <GoalInstallmentPlanForm goal={goal} remaining={remaining} onSave={(items) => { items.forEach((it) => mutate.addItem("goalInstallments", it)); setPlanForm(false); }} onClose={() => setPlanForm(false)} />}
      {realizeItem && <RealizeInstallmentForm item={realizeItem} data={data} goalAccountId={goal.account_id} onSave={(payload) => realize(realizeItem, payload)} onClose={() => setRealizeItem(null)} />}
      {confirmDelPlanItem && (
        <ConfirmDialog
          title="Hapus cicilan ini?"
          message={`Cicilan ke-${confirmDelPlanItem.urutan} dari rencana akan dihapus.`}
          danger
          onCancel={() => setConfirmDelPlanItem(null)}
          onConfirm={() => { mutate.removeItem("goalInstallments", confirmDelPlanItem.id); setConfirmDelPlanItem(null); }}
        />
      )}
      {confirmClearPlan && (
        <ConfirmDialog
          title="Hapus semua rencana?"
          message="Semua cicilan yang belum disetor pada rencana ini akan dihapus. Setoran yang sudah tercatat tidak terpengaruh."
          danger
          onCancel={() => setConfirmClearPlan(false)}
          onConfirm={() => { mutate.setBulk({ goalInstallments: data.goalInstallments.filter((x) => !(x.goal_id === goal.id && x.status === "PLANNED")) }); setConfirmClearPlan(false); }}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          title="Hapus goal?"
          message="Riwayat setoran dan rencana cicilan goal ini juga akan dihapus."
          danger
          onCancel={() => setConfirmDel(false)}
          onConfirm={() => {
            mutate.removeItem("goals", goal.id);
            mutate.setBulk({
              goalDeposits: data.goalDeposits.filter((d) => d.goal_id !== goal.id),
              goalInstallments: (data.goalInstallments || []).filter((x) => x.goal_id !== goal.id),
            });
            setConfirmDel(false);
            back();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   REPORTS
   ============================================================ */
function ReportsPage({ data }) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const ym = `${tahun}-${String(bulan).padStart(2, "0")}`;

  function shiftMonth(delta) {
    let m = bulan + delta, y = tahun;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setBulan(m); setTahun(y);
  }

  const trendData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(tahun, bulan - 1 - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const t = monthTotals(data, key);
      arr.push({ label: BULAN_PENDEK[dt.getMonth()], Pemasukan: t.income, Pengeluaran: t.expense });
    }
    return arr;
  }, [data, bulan, tahun]);

  const pieData = useMemo(() => {
    const map = {};
    data.transactions.forEach((t) => {
      if (t.tipe !== "EXPENSE" || monthKey(t.tanggal) !== ym) return;
      map[t.category_id] = (map[t.category_id] || 0) + Number(t.nominal);
    });
    return Object.entries(map).map(([id, val]) => { const c = catById(data, id); return { name: c?.nama || "Lainnya", value: val, color: c?.warna || C.muted }; }).sort((a, b) => b.value - a.value);
  }, [data, ym]);

  const dailyTrend = useMemo(() => {
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const arr = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: 0 }));
    data.transactions.forEach((t) => {
      if (t.tipe !== "EXPENSE" || monthKey(t.tanggal) !== ym) return;
      const d = Number(t.tanggal.slice(8, 10));
      if (arr[d - 1]) arr[d - 1].total += Number(t.nominal);
    });
    let running = 0;
    return arr.map((a) => { running += a.total; return { day: a.day, Kumulatif: running }; });
  }, [data, ym, bulan, tahun]);

  const budgetVsActual = useMemo(() => {
    return data.budgets.filter((b) => b.bulan === bulan && b.tahun === tahun).map((b) => {
      const info = budgetInfo(b, data); const c = catById(data, b.category_id);
      return { label: c?.nama || "-", Budget: info.limit, Aktual: info.spent };
    });
  }, [data, bulan, tahun]);

  const byMember = useMemo(() => {
    return data.members.map((m) => {
      const total = data.transactions.filter((t) => t.tipe === "EXPENSE" && t.member_id === m.id && monthKey(t.tanggal) === ym).reduce((s, t) => s + Number(t.nominal), 0);
      return { label: m.nama, total };
    }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
  }, [data, ym]);

  const { income, expense } = monthTotals(data, ym);

  return (
    <div className="pb-6">
      <PageHeader title="Laporan" />
      <div className="px-5">
        <div className="mb-5 flex items-center justify-between rounded-2xl p-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <button onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><ChevronLeft size={16} /></button>
          <span className="text-[14px] font-extrabold" style={{ color: C.ink, fontFamily: "'Baloo 2', sans-serif" }}>{BULAN[bulan - 1]} {tahun}</span>
          <button onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#F1F2F8" }}><ChevronRight size={16} /></button>
        </div>

        <SectionTitle>Pemasukan vs Pengeluaran (6 bulan)</SectionTitle>
        <div className="mb-6 rounded-3xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={trendData} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#F0F1F6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v)} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
              <Bar dataKey="Pemasukan" fill={C.green} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill={C.orange} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Pengeluaran per kategori</SectionTitle>
        <div className="mb-6 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {pieData.length === 0 ? <EmptyState icon={BarChart3} title="Belum ada data" subtitle="Belum ada pengeluaran di bulan ini." /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-col gap-1.5">
                {pieData.slice(0, 6).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />{e.name}</span>
                    <span className="font-semibold" style={{ color: C.ink }}>{formatMoney(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <SectionTitle>Trend pengeluaran harian</SectionTitle>
        <div className="mb-6 rounded-3xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={dailyTrend} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#F0F1F6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v)} />
              <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
              <Line type="monotone" dataKey="Kumulatif" stroke={C.blue} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <SectionTitle>Budget vs aktual</SectionTitle>
        <div className="mb-6 rounded-3xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {budgetVsActual.length === 0 ? <EmptyState icon={PiggyBank} title="Belum ada budget" /> : (
            <ResponsiveContainer width="100%" height={Math.max(140, budgetVsActual.length * 46)}>
              <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="#F0F1F6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}jt` : v)} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                <Bar dataKey="Budget" fill={C.blueLight} radius={[0, 6, 6, 0]} />
                <Bar dataKey="Aktual" fill={C.orange} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <SectionTitle>Pengeluaran per anggota</SectionTitle>
        <div className="mb-2 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {byMember.length === 0 ? <EmptyState icon={Users} title="Belum ada data" /> : (
            <div className="flex flex-col gap-3">
              {byMember.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between text-[13px]"><span className="font-semibold" style={{ color: C.ink }}>{m.label}</span><span className="font-bold" style={{ color: C.ink }}>{formatMoney(m.total)}</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#EEF0F5" }}>
                    <div className="h-full rounded-full" style={{ width: `${(m.total / (byMember[0].total || 1)) * 100}%`, background: C.blue }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-3xl p-4" style={{ background: C.greenLight }}>
            <div className="text-[12px] font-semibold" style={{ color: C.muted }}>Total masuk</div>
            <div className="text-[15px] font-extrabold" style={{ color: C.green, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(income)}</div>
          </div>
          <div className="flex-1 rounded-3xl p-4" style={{ background: C.redLight }}>
            <div className="text-[12px] font-semibold" style={{ color: C.muted }}>Total keluar</div>
            <div className="text-[15px] font-extrabold" style={{ color: C.red, fontFamily: "'Baloo 2', sans-serif" }}>{formatMoney(expense)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MORE / SETTINGS
   ============================================================ */
function MorePage({ go, data }) {
  const items = [
    { key: "accounts", label: "Rekening", icon: Wallet, color: C.blue },
    { key: "categories", label: "Kategori", icon: Tag, color: C.orange },
    { key: "members", label: "Anggota Keluarga", icon: Users, color: C.green },
    { key: "bills", label: "Tagihan", icon: ReceiptText, color: C.yellowDark },
    { key: "reports", label: "Laporan", icon: BarChart3, color: "#8B5CF6" },
    { key: "settings", label: "Pengaturan", icon: Settings, color: C.muted },
  ];
  return (
    <div className="pb-6">
      <PageHeader title="Lainnya" />
      <div className="px-5">
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <button key={it.key} onClick={() => go({ page: it.key })} className="flex flex-col items-start gap-3 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: it.color + "1F" }}>
                <it.icon size={20} color={it.color} />
              </div>
              <span className="text-[13.5px] font-bold" style={{ color: C.ink }}>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ data, mutate, back, auth }) {
  const [name, setName] = useState(data.settings.familyName || "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [passErr, setPassErr] = useState("");
  const user = auth.currentUser;
  const isGoogle = user?.authProvider === "google";

  async function savePassword() {
    setPassErr("");
    if (newPass !== newPassConfirm) return setPassErr("Konfirmasi password tidak cocok.");
    const ok = await auth.setPasswordForCurrentUser(user.id, newPass);
    if (ok) {
      setNewPass("");
      setNewPassConfirm("");
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 1500);
    } else {
      setPassErr(auth.authError);
    }
  }

  return (
    <div className="pb-6">
      <PageHeader title="Pengaturan" onBack={back} />
      <div className="px-5">
        {user && (
          <div className="mb-5 flex items-center gap-3 rounded-3xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-12 w-12 rounded-full" />
            ) : (
              <IconChip emoji={"\u{1F464}"} color={C.blue} size={48} />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold" style={{ color: C.ink }}>{user.nama}</div>
              <div className="truncate text-[12px]" style={{ color: C.muted }}>{user.email || "Tanpa email"}</div>
            </div>
            {isGoogle && <span className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold" style={{ background: C.mintLight, color: C.mintDark }}>Google</span>}
          </div>
        )}
        <Field label="Nama keluarga">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="mb-6">
          <PrimaryButton onClick={() => { mutate.setBulk({ settings: { ...data.settings, familyName: name } }); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>Simpan</PrimaryButton>
        </div>
        <Field label="Mata uang"><TextInput value="IDR (Rupiah)" disabled /></Field>
        <Field label="Zona waktu"><TextInput value="Asia/Jakarta" disabled /></Field>

        <SectionTitle>{user?.password_hash ? "Ganti password" : "Atur password"}</SectionTitle>
        {!user?.password_hash && (
          <p className="mb-3 text-[12px]" style={{ color: C.muted }}>Akun ini belum punya password (dibuat lewat Google). Atur password supaya bisa masuk pakai email juga.</p>
        )}
        <Field label="Password baru"><TextInput type="password" placeholder="Minimal 6 karakter" value={newPass} onChange={(e) => setNewPass(e.target.value)} /></Field>
        <Field label="Ulangi password baru"><TextInput type="password" placeholder="Ketik ulang" value={newPassConfirm} onChange={(e) => setNewPassConfirm(e.target.value)} /></Field>
        {passErr && <div className="mb-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: C.redLight, color: C.red }}>{passErr}</div>}
        <div className="mb-6">
          <GhostButton color={C.blueDark} onClick={savePassword}>Simpan password</GhostButton>
        </div>

        <div className="mt-2 rounded-3xl p-4" style={{ background: C.blueLight }}>
          <div className="mb-1 flex items-center gap-2"><Info size={16} color={C.blueDark} /><span className="text-[13.5px] font-bold" style={{ color: C.ink }}>Tentang data kamu</span></div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: C.muted }}>Data keuangan tersimpan otomatis untuk akunmu di perangkat ini. Ini adalah prototipe yang berjalan di sisi klien untuk keperluan uji coba, bukan pengganti server produksi dengan database nyata — akun & data belum tersinkron ke perangkat lain.</p>
        </div>

        <button onClick={() => setConfirmSignOut(true)} className="mt-6 w-full rounded-2xl py-3.5 text-[14px] font-bold" style={{ background: "#F1F2F8", color: C.ink }}>Keluar</button>
        <button onClick={() => setConfirmReset(true)} className="mt-3 w-full rounded-2xl py-3.5 text-[14px] font-bold" style={{ background: C.redLight, color: C.red }}>Hapus semua data</button>
      </div>
      <Toast message={saved ? "Perubahan disimpan" : passSaved ? "Password disimpan" : ""} />
      {confirmReset && (
        <ConfirmDialog
          title="Hapus semua data?"
          message="Semua rekening, transaksi, budget, tagihan, dan goals akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => { mutate.resetAll(); setConfirmReset(false); }}
        />
      )}
      {confirmSignOut && (
        <ConfirmDialog
          title="Keluar dari akun ini?"
          message="Kamu akan kembali ke halaman masuk. Data keuangan yang sudah tersimpan di perangkat ini tidak akan hilang, dan bisa diakses lagi setelah masuk ulang."
          onCancel={() => setConfirmSignOut(false)}
          onConfirm={() => {
            try {
              if (window.google && window.google.accounts && window.google.accounts.id) window.google.accounts.id.disableAutoSelect();
            } catch (e) {
              /* ignore */
            }
            auth.logout();
            setConfirmSignOut(false);
          }}
        />
      )}
    </div>
  );
}

/* ============================================================
   TRANSACTION DETAIL (view -> edit)
   ============================================================ */
function TransactionDetailPage({ data, id, back, onEdit }) {
  const t = data.transactions.find((x) => x.id === id);
  if (!t) return <div className="p-5"><PageHeader title="Transaksi" onBack={back} /><EmptyState title="Transaksi tidak ditemukan" /></div>;
  const cat = catById(data, t.category_id);
  const acc = accById(data, t.account_id);
  const toAcc = t.to_account_id ? accById(data, t.to_account_id) : null;
  const member = t.member_id ? memberById(data, t.member_id) : null;
  const isIncome = t.tipe === "INCOME";
  const isTransfer = t.tipe === "TRANSFER";
  const color = isTransfer ? C.blue : isIncome ? C.green : C.orange;

  return (
    <div className="pb-6">
      <PageHeader title="Detail transaksi" onBack={back} right={<button onClick={() => onEdit(t)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><Pencil size={16} color={C.ink} /></button>} />
      <div className="px-5">
        <div className="mb-4 flex flex-col items-center rounded-3xl p-6" style={{ background: color + "14" }}>
          <IconChip emoji={isTransfer ? "\u{1F504}" : cat?.icon || "\u{1F4B8}"} color={cat?.warna || color} size={56} />
          <div className="mt-3 text-[24px] font-extrabold" style={{ color, fontFamily: "'Baloo 2', sans-serif" }}>
            {isTransfer ? "" : isIncome ? "+" : "-"}{formatMoney(t.nominal)}
          </div>
          <div className="text-[13px]" style={{ color: C.muted }}>{formatDateLong(t.tanggal)}</div>
        </div>
        <div className="flex flex-col divide-y rounded-3xl px-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {isTransfer ? (
            <>
              <Row label="Dari rekening" value={acc?.nama} />
              <Row label="Ke rekening" value={toAcc?.nama} />
            </>
          ) : (
            <>
              <Row label="Kategori" value={cat?.nama} />
              <Row label="Rekening" value={acc?.nama} />
              {member && <Row label="Anggota" value={member.nama} />}
              {t.merchant && <Row label="Merchant" value={t.merchant} />}
            </>
          )}
          {t.catatan && <Row label="Catatan" value={t.catatan} />}
        </div>
      </div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[13px]" style={{ color: C.muted }}>{label}</span>
      <span className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{value}</span>
    </div>
  );
}

/* ============================================================
   MOBILE SHELL — keeps the app phone-shaped on any screen size
   ============================================================ */
function Shell({ children }) {
  return (
    <div className="flex min-h-screen w-full justify-center" style={{ background: "#D9DCE8" }}>
      <style>{FONT_STYLE}</style>
      <div
        className="relative w-full max-w-[480px] min-h-screen overflow-x-hidden"
        style={{ background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 0 60px rgba(20,24,60,0.12)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const auth = useAuth();
  const [data, setData, ready] = usePersistentData(auth.currentUser?.id || null);
  const [authView, setAuthView] = useState("login");

  // Always land back on the Login screen (not stuck on Register) after signing out.
  useEffect(() => {
    if (!auth.currentUser) setAuthView("login");
  }, [auth.currentUser]);

  const [stack, setStack] = useState([{ page: "dashboard" }]);
  const [txModal, setTxModal] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  // Start fresh at the dashboard (and close any open modal) whenever the logged-in
  // account changes — logging out, logging back in, or switching to a different account —
  // so no one resumes on a stale page or mid-open form left over from a previous session.
  useEffect(() => {
    setStack([{ page: "dashboard" }]);
    setTxModal(null);
    setFabOpen(false);
  }, [auth.currentUser?.id]);

  const current = stack[stack.length - 1];

  function go(entry) { setStack((s) => [...s, entry]); }
  function goTab(page) { setStack([{ page }]); }
  function back() { setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)); }

  const mutate = data
    ? {
        addItem: (key, item) => setData((d) => ({ ...d, [key]: [...d[key], item] })),
        updateItem: (key, id, patch) => setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
        removeItem: (key, id) => setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) })),
        setBulk: (patch) => setData((d) => ({ ...d, ...patch })),
        resetAll: () => setData(() => createDefaultData()),
      }
    : null;

  // Brand-new account: seed its data with the profile info collected at register/Google login.
  // Runs once (guarded by the onboarded flag itself), right after fresh data loads for this user.
  useEffect(() => {
    if (!ready || !data || data.settings.onboarded || !auth.currentUser) return;
    setData((d) => ({
      ...d,
      settings: {
        ...d.settings,
        familyName: auth.currentUser.nama,
        onboarded: true,
        email: auth.currentUser.email || null,
        avatar: auth.currentUser.avatar || null,
        authProvider: auth.currentUser.authProvider || "manual",
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data && data.settings.onboarded, auth.currentUser]);

  if (!auth.ready) {
    return (
      <Shell>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl" style={{ background: C.blue }}>
              <Wallet size={26} color={contrastText(C.blue)} />
            </div>
            <div className="text-[13px] font-semibold" style={{ color: C.muted }}>Memuat...</div>
          </div>
        </div>
      </Shell>
    );
  }

  if (!auth.currentUser) {
    return (
      <Shell>
        {authView === "login" ? (
          <LoginPage auth={auth} onSwitch={() => setAuthView("register")} />
        ) : (
          <RegisterPage auth={auth} onSwitch={() => setAuthView("login")} />
        )}
      </Shell>
    );
  }

  if (!ready || !data) {
    return (
      <Shell>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl" style={{ background: C.blue }}>
              <Wallet size={26} color={contrastText(C.blue)} />
            </div>
            <div className="text-[13px] font-semibold" style={{ color: C.muted }}>Memuat data keuangan...</div>
          </div>
        </div>
      </Shell>
    );
  }

  // Brand-new account: seed its data with the profile info collected at register/Google login.
  if (!data.settings.onboarded) {
    return (
      <Shell>
        <div className="flex min-h-screen w-full items-center justify-center">
          <div className="text-[13px] font-semibold" style={{ color: C.muted }}>Menyiapkan akunmu...</div>
        </div>
      </Shell>
    );
  }

  function openTx(tipe) {
    setTxModal({ tipe, editing: null });
  }

  function saveTx(payload, isEdit) {
    if (isEdit) mutate.updateItem("transactions", payload.id, payload);
    else mutate.addItem("transactions", payload);
    setTxModal(null);
  }
  function deleteTx(id) {
    mutate.removeItem("transactions", id);
    // If this transaction was the realized deposit for a planned installment, put that
    // installment back to PLANNED so it doesn't silently disappear as "done" forever.
    const linkedInstallment = (data.goalInstallments || []).find((x) => x.deposit_id === id);
    if (linkedInstallment) mutate.updateItem("goalInstallments", linkedInstallment.id, { status: "PLANNED", deposit_id: null });
    // If this transaction was a bill payment, remove its payment record too so the bill
    // correctly goes back to "belum dibayar" instead of staying stuck as paid.
    const linkedBillPayment = (data.billPayments || []).find((p) => p.linked_tx_id === id);
    if (linkedBillPayment) mutate.removeItem("billPayments", linkedBillPayment.id);
    setTxModal(null);
    if (current.page === "transactionDetail") back();
  }

  let body = null;
  switch (current.page) {
    case "dashboard":
      body = <Dashboard data={data} go={go} openTx={openTx} />;
      break;
    case "transactions":
      body = <TransactionsPage data={data} go={go} openTx={openTx} />;
      break;
    case "transactionDetail":
      body = <TransactionDetailPage data={data} id={current.params.id} back={back} onEdit={(t) => setTxModal({ tipe: t.tipe, editing: t })} />;
      break;
    case "budgets":
      body = <BudgetsPage data={data} mutate={mutate} />;
      break;
    case "goals":
      body = <GoalsPage data={data} go={go} mutate={mutate} />;
      break;
    case "goalDetail":
      body = <GoalDetailPage data={data} id={current.params.id} back={back} mutate={mutate} />;
      break;
    case "more":
      body = <MorePage go={go} data={data} />;
      break;
    case "accounts":
      body = <AccountsPage data={data} go={go} mutate={mutate} />;
      break;
    case "accountDetail":
      body = <AccountDetailPage data={data} id={current.params.id} go={go} back={back} mutate={mutate} />;
      break;
    case "categories":
      body = <CategoriesPage data={data} back={back} mutate={mutate} />;
      break;
    case "members":
      body = <MembersPage data={data} back={back} mutate={mutate} />;
      break;
    case "bills":
      body = <BillsPage data={data} go={go} mutate={mutate} />;
      break;
    case "billDetail":
      body = <BillDetailPage data={data} id={current.params.id} back={back} mutate={mutate} />;
      break;
    case "reports":
      body = <ReportsPage data={data} />;
      break;
    case "settings":
      body = <SettingsPage data={data} mutate={mutate} back={back} auth={auth} />;
      break;
    default:
      body = <Dashboard data={data} go={go} openTx={openTx} />;
  }

  const activeTab = stack[0].page;

  return (
    <Shell>
      {body}
      <div style={{ height: 110 }} />
      <BottomNav active={activeTab} onChange={goTab} onFabClick={() => setFabOpen(true)} />
      <FabSheet open={fabOpen} onPick={openTx} onClose={() => setFabOpen(false)} />
      {txModal && (
        <TransactionForm
          data={data}
          initialTipe={txModal.tipe}
          editing={txModal.editing}
          onSave={saveTx}
          onDelete={deleteTx}
          onClose={() => setTxModal(null)}
        />
      )}
    </Shell>
  );
}

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.kk-hide-scroll::-webkit-scrollbar{display:none}
.kk-hide-scroll{-ms-overflow-style:none;scrollbar-width:none}
@keyframes kkSheetUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
.kk-sheet{animation:kkSheetUp .22s ease-out}
button{font-family:inherit}
* { box-sizing: border-box; }
`;

/* ============================================================
   BOOTSTRAP (standalone, no build step)
   ============================================================ */
const rootEl = document.getElementById("root");
createRoot(rootEl).render(React.createElement(App));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      /* offline caching just won't be available; app still works online */
    });
  });
}
