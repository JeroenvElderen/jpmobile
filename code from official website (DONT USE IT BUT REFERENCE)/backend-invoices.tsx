import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  PawPrint,
  Plus,
  Search,
  X,
  Clock3,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { useSupabaseLiveQuery } from "@/components/portal/use-supabase-live-query";
import { buildInvoiceWhatsappMessage } from "@/utils/invoice-payment";
import { getWhatsappClickToChatUrl } from "@/utils/chat-links";

import { Card } from "./card";

type BackendInvoice = {
  id: string;
  number: string;
  client: string;
  email: string;
  address?: string;
  dogs: string;
  issuedOn: string | null;
  dueOn: string | null;
  servicePeriodStart?: string | null;
  servicePeriodEnd?: string | null;
  amountCents: number;
  currency: string;
  status: "draft" | "sent" | "pending" | "paid" | "overdue" | "refunded";
  paidOn: string | null;
  revolutTransactionId: string | null;
  paymentReference: string | null;
  paymentTitle?: string | null;
  paymentUrl?: string | null;
  revolutOrderId?: string | null;
  phone?: string;
  serviceName?: string;
  durationMinutes?: number | null;
  billingDays?: number | null;
  isClientLinked?: boolean;
  lineItems?: Array<{ description: string; quantity: number; unitAmountCents: number }>;
  notes?: string | null;
};

type InvoicesResponse = {
  invoices: BackendInvoice[];
  isFallback: boolean;
};

type BackendClientOption = {
  id: string;
  name: string;
  email: string;
  address: string;
  dogNames: string;
  phone: string;
};

type ClientsResponse = {
  clients?: BackendClientOption[];
};

type DraftLineItem = {
  description: string;
  quantity: string;
  unitAmount: string;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" }).format(new Date(value));
}

function displayStatus(status: BackendInvoice["status"]) {
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  if (status === "refunded") return "Refunded";
  if (status === "draft") return "Draft";
  return "Pending";
}

const toneClasses = {
  purple: "bg-[#efe8ff] text-[#5b2aa0]",
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-rose-100 text-rose-600",
};

function StatusPill({ status }: { status: string }) {
  const styles = status === "Paid" ? "bg-green-100 text-green-700" : status === "Pending" ? "bg-orange-100 text-orange-700" : status === "Draft" ? "bg-slate-100 text-slate-700" : "bg-rose-100 text-rose-700";
  return <span className={`rounded-md px-3 py-1 text-xs font-semibold ${styles}`}>{status}</span>;
}

