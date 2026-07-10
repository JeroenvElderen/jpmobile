import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Filter,
  Folder,
  GripVertical,
  HelpCircle,
  MessageSquareText,
  MoreVertical,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Card } from "./card";

const faqStats = [
  { label: "Total Questions", value: "28", helper: "Across all categories", icon: MessageSquareText, iconClassName: "bg-[#f2eaff] text-[#5b2aa0]" },
  { label: "Published", value: "24", helper: "86% of total", icon: CheckCircle2, iconClassName: "bg-green-100 text-green-700" },
  { label: "Draft", value: "3", helper: "Not published", icon: Clock3, iconClassName: "bg-orange-100 text-orange-600" },
  { label: "Categories", value: "6", helper: "Active categories", icon: Folder, iconClassName: "bg-[#f2eaff] text-[#5b2aa0]" },
] as const;

const faqRows = [
  { question: "What services do you offer?", category: "Services", status: "Published", order: 1, updated: "May 25, 2024" },
  { question: "How do I book a service?", category: "Booking", status: "Published", order: 2, updated: "May 25, 2024" },
  { question: "What areas do you serve?", category: "General", status: "Published", order: 3, updated: "May 23, 2024" },
  { question: "How do you ensure my dog’s safety?", category: "Safety", status: "Published", order: 4, updated: "May 22, 2024" },
  { question: "What are your cancellation policies?", category: "Booking", status: "Published", order: 5, updated: "May 21, 2024" },
  { question: "Do you require meet and greets?", category: "General", status: "Draft", order: 6, updated: "May 20, 2024" },
  { question: "How long are dog walks?", category: "Services", status: "Published", order: 7, updated: "May 19, 2024" },
  { question: "Can I track my dog’s walk?", category: "General", status: "Published", order: 8, updated: "May 18, 2024" },
  { question: "What happens in bad weather?", category: "Safety", status: "Draft", order: 9, updated: "May 18, 2024" },
  { question: "How do payments work?", category: "Booking", status: "Published", order: 10, updated: "May 17, 2024" },
] as const;

const categories = [
  { label: "General", count: 8, dotClassName: "bg-cyan-500" },
  { label: "Booking", count: 6, dotClassName: "bg-blue-500" },
  { label: "Services", count: 5, dotClassName: "bg-[#6c38c2]" },
  { label: "Safety", count: 4, dotClassName: "bg-orange-500" },
  { label: "Payments", count: 3, dotClassName: "bg-green-500" },
  { label: "Other", count: 2, dotClassName: "bg-slate-400" },
] as const;

const categoryBadgeClassNames: Record<(typeof faqRows)[number]["category"], string> = {
  Booking: "bg-blue-100 text-blue-700",
  General: "bg-cyan-100 text-cyan-700",
  Safety: "bg-orange-100 text-orange-700",
  Services: "bg-[#eee7ff] text-[#5b2aa0]",
};

const quickTips = [
  { icon: MessageSquareText, copy: "Use clear and concise language for better understanding." },
  { icon: Folder, copy: "Organize FAQs into relevant categories." },
  { icon: RefreshCw, copy: "Update FAQs regularly to keep information current." },
  { icon: GripVertical, copy: "Drag and drop to reorder questions within a category." },
] as const;

export function BackendFAQ() {
  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-serif text-3xl">FAQ <PawPrint className="inline size-6 text-[#6c38c2]" /></h1>
          <p className="mt-1 text-sm text-[#6d667a]">Manage frequently asked questions and answers on your website.</p>
        </div>
        <button className="rounded-lg bg-[#4f2c91] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Plus className="mr-2 inline size-4" />Add New FAQ</button>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {faqStats.map(({ label, value, helper, icon: Icon, iconClassName }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center gap-6">
              <span className={`grid size-14 place-items-center rounded-full ${iconClassName}`}><Icon className="size-7" /></span>
              <div><p className="text-sm text-[#6d667a]">{label}</p><p className="mt-1 font-serif text-3xl">{value}</p><p className="mt-2 text-sm text-[#6d667a]">{helper}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-[#151124]/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3 text-sm text-[#858093] lg:max-w-xl"><Search className="size-5" /><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search FAQ by question or keyword..." /></label>
            <div className="flex flex-wrap gap-3"><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Categories <ChevronDown className="ml-8 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm">All Statuses <ChevronDown className="ml-8 inline size-4" /></button><button className="rounded-lg border border-[#151124]/10 px-5 py-3 text-sm"><Filter className="mr-2 inline size-4" />Filters</button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#fbf9fd] text-xs font-semibold text-[#4f2c91]"><tr>{["Question ↑", "Category", "Status", "Order", "Last Updated", "Actions"].map((heading) => <th key={heading} className="px-6 py-4">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#151124]/10">
                {faqRows.map((faq) => (
                  <tr key={faq.question} className="bg-white align-middle">
                    <td className="px-6 py-4 font-semibold">{faq.question}</td>
                    <td className="px-6 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${categoryBadgeClassNames[faq.category]}`}>{faq.category}</span></td>
                    <td className="px-6 py-4"><span className={`rounded-md px-3 py-1 text-xs font-medium ${faq.status === "Draft" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>{faq.status}</span></td>
                    <td className="px-6 py-4">{faq.order}</td>
                    <td className="px-6 py-4"><p>{faq.updated}</p><p className="mt-1 text-xs text-[#6d667a]">Jereen</p></td>
                    <td className="px-6 py-4"><div className="flex gap-3"><button aria-label={`Edit ${faq.question}`} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><Edit3 className="size-4" /></button><button aria-label={`More actions for ${faq.question}`} className="rounded-lg border border-[#151124]/10 p-2 text-[#4f4863]"><MoreVertical className="size-4" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 border-t border-[#151124]/10 p-5 text-sm text-[#6d667a] sm:flex-row sm:items-center sm:justify-between">
            <p>Showing 1 to 10 of 28 questions</p><div className="flex gap-2">{["‹", "1", "2", "3", "...", "3", "›"].map((page, index) => <button key={`${page}-${index}`} className={`grid size-9 place-items-center rounded-md border border-[#151124]/10 ${page === "1" ? "border-[#5b2aa0] text-[#5b2aa0]" : "text-[#4f4863]"}`}>{page}</button>)}</div>
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="font-serif text-lg"><HelpCircle className="mr-2 inline size-4 text-[#5b2aa0]" />Categories</h2>
            <p className="mt-1 text-sm text-[#6d667a]">Manage FAQ categories</p>
            <div className="mt-5 space-y-4">{categories.map((category) => <p key={category.label} className="flex items-center justify-between gap-4 text-sm"><span className="flex items-center gap-3"><span className={`size-2 rounded-full ${category.dotClassName}`} />{category.label}</span><span className="rounded-full bg-[#f0edf7] px-3 py-1 text-xs text-[#6d667a]">{category.count}</span></p>)}</div>
            <button className="mt-6 w-full rounded-lg border border-[#151124]/10 bg-[#fbf9fd] px-4 py-3 text-sm font-semibold text-[#5b2aa0]"><Plus className="mr-2 inline size-4" />Add Category</button>
          </Card>

          <Card className="p-5">
            <h2 className="font-serif text-lg text-[#4f4863]">💡 Quick Tips</h2>
            <div className="mt-5 space-y-5">{quickTips.map(({ icon: Icon, copy }) => <div key={copy} className="grid grid-cols-[2.5rem_1fr] gap-3 text-sm text-[#6d667a]"><span className="grid size-9 place-items-center rounded-full bg-[#f2eaff] text-[#5b2aa0]"><Icon className="size-4" /></span><p>{copy}</p></div>)}</div>
          </Card>
        </aside>
      </div>
    </div>
  );
}