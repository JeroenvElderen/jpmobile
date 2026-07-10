"use client";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Bell, CalendarDays, Check, ChevronDown, Clock3, Download, ExternalLink, FileText, Filter, Mail, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { usePortalDogImages } from "./use-portal-dog-images";
import { useSupabaseLiveQuery } from "./use-supabase-live-query";

type InvoiceStatus = "draft" | "sent" | "pending" | "paid" | "overdue" | "refunded";

type InvoiceLineItem = { description?: string; quantity?: number; unitAmountCents?: number; unit_amount_cents?: number };

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  dog_names: string[] | null;
  issued_on: string | null;
  due_on: string | null;
  service_period_start: string | null;
  service_period_end: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: InvoiceStatus | null;
  paid_on: string | null;
  payment_reference: string | null;
  notes: string | null;
  payment_url: string | null;
  line_items: InvoiceLineItem[] | null;
};

type PortalInvoice = {
  id: string;
  number: string;
  title: string;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  issuedOn: string | null;
  dueOn: string | null;
  date: string | null;
  location: string;
  status: InvoiceStatus;
  amountCents: number;
  currency: string;
  paymentNote: string;
  image: string | null;
  notes: string | null;
  paymentUrl: string | null;
  lineItems: Required<Pick<InvoiceLineItem, "description" | "quantity" | "unitAmountCents">>[];
};

const invoiceTabs = ["All", "Paid", "Outstanding", "Refunded"] as const;

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amountCents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "Date to confirm";
  return new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function getInvoiceStatus(invoice: PortalInvoice) {
  if (invoice.status === "paid") return "Paid";
  if (invoice.status === "refunded") return "Refunded";
  return "Outstanding";
}

function sanitizeInvoiceLineItems(items: InvoiceLineItem[] | null, fallbackTitle: string, fallbackAmountCents: number) {
  const lineItems = (items ?? []).flatMap((item) => {
    const description = item.description?.trim();
    const quantity = Number(item.quantity ?? 1);
    const unitAmountCents = Number(item.unitAmountCents ?? item.unit_amount_cents ?? 0);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitAmountCents) || unitAmountCents < 0) return [];
    return [{ description, quantity, unitAmountCents: Math.round(unitAmountCents) }];
  });

  return lineItems.length ? lineItems : [{ description: fallbackTitle, quantity: 1, unitAmountCents: fallbackAmountCents }];
}

function mapInvoiceRows(rows: unknown): PortalInvoice[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const invoice = row as InvoiceRow;
    const firstLine = invoice.line_items?.[0]?.description?.trim();
    const dogs = invoice.dog_names?.filter(Boolean).join(", ");
    const servicePeriod = [invoice.service_period_start, invoice.service_period_end].filter(Boolean).map(formatDate).join(" – ");
    const status = invoice.status || "pending";
    const dueNote = invoice.due_on ? `Due on ${formatDate(invoice.due_on)}` : "Due date to confirm";
    const amountCents = invoice.amount_cents ?? 0;
    const title = firstLine || (dogs ? `${dogs} care session` : "Care session");

    return {
      id: invoice.id,
      number: invoice.invoice_number || "Invoice pending",
      title,
      clientName: invoice.client_name || "Client",
      clientEmail: invoice.client_email,
      clientAddress: invoice.client_address,
      issuedOn: invoice.issued_on,
      dueOn: invoice.due_on,
      date: invoice.service_period_start || invoice.issued_on,
      location: servicePeriod || "Service period to confirm",
      status,
      amountCents,
      currency: invoice.currency || "EUR",
      paymentNote: status === "paid" ? `Paid on ${formatDate(invoice.paid_on || invoice.issued_on)}` : dueNote,
      image: null,
      notes: invoice.notes,
      paymentUrl: invoice.payment_url,
      lineItems: sanitizeInvoiceLineItems(invoice.line_items, title, amountCents),
    } satisfies PortalInvoice;
  });
}

function InvoicePanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#24163f]/10 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.08)] ${className}`}>{children}</section>;
}

function StatusBadge({ status }: { status: string }) {
  const isOutstanding = status === "Outstanding";
  const isRefunded = status === "Refunded";
  return <span className={`inline-flex rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] ${isOutstanding ? "bg-[#fff0cf] text-[#806013]" : isRefunded ? "bg-[#eee9e1] text-[#5f4d35]" : "bg-[#e9f4df] text-[#356d28]"}`}>{status}</span>;
}

type InvoiceTab = (typeof invoiceTabs)[number];
type InvoiceSort = "newest" | "oldest" | "amount-high" | "amount-low" | "status";

function invoiceDateValue(invoice: PortalInvoice) {
  return invoice.date ? new Date(invoice.date).getTime() || 0 : 0;
}

type PdfFont = { widthOfTextAtSize: (text: string, size: number) => number };

function truncatePdfText(text: string, font: PdfFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const ellipsis = "…";
  let next = text;
  while (next.length > 0 && font.widthOfTextAtSize(`${next}${ellipsis}`, size) > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}${ellipsis}`;
}

async function createInvoicePdf(invoice: PortalInvoice) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const black = rgb(0.07, 0.08, 0.1);
  const rule = rgb(0.07, 0.08, 0.1);
  const status = getInvoiceStatus(invoice);
  const paidAmount = status === "Paid" ? invoice.amountCents : 0;
  const balanceDue = Math.max(invoice.amountCents - paidAmount, 0);
  const drawText = (text: string, x: number, y: number, size = 10, font = regularFont, maxWidth?: number) => {
    page.drawText(maxWidth ? truncatePdfText(text, font, size, maxWidth) : text, { x, y, size, font, color: black });
  };
  const drawRightText = (text: string, rightX: number, y: number, size = 10, font = regularFont) => {
    page.drawText(text, { x: rightX - font.widthOfTextAtSize(text, size), y, size, font, color: black });
  };
  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 0.8) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: rule });
  };

  // Logo wordmark from the site header, matched to the provided invoice mockup.
  drawText("JEROEN & PAWS", 54, 785, 12, boldFont);
  drawText("Jeroen & Paws", 390, 780, 22, boldFont);

  const metaY = 725;
  [
    ["Invoice Number:", invoice.number],
    ["Issued on:", formatDate(invoice.issuedOn)],
    ["Due date:", formatDate(invoice.dueOn)],
    ["Date of sale / supply:", formatDate(invoice.date)],
    ["Payment method:", status === "Paid" ? "Marked as paid" : status === "Refunded" ? "Refunded" : "Online payment"],
  ].forEach(([label, value], index) => {
    const y = metaY - index * (index === 4 ? 30 : 16);
    drawText(label, 54, y, 9, boldFont);
    drawText(value, 142, y, 9, boldFont, 160);
  });

  drawText("Billed to", 54, 590, 13, boldFont);
  drawText(invoice.clientName, 54, 572, 9, boldFont, 190);
  if (invoice.clientEmail) drawText(invoice.clientEmail, 54, 556, 9, regularFont, 190);
  if (invoice.clientAddress) drawText(invoice.clientAddress, 54, 540, 9, regularFont, 190);

  drawText("From", 312, 590, 13, boldFont);
  drawText("JEROEN & PAWS", 312, 572, 9, boldFont);
  drawText("9 Rosslyn Grove, A98 H940, Bray, Ireland", 312, 556, 9, regularFont, 230);

  drawText("Your invoice from Jeroen & Paws", 54, 490, 9, boldFont);
  drawText("Items", 54, 450, 13, boldFont);

  const tableTop = 422;
  drawText("Name / description", 54, tableTop, 9, boldFont);
  drawText("Price", 265, tableTop, 9, boldFont);
  drawText("Quantity", 340, tableTop, 9, boldFont);
  drawText("Tax rate", 425, tableTop, 9, boldFont);
  drawText("Amount", 505, tableTop, 9, boldFont);
  drawLine(54, tableTop - 10, 540, tableTop - 10, 1.2);

  invoice.lineItems.slice(0, 10).forEach((item, index) => {
    const y = tableTop - 30 - index * 24;
    const amount = Math.round(item.quantity * item.unitAmountCents);
    drawText(item.description, 54, y, 9, boldFont, 185);
    drawRightText(formatMoney(item.unitAmountCents, invoice.currency), 300, y, 9, boldFont);
    drawRightText(String(item.quantity), 382, y, 9, boldFont);
    drawText("-", 456, y, 9, boldFont);
    drawRightText(formatMoney(amount, invoice.currency), 540, y, 9, boldFont);
    drawLine(54, y - 10, 540, y - 10, 0.6);
  });

  const totalsY = Math.max(160, tableTop - 60 - invoice.lineItems.slice(0, 10).length * 24);
  [
    ["Subtotal", invoice.amountCents],
    ["Total", invoice.amountCents],
    ["Amount paid", paidAmount],
    ["Balance Due", balanceDue],
  ].forEach(([label, amount], index) => {
    const y = totalsY - index * 24;
    drawText(String(label), 312, y, 9, boldFont);
    drawRightText(formatMoney(Number(amount), invoice.currency), 540, y, 9, boldFont);
    if (index === 0 || index === 2) drawLine(312, y - 10, 540, y - 10, 0.6);
  });

  return pdfDoc.save();
}

async function downloadInvoice(invoice: PortalInvoice) {
  let pdfBytes: Uint8Array;
  try {
  pdfBytes = await createInvoicePdf(invoice);
} catch (error) {
  console.error(error);
  throw error;
}
  const pdfBlobBytes = new Uint8Array(pdfBytes);
  const blob = new Blob([pdfBlobBytes.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.number.replace(/[^a-z0-9-]+/gi, "-") || "invoice"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function InvoiceActions({ invoice, onViewDetails, includeDetails = false, showViewFallback = true }: { invoice: PortalInvoice; onViewDetails: () => void; includeDetails?: boolean; showViewFallback?: boolean }) {
  const isOutstanding = getInvoiceStatus(invoice) === "Outstanding";
  const showPaymentLink = isOutstanding && Boolean(invoice.paymentUrl);

  return <div className="flex flex-wrap gap-3">{showPaymentLink ? <a href={invoice.paymentUrl ?? undefined} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded bg-[#4d2e91] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">Pay with Revolut <ExternalLink aria-hidden="true" className="size-4" /></a> : showViewFallback ? <button type="button" onClick={onViewDetails} className={`rounded px-5 py-3 text-xs font-black uppercase tracking-[0.14em] ${isOutstanding ? "bg-[#4d2e91] text-white" : "border border-[#4d2e91]/30 text-[#3f2581]"}`}>{isOutstanding ? "View & Pay" : "View invoice"}</button> : null}{includeDetails && showPaymentLink ? <button type="button" onClick={onViewDetails} className="rounded border border-[#4d2e91]/30 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#3f2581]">Details</button> : null}<button type="button" onClick={() => downloadInvoice(invoice)} aria-label={`Download ${invoice.title} invoice PDF`} className="inline-flex items-center justify-center gap-2 rounded border border-[#4d2e91]/30 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#3f2581]"><Download aria-hidden="true" className="size-4" />Download PDF</button></div>;
}

export function Invoices({ accessToken }: { accessToken?: string }) {
  const [activeTab, setActiveTab] = useState<InvoiceTab>("All");
  const [sortBy, setSortBy] = useState<InvoiceSort>("newest");
  const [selectedInvoice, setSelectedInvoice] = useState<PortalInvoice | null>(null);
  const fallbackInvoices = useMemo(() => [] as PortalInvoice[], []);
  const realtimeTables = useMemo(() => ["portal_invoices"], []);
  const { data: invoices, isLoading, error } = useSupabaseLiveQuery({
    accessToken,
    fallback: fallbackInvoices,
    path: "/rest/v1/portal_invoices?select=*&order=issued_on.desc&order=created_at.desc",
    realtimeTables,
    map: mapInvoiceRows,
  });
  const dogImages = usePortalDogImages(accessToken, Math.max(invoices.length + 2, 3));
  const visibleInvoices = useMemo(() => {
    const filtered = invoices.filter((invoice) => {
      const status = getInvoiceStatus(invoice);
      if (activeTab === "Paid") return status === "Paid";
      if (activeTab === "Outstanding") return status === "Outstanding";
      if (activeTab === "Refunded") return status === "Refunded";
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") return invoiceDateValue(a) - invoiceDateValue(b);
      if (sortBy === "amount-high") return b.amountCents - a.amountCents;
      if (sortBy === "amount-low") return a.amountCents - b.amountCents;
      if (sortBy === "status") return getInvoiceStatus(a).localeCompare(getInvoiceStatus(b)) || invoiceDateValue(b) - invoiceDateValue(a);
      return invoiceDateValue(b) - invoiceDateValue(a);
    });
  }, [activeTab, invoices, sortBy]);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid");
  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "refunded");
  const paidTotal = paidInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const latestPayment = paidInvoices[0];
  const currency = invoices[0]?.currency ?? "EUR";
  const overviewStats = [
    { icon: FileText, label: "Total Paid", value: formatMoney(paidTotal, currency), note: `Across ${paidInvoices.length} invoice${paidInvoices.length === 1 ? "" : "s"}`, tone: "bg-[#eadff4] text-[#4d2e91]" },
    { icon: Clock3, label: "Outstanding", value: formatMoney(outstandingTotal, currency), note: outstandingInvoices.length ? `${outstandingInvoices.length} awaiting payment` : "All caught up", tone: "bg-[#eee9e1] text-[#5f4d35]" },
    { icon: Check, label: "Paid Invoices", value: String(paidInvoices.length), note: "Thank you", tone: "bg-[#e7f1df] text-[#356d28]" },
    { icon: CalendarDays, label: "Last Payment", value: latestPayment ? formatMoney(latestPayment.amountCents, latestPayment.currency) : "—", note: latestPayment ? latestPayment.paymentNote.replace("Paid on ", "") : "No payments yet", tone: "bg-[#f0e8f8] text-[#4d2e91]" },
  ] as const;

  return (
    <div className="px-4 py-6 text-[#17132a] sm:px-8 lg:px-10 lg:py-10">
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4"><div><h1 className="font-serif text-4xl leading-tight text-[#241f30]">Invoices <FileText aria-hidden="true" className="inline size-6 text-[#4d2e91]" /></h1><p className="mt-3 text-sm text-[#17132a]">View invoices and payment statuses from your portal account.</p></div><div className="flex items-center gap-5"><button aria-label="Notifications" className="relative text-[#2f1b59]"><Bell className="size-6" /><span className="absolute -right-1 -top-2 grid size-5 place-items-center rounded-full bg-[#17132a] text-[0.65rem] font-black text-white">{outstandingInvoices.length}</span></button><div className="relative size-14 overflow-hidden rounded-full ring-2 ring-[#ead9b8]"><Image src={dogImages.getImage(0, invoices[0]?.image || "/images/dogs/ace.jpg") || "/images/dogs/ace.jpg"} alt="Client dog photo" fill sizes="56px" className="object-cover" /></div></div></header>
      <div className="mx-auto mt-8 max-w-6xl space-y-6">
        {(isLoading || error || invoices.length === 0) && <p className="rounded-xl border border-[#24163f]/10 bg-white px-5 py-4 text-sm text-[#665d70]">{isLoading ? "Loading your invoices…" : error ?? "No invoices have been added to your portal yet."}</p>}
        <InvoicePanel className="p-6 sm:p-8"><h2 className="font-serif text-2xl text-[#241f30]">Payment Overview</h2><div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{overviewStats.map(({ icon: Icon, label, value, note, tone }) => <article key={label} className="flex gap-4 xl:border-r xl:border-[#24163f]/10 xl:pr-6 xl:last:border-r-0"><span className={`grid size-14 shrink-0 place-items-center rounded-full ${tone}`}><Icon aria-hidden="true" className="size-6" /></span><div><p className="text-sm font-semibold text-[#3a3048]">{label}</p><p className="mt-3 font-serif text-2xl text-[#2f1b59]">{value}</p><p className="mt-3 text-sm text-[#665d70]">{note}</p></div></article>)}</div></InvoicePanel>
        <section className="rounded-xl border border-[#24163f]/10 bg-white p-5 shadow-[0_18px_55px_rgba(29,23,40,0.08)] sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-serif text-2xl text-[#241f30]">All Invoices</h2><div className="mt-5 flex flex-wrap gap-3 text-sm font-medium" role="tablist" aria-label="Invoice status filters">{invoiceTabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} key={tab} className={`${activeTab === tab ? "border-b-2 border-[#4d2e91] text-[#3f2581]" : "text-[#3a3048]"} px-1 pb-4`}>{tab}</button>)}</div></div><div className="flex flex-wrap gap-3 text-sm text-[#5f5769]"><button type="button" onClick={() => setActiveTab("All")} className="inline-flex items-center gap-2 rounded border border-[#24163f]/10 px-4 py-3 text-[#3f2581]"><Filter aria-hidden="true" className="size-4" />Portal invoices</button><label className="relative inline-flex items-center rounded border border-[#24163f]/10 px-4 py-3 pr-10">Sort by:<select value={sortBy} onChange={(event) => setSortBy(event.target.value as InvoiceSort)} className="ml-2 appearance-none bg-transparent font-bold text-[#241f30] outline-none"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="amount-high">Amount high to low</option><option value="amount-low">Amount low to high</option><option value="status">Status</option></select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 size-4 text-[#3f2581]" /></label></div></div>
          <div className="mt-5 space-y-3">{visibleInvoices.map((invoice, index) => { const displayStatus = getInvoiceStatus(invoice); const isOutstanding = displayStatus === "Outstanding"; return <article key={invoice.id} className="grid gap-5 rounded-lg border border-[#24163f]/10 p-3 shadow-[0_8px_24px_rgba(29,23,40,0.04)] lg:grid-cols-[11rem_1fr_auto] lg:items-center"><div className="relative h-40 overflow-hidden rounded-lg lg:h-36"><Image src={dogImages.getImage(index + 1, invoice.image || "/images/dogs/ace.jpg") || "/images/dogs/ace.jpg"} alt={`${invoice.title} invoice session`} fill sizes="176px" className="object-cover" /></div><div className="px-1 py-1 lg:px-0"><h3 className="font-serif text-xl text-[#25203d]">{invoice.title}</h3><p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#3a3048]"><CalendarDays aria-hidden="true" className="size-4 text-[#6d4b9b]" /><span>{formatDate(invoice.date)}</span><span aria-hidden="true">-</span><span>{invoice.location}</span></p><div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#3a3048]"><span>Invoice #{invoice.number}</span><span className="rounded-full bg-[#f0e8f8] px-3 py-1 text-[0.65rem] font-bold text-[#4d2e91]">Portal invoice</span></div></div><div className="flex flex-col gap-4 border-t border-[#24163f]/10 pt-4 lg:min-w-52 lg:border-t-0 lg:pt-0"><div><StatusBadge status={displayStatus} /><p className="mt-4 text-xl font-semibold text-[#17132a]">{formatMoney(invoice.amountCents, invoice.currency)}</p><p className="mt-2 text-sm text-[#665d70]">{invoice.paymentNote}</p></div><InvoiceActions invoice={invoice} onViewDetails={() => setSelectedInvoice(invoice)} includeDetails />{isOutstanding && !invoice.paymentUrl ? <p className="text-xs font-semibold text-[#806013]">Revolut payment link coming soon.</p> : null}</div></article>; })}</div>{!visibleInvoices.length ? <p className="mt-5 rounded-lg bg-[#fbf8ff] px-4 py-3 text-sm text-[#665d70]">No {activeTab.toLowerCase()} invoices found.</p> : null}</section>
        {selectedInvoice ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#17132a]/50 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#5b2aa0]">Invoice #{selectedInvoice.number}</p><h2 className="mt-2 font-serif text-2xl text-[#241f30]">{selectedInvoice.title}</h2></div><button type="button" onClick={() => setSelectedInvoice(null)} className="rounded-full border border-[#24163f]/10 px-3 py-1 text-sm">Close</button></div><div className="mt-5 space-y-3 text-sm text-[#3a3048]"><p><strong>Status:</strong> {getInvoiceStatus(selectedInvoice)}</p><p><strong>Date:</strong> {formatDate(selectedInvoice.date)}</p><p><strong>Service period:</strong> {selectedInvoice.location}</p><p><strong>Amount:</strong> {formatMoney(selectedInvoice.amountCents, selectedInvoice.currency)}</p><p><strong>Payment:</strong> {selectedInvoice.paymentNote}</p>{selectedInvoice.notes ? <p><strong>Notes:</strong> {selectedInvoice.notes}</p> : null}</div><div className="mt-6"><InvoiceActions invoice={selectedInvoice} onViewDetails={() => undefined} showViewFallback={false} /></div></div></div> : null}
        <section className="flex flex-col gap-5 rounded-xl bg-[#f4eef8] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex gap-5"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#4d2e91] text-white"><Mail aria-hidden="true" className="size-6" /></span><div><h2 className="font-serif text-xl text-[#241f30]">Prefer email invoices?</h2><p className="mt-2 text-sm text-[#5f5769]">We can send all future invoices directly to your inbox.</p></div></div><button type="button" className="rounded border border-[#4d2e91]/30 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#3f2581]">Update preferences</button></section>
        <section className="grid gap-5 rounded-xl border border-[#24163f]/10 bg-white p-6 shadow-[0_18px_55px_rgba(29,23,40,0.08)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7"><div className="relative size-20 overflow-hidden rounded-full ring-2 ring-[#ead9b8]"><Image src={dogImages.getImage(invoices.length + 1, "/images/dogs/melakta.jpeg") || "/images/dogs/melakta.jpeg"} alt="Your dog" fill sizes="80px" className="object-cover" /></div><div><h2 className="font-serif text-xl text-[#241f30]">Have a question about an invoice?</h2><p className="mt-2 text-sm text-[#5f5769]">I&apos;m happy to help.</p><p className="mt-2 font-serif text-xl text-[#3f2581]">Jeroen <PawPrint aria-hidden="true" className="inline size-4" /></p></div><Link href="/contact" className="inline-flex items-center justify-center gap-3 rounded bg-[#4d2e91] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">Send me a message <PawPrint aria-hidden="true" className="size-4" /></Link></section>
      </div>
    </div>
  );
}