export function BackendInvoices({ accessToken }: { accessToken?: string }) {
  const [isFallback, setIsFallback] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<BackendClientOption[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [dogNames, setDogNames] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [billingDays, setBillingDays] = useState("1");
  const [draftLineItems, setDraftLineItems] = useState<DraftLineItem[]>([{ description: "", quantity: "1", unitAmount: "" }]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"all" | "overdue" | "pending" | "paid">("all");
  const [invoiceWeekFilter, setInvoiceWeekFilter] = useState("all");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const fallback = useMemo<BackendInvoice[]>(() => [], []);
  const realtimeTables = useMemo(() => ["portal_invoices"], []);
  const noopMap = useCallback(() => [], []);
  const loadInvoices = useCallback(async () => {
    const response = await fetch("/api/invoices", { cache: "no-store", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
    const payload = (await response.json()) as InvoicesResponse;
    setIsFallback(payload.isFallback);
    return payload.invoices;
  }, [accessToken]);
  const { data: invoices, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback,
    path: "/api/invoices",
    realtimeTables,
    map: noopMap,
    load: loadInvoices,
  });

  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;

    async function loadClients() {
      try {
        const response = await fetch("/api/clients", { cache: "no-store", headers: { Authorization: `Bearer ${accessToken}` } });
        if (!response.ok) return;
        const payload = (await response.json()) as ClientsResponse;
        if (isMounted) setClientOptions(payload.clients ?? []);
      } catch {
        if (isMounted) setClientOptions([]);
      }
    }

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  function applyClientOption(name: string) {
    setClientName(name);
    const normalizedName = name.trim().toLowerCase();
    const match = clientOptions.find((client) => client.name.toLowerCase() === normalizedName) ?? clientOptions.find((client) => client.name.toLowerCase().startsWith(normalizedName));

    if (!match || !normalizedName) return;

    setClientEmail(match.email === "No email saved" ? "" : match.email);
    setClientAddress(match.address === "No address saved" ? "" : match.address);
    setClientPhone(match.phone === "No phone saved" ? "" : match.phone);
    setDogNames(match.dogNames === "No dogs linked" ? "" : match.dogNames);
  }

  function updateDraftLineItem(index: number, field: keyof DraftLineItem, value: string) {
    setDraftLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function addDraftLineItem() {
    setDraftLineItems((items) => [...items, { description: "", quantity: "1", unitAmount: "" }]);
  }

  function removeDraftLineItem(index: number) {
    setDraftLineItems((items) => items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index));
  }

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending" || invoice.status === "sent");
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue");
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const paidAmount = paidInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const pendingAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const currency = invoices[0]?.currency ?? "EUR";
  const weekOptions = Array.from(new Set(invoices.map((invoice) => invoice.issuedOn?.slice(0, 10)).filter(Boolean) as string[]));
  const filteredInvoices = invoices.filter((invoice) => {
    const needle = invoiceQuery.trim().toLowerCase();
    const statusGroup = invoice.status === "overdue" ? "overdue" : invoice.status === "paid" ? "paid" : "pending";
    const matchesSearch = !needle || [invoice.number, invoice.client, invoice.email, invoice.dogs].some((value) => value.toLowerCase().includes(needle));
    const matchesStatus = invoiceStatusFilter === "all" || statusGroup === invoiceStatusFilter;
    const matchesWeek = invoiceWeekFilter === "all" || invoice.issuedOn?.slice(0, 10) === invoiceWeekFilter;
    return matchesSearch && matchesStatus && matchesWeek;
  });
  const latestInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0];
  const invoiceStats = [
    { label: "Total Invoices", value: invoices.length.toString(), helper: `${formatMoney(totalAmount, currency)} billed`, tone: "purple", icon: FileText },
    { label: "Paid Invoices", value: paidInvoices.length.toString(), helper: `${formatMoney(paidAmount, currency)} collected`, tone: "green", icon: Check },
    { label: "Pending Invoices", value: pendingInvoices.length.toString(), helper: `${formatMoney(pendingAmount, currency)} pending`, tone: "orange", icon: Clock3 },
    { label: "Overdue Invoices", value: overdueInvoices.length.toString(), helper: `${formatMoney(overdueAmount, currency)} overdue`, tone: "red", icon: X },
  ] as const;

  function getInvoiceWhatsappUrl(invoice: BackendInvoice) {
    if (!invoice.phone || !invoice.paymentUrl) return null;
    const amount = formatMoney(invoice.amountCents, invoice.currency);
    const message = buildInvoiceWhatsappMessage({
      clientName: invoice.client,
      invoiceNumber: invoice.number,
      amount,
      paymentTitle: invoice.paymentTitle || invoice.number,
      paymentUrl: invoice.paymentUrl,
      dogNames: invoice.dogs,
    });

    return getWhatsappClickToChatUrl(invoice.phone, message);
  }

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateMessage(null);
    const form = new FormData(event.currentTarget);
    const lineItems = draftLineItems.map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity || 1),
      unitAmountCents: Math.round(Number(item.unitAmount || 0) * 100),
    })).filter((item) => item.description && item.quantity > 0 && item.unitAmountCents >= 0);
    const payload = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientAddress: clientAddress.trim(),
      clientPhone: clientPhone.trim(),
      serviceName: serviceName.trim(),
      durationMinutes: Number(durationMinutes || 0) || null,
      billingDays: Number(billingDays || 0) || null,
      dogNames: dogNames.split(",").map((name) => name.trim()).filter(Boolean),
      issuedOn: String(form.get("issuedOn") || ""),
      dueOn: String(form.get("dueOn") || ""),
      currency: String(form.get("currency") || "EUR"),
      notes: String(form.get("notes") || ""),
      status: "draft",
      lineItems,
    };

    try {
      const response = await fetch(editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : "/api/invoices", {
        method: editingInvoiceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { invoice?: BackendInvoice; clientMatched?: boolean; error?: string; revolut?: { createsRevolutCheckout?: boolean; message?: string } };
      if (!response.ok) throw new Error(result.error || "Invoice creation failed.");
      setCreateMessage([
        editingInvoiceId ? `Updated ${result.invoice?.number ?? "invoice"}.` : `Saved ${result.invoice?.number ?? "invoice"} as a draft.`,
        "Use the three-dot menu to edit, delete, or send it on WhatsApp when ready.",
        result.clientMatched ? "Linked to an existing client." : "Saved without a client link until a matching client exists.",
      ].filter(Boolean).join(" "));
      setDraftLineItems([{ description: "", quantity: "1", unitAmount: "" }]);
      setEditingInvoiceId(null);
      setShowCreateForm(false);
      await loadInvoices();
    } catch (createError) {
      setCreateMessage(createError instanceof Error ? createError.message : "Invoice creation failed.");
    } finally {
      setIsCreating(false);
    }
  }

  async function syncRevolutPayments() {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const response = await fetch("/api/invoices/sync", { method: "POST", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
      const payload = (await response.json()) as { matched?: number; scanned?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Revolut sync failed.");
      setSyncMessage(`Revolut sync complete: matched ${payload.matched ?? 0} invoice payment(s) from ${payload.scanned ?? 0} transaction(s).`);
    } catch (syncError) {
      setSyncMessage(syncError instanceof Error ? syncError.message : "Revolut sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }
  function editInvoice(invoice: BackendInvoice) {
    setEditingInvoiceId(invoice.id);
    setClientName(invoice.client === "Unmatched client" ? "" : invoice.client);
    setClientEmail(invoice.email);
    setClientAddress(invoice.address || "");
    setClientPhone(invoice.phone || "");
    setDogNames(invoice.dogs === "—" ? "" : invoice.dogs);
    setServiceName(invoice.serviceName || "");
    setDurationMinutes(invoice.durationMinutes ? String(invoice.durationMinutes) : "");
    setBillingDays(invoice.billingDays ? String(invoice.billingDays) : "");
    setDraftLineItems(invoice.lineItems?.length ? invoice.lineItems.map((item) => ({ description: item.description, quantity: String(item.quantity), unitAmount: String(item.unitAmountCents / 100) })) : [{ description: "", quantity: "1", unitAmount: "" }]);
    setShowCreateForm(true);
    setOpenActionId(null);
  }

  async function sendInvoice(invoice: BackendInvoice) {
    setOpenActionId(null);
    setCreateMessage(`Creating payment link for ${invoice.number}…`);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ action: "send" }),
      });
      const result = (await response.json()) as { invoice?: BackendInvoice; error?: string };
      if (!response.ok || !result.invoice) throw new Error(result.error || "Invoice send failed.");
      const invoiceWhatsappUrl = getInvoiceWhatsappUrl(result.invoice);
      if (!invoiceWhatsappUrl) throw new Error("Payment link was created, but this invoice has no client WhatsApp phone.");
      window.open(invoiceWhatsappUrl, "_blank", "noopener,noreferrer");
      setCreateMessage(`Created payment link for ${result.invoice.number} and opened WhatsApp.`);
      await loadInvoices();
    } catch (sendError) {
      setCreateMessage(sendError instanceof Error ? sendError.message : "Invoice send failed.");
    }
  }

  async function deleteInvoice(invoice: BackendInvoice) {
    setOpenActionId(null);
    setCreateMessage(`Deleting ${invoice.number}…`);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Invoice delete failed.");
      setCreateMessage(`Deleted ${invoice.number}.`);
      await loadInvoices();
    } catch (deleteError) {
      setCreateMessage(deleteError instanceof Error ? deleteError.message : "Invoice delete failed.");
    }
  }

  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-serif text-3xl">Invoices <PawPrint className="inline size-6 text-[#6c38c2]" /></h1>
          <p className="mt-1 text-sm text-[#6d667a]">Website invoices with Revolut bank payment reconciliation.</p>
        </div>
        <div className="flex flex-wrap gap-3"><button type="button" onClick={syncRevolutPayments} disabled={isSyncing} className="rounded-lg border border-[#4f2c91]/20 bg-white px-6 py-3 text-sm font-semibold text-[#4f2c91] disabled:opacity-60"><Clock3 className="mr-2 inline size-4" />{isSyncing ? "Syncing Revolut…" : "Sync Revolut"}</button><button type="button" onClick={() => setShowCreateForm((value) => !value)} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Create Invoice <ChevronDown className="ml-8 inline size-4" /></button></div>
      </div>

      {(isLoading || isFallback || error || syncMessage || createMessage) && <p className="mt-5 rounded-xl border border-[#151124]/10 bg-white px-5 py-4 text-sm text-[#6d667a]">{isLoading ? "Loading live invoices…" : createMessage || syncMessage || error || "Showing no invoices until Supabase is connected and portal_invoices exists."}</p>}

      {showCreateForm && (
        <Card className="mt-6 p-5">
          <form onSubmit={createInvoice} className="grid gap-4 lg:grid-cols-4">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-xl">{editingInvoiceId ? "Edit draft invoice" : "Create draft invoice"}</h2>
              <p className="mt-1 text-sm text-[#6d667a]">Invoice data stays in the website first. If the client email or name already exists, the invoice links automatically; otherwise it remains unmatched until a client is added later. When the Merchant API key is configured, this also creates a Revolut checkout link that can be sent to the client by WhatsApp.</p>
            </div>
            <input name="clientName" list="invoice-client-options" value={clientName} onChange={(event) => applyClientOption(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Start typing client name" />
            <datalist id="invoice-client-options">{clientOptions.map((client) => <option key={client.id} value={client.name} />)}</datalist>
            <input name="clientEmail" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Client email" />
            <input name="clientPhone" value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Client WhatsApp phone" />
            <input name="dogNames" value={dogNames} onChange={(event) => setDogNames(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Dog names, comma separated" />
            <input name="serviceName" value={serviceName} onChange={(event) => setServiceName(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Service, e.g. Walk, Boarding, Day care" />
            <input name="durationMinutes" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} type="number" min="0" step="30" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Minutes (skip for boarding/day care)" />
            <input name="billingDays" value={billingDays} onChange={(event) => setBillingDays(event.target.value)} type="number" min="1" step="1" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Days this week" />
            <input name="clientAddress" value={clientAddress} onChange={(event) => setClientAddress(event.target.value)} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Billing address" />
            <input name="currency" defaultValue="EUR" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Currency" />
            <input name="issuedOn" type="date" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" aria-label="Issued on" />
            <input name="dueOn" type="date" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" aria-label="Due date" />
            <div className="space-y-3 lg:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#151124]">Invoice lines</h3>
                <button type="button" onClick={addDraftLineItem} className="rounded-lg border border-[#4f2c91]/20 px-4 py-2 text-sm font-semibold text-[#4f2c91]">Add line</button>
              </div>
              {draftLineItems.map((item, index) => (
                <div key={index} className="grid gap-3 lg:grid-cols-[1fr_8rem_10rem_auto]">
                  <textarea value={item.description} onChange={(event) => updateDraftLineItem(index, "description", event.target.value)} className="min-h-20 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Line description (you can use multiple lines)" required />
                  <input value={item.quantity} onChange={(event) => updateDraftLineItem(index, "quantity", event.target.value)} type="number" min="0.01" step="0.01" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Qty" required />
                  <input value={item.unitAmount} onChange={(event) => updateDraftLineItem(index, "unitAmount", event.target.value)} type="number" min="0" step="0.01" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm" placeholder="Price" required />
                  <button type="button" onClick={() => removeDraftLineItem(index)} disabled={draftLineItems.length === 1} className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm disabled:opacity-40">Remove</button>
                </div>
              ))}
            </div>
            <textarea name="notes" className="rounded-lg border border-[#151124]/10 px-4 py-3 text-sm lg:col-span-4" placeholder="Notes shown in backend" />
            <button disabled={isCreating} className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 lg:col-span-2">{isCreating ? "Saving…" : editingInvoiceId ? "Save invoice changes" : "Save draft invoice"}</button>
            <button type="button" onClick={() => { setShowCreateForm(false); setEditingInvoiceId(null); }} className="rounded-lg border border-[#151124]/10 px-6 py-3 text-sm lg:col-span-2">Cancel</button>
          </form>
        </Card>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {invoiceStats.map(({ label, value, helper, tone, icon: Icon }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center gap-6"><span className={`grid size-14 place-items-center rounded-full ${toneClasses[tone]}`}><Icon className="size-7" /></span><div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p><p className={`mt-2 text-sm ${tone === "purple" || tone === "green" ? "text-green-700" : tone === "orange" ? "text-orange-600" : "text-rose-600"}`}>{tone === "purple" && "↑ "}{helper}</p></div></div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 2xl:grid-cols-[1fr_20rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] xl:max-w-lg"><Search className="size-5" /><input value={invoiceQuery} onChange={(event) => setInvoiceQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search invoices by number, client or dog..." /></label>
            <div className="flex flex-wrap gap-3"><label className="relative"><select value={invoiceStatusFilter} onChange={(event) => setInvoiceStatusFilter(event.target.value as "all" | "overdue" | "pending" | "paid")} className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 text-sm"><option value="all">All Statuses</option><option value="overdue">Overdue</option><option value="pending">Pending</option><option value="paid">Paid</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" /></label><label className="relative"><select value={invoiceWeekFilter} onChange={(event) => setInvoiceWeekFilter(event.target.value)} className="appearance-none rounded-lg border border-[#151124]/10 bg-white px-5 py-3 pr-10 text-sm"><option value="all">All weeks</option>{weekOptions.map((week) => <option key={week} value={week}>{formatDate(week)}</option>)}</select><CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" /></label><button onClick={() => { setInvoiceQuery(""); setInvoiceStatusFilter("all"); setInvoiceWeekFilter("all"); }} className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Reset</button></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1030px] text-left text-sm"><thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Invoice # ↕", "Client", "Dog(s)", "Date", "Due Date", "Amount", "Status", "Actions"].map((h)=><th key={h} className="px-6 py-4">{h}</th>)}</tr></thead><tbody className="divide-y divide-[#151124]/10">{filteredInvoices.map((invoice)=><tr key={invoice.id} onClick={() => setSelectedInvoiceId(invoice.id)} className={`cursor-pointer ${latestInvoice?.id === invoice.id ? "bg-[#f6f0ff]" : "bg-white hover:bg-[#fbf9fd]"}`}><td className="px-6 py-4"><p className="font-semibold">{invoice.number}</p><p className="mt-1 text-[#6d667a]">Ref: {invoice.paymentReference || invoice.number}</p></td><td className="px-6 py-4"><div className="flex items-center gap-4"><div className="grid size-11 place-items-center rounded-full bg-[#efe8ff] font-serif text-[#4f2c91]">{invoice.client.charAt(0)}</div><div><p className="font-semibold">{invoice.client}</p><p className="mt-1 text-xs text-[#6d667a]">{invoice.email || "No email"}</p><p className="mt-1 text-xs text-[#6d667a]">{invoice.isClientLinked ? "Linked client" : "Unmatched invoice"}</p></div></div></td><td className="px-6 py-4"><div className="flex items-center gap-3"><PawPrint className="size-5 text-[#4f2c91]" />{invoice.dogs}</div></td><td className="px-6 py-4">{formatDate(invoice.issuedOn)}</td><td className="px-6 py-4">{formatDate(invoice.dueOn)}</td><td className="px-6 py-4 font-semibold">{formatMoney(invoice.amountCents, invoice.currency)}</td><td className="px-6 py-4"><StatusPill status={displayStatus(invoice.status)} /></td><td className="px-6 py-4"><div className="flex gap-3"><button onClick={(event) => { event.stopPropagation(); setSelectedInvoiceId(invoice.id); }} aria-label={`View ${invoice.number}`} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f2c91]"><Eye className="size-5" /></button><button aria-label={`Actions for ${invoice.number}`} onClick={(event) => { event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setActionMenuPosition({ top: Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 148)), left: Math.max(12, Math.min(rect.right - 176, window.innerWidth - 188)) }); setOpenActionId((current) => current === invoice.id ? null : invoice.id); }} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-5" /></button>{openActionId === invoice.id && actionMenuPosition && <div style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }} className="fixed z-50 w-44 rounded-xl border border-[#151124]/10 bg-white p-2 shadow-2xl"><button onClick={(event) => { event.stopPropagation(); editInvoice(invoice); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Edit</button><button onClick={(event) => { event.stopPropagation(); sendInvoice(invoice); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#fbf9fd]">Send on WhatsApp</button><button onClick={(event) => { event.stopPropagation(); deleteInvoice(invoice); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Delete</button></div>}</div></td></tr>)}</tbody></table></div>
          <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between"><p>Showing {filteredInvoices.length ? `1 to ${filteredInvoices.length} of ${invoices.length}` : "0"} invoices</p>{invoices.length >= 10 && <div className="flex gap-2">{["‹", "1", "2", "3", "...", "16", "›"].map((p)=><button key={p} className={`grid size-9 place-items-center rounded-md border border-[#151124]/10 ${p === "1" ? "border-[#5b2aa0] text-[#5b2aa0]" : "text-[#4f4863]"}`}>{p}</button>)}</div>}</div>
        </Card>

        <aside className="space-y-5">
          <Card className="p-5"><h2 className="font-serif text-xl">Invoice Summary</h2><div className="mt-6 flex items-center gap-5"><div className="grid size-28 place-items-center rounded-full bg-[#f0e9fb]"><div className="grid size-16 place-items-center rounded-full bg-white text-center text-xs"><span>Total<br /><strong>{formatMoney(totalAmount, currency)}</strong></span></div></div><div className="space-y-3 text-xs"><p><span className="mr-2 inline-block size-2 rounded-full bg-rose-500" />Overdue<br /><span className="text-[#6d667a]">{formatMoney(overdueAmount, currency)}</span></p><p><span className="mr-2 inline-block size-2 rounded-full bg-orange-500" />Pending<br /><span className="text-[#6d667a]">{formatMoney(pendingAmount, currency)}</span></p><p><span className="mr-2 inline-block size-2 rounded-full bg-green-500" />Paid<br /><span className="text-[#6d667a]">{formatMoney(paidAmount, currency)}</span></p></div></div></Card>
          <Card className="p-5"><h2 className="font-serif text-xl">Invoice Details</h2><div className="mt-5 flex items-center justify-between"><p className="font-serif text-xl">{latestInvoice?.number ?? "No invoice"}</p><StatusPill status={latestInvoice ? displayStatus(latestInvoice.status) : "Pending"} /></div><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-[#6d667a]">Issued On</dt><dd>{formatDate(latestInvoice?.issuedOn ?? null)}</dd></div><div className="flex justify-between"><dt className="text-[#6d667a]">Due Date</dt><dd>{formatDate(latestInvoice?.dueOn ?? null)}</dd></div><div className="flex justify-between"><dt className="text-[#6d667a]">Amount</dt><dd>{latestInvoice ? formatMoney(latestInvoice.amountCents, latestInvoice.currency) : "—"}</dd></div><div className="flex justify-between"><dt className="text-[#6d667a]">Paid On</dt><dd>{formatDate(latestInvoice?.paidOn ?? null)}</dd></div><div className="flex justify-between"><dt className="text-[#6d667a]">Payment Method</dt><dd>{latestInvoice?.revolutTransactionId ? "Revolut bank transfer" : latestInvoice?.paymentUrl ? "Revolut checkout link" : "Awaiting Revolut link"}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#6d667a]">Payment title</dt><dd className="text-right">{latestInvoice?.paymentTitle || "—"}</dd></div></dl><button className="mt-5 w-full rounded-lg border border-[#5b2aa0]/15 bg-[#f4efff] px-4 py-3 text-sm font-semibold text-[#5b2aa0]"><Download className="mr-2 inline size-4" />Download PDF</button></Card>
          <Card className="p-5"><h2 className="font-serif text-lg">Client</h2><div className="mt-4"><p className="font-semibold">{latestInvoice?.client ?? "No client"}</p><p className="text-xs text-[#6d667a]">{latestInvoice?.email || "No email"}<br />{latestInvoice?.address || "No address"}</p></div></Card>
          <Card className="p-5"><h2 className="font-serif text-lg">Dog(s)</h2><div className="mt-4 flex items-center gap-3"><PawPrint className="size-5 text-[#4f2c91]" /><div><p className="font-semibold">{latestInvoice?.dogs ?? "No dogs"}</p><p className="text-xs text-[#6d667a]">From selected invoice</p></div></div></Card>
        </aside>
      </div>
    </div>
  );
}