import {
  Cloud,
  Download,
  PawPrint,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { Card } from "./card";

const tabs = ["Business Profile", "General", "Booking Settings", "Notifications", "Payments", "Email Templates", "Integrations", "Users & Permissions"] as const;

const hours = [
  ["Monday", "08:00 AM", "06:00 PM", true, true],
  ["Tuesday", "08:00 AM", "06:00 PM", true, true],
  ["Wednesday", "08:00 AM", "06:00 PM", true, false],
  ["Thursday", "08:00 AM", "06:00 PM", true, false],
  ["Friday", "08:00 AM", "05:00 PM", true, true],
  ["Saturday", "09:00 AM", "01:00 PM", true, true],
  ["Sunday", "Closed", "", false, false],
] as const;

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium text-[#4f4863]">{label}</span>
      <input className="w-full rounded-lg border border-[#151124]/10 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#5b2aa0]" defaultValue={value} />
    </label>
  );
}

function SelectLike({ value }: { value: string }) {
  return <button className="w-full rounded-lg border border-[#151124]/10 bg-white px-4 py-3 text-left text-sm shadow-sm">{value}<span className="float-right text-[#6d667a]">⌄</span></button>;
}

function Toggle({ enabled }: { enabled: boolean }) {
  return <span className={`inline-flex h-6 w-11 items-center rounded-full p-1 ${enabled ? "bg-[#5130a1]" : "bg-[#c7c2d0]"}`}><span className={`size-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span>;
}

export function BackendSettings() {
  return (
    <div className="p-5 md:p-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-serif text-3xl">Settings <PawPrint className="inline size-6 text-[#6c38c2]" /></h1>
          <p className="mt-1 text-sm text-[#6d667a]">Manage your business settings and preferences.</p>
        </div>
        <button className="rounded-lg bg-[#4f2c91] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f2c91]/25"><Save className="mr-2 inline size-4" />Save Changes</button>
      </div>

      <div className="mt-8 overflow-x-auto border-b border-[#151124]/10">
        <div className="flex min-w-max gap-8 px-1">
          {tabs.map((tab) => <button key={tab} className={`pb-4 text-sm font-medium ${tab === "Business Profile" ? "border-b-2 border-[#5b2aa0] text-[#4f2c91]" : "text-[#4f4863]"}`}>{tab}</button>)}
        </div>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card className="overflow-hidden">
          <section className="p-6">
            <h2 className="font-serif text-xl">Business Information</h2>
            <p className="mt-1 text-sm text-[#6d667a]">Update your business details and contact information.</p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[16rem_1fr]">
              <div>
                <div className="grid aspect-square place-items-center rounded-lg border border-[#151124]/10 bg-[#f7f2fb] text-center font-serif text-3xl leading-snug text-[#21172f] shadow-inner">Jereen<br />And Paws <PawPrint className="inline size-5 text-[#6c38c2]" /></div>
                <div className="mt-4 flex gap-3"><button className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700"><Upload className="mr-1 inline size-3" />Change Logo</button><button className="rounded-lg bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">Remove</button></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business Name" value="Jereen And Paws" />
                <Field label="Tagline" value="Happy Paws, Happy Hearts" />
                <Field label="Email" value="jereenandpaws@gmail.com" />
                <Field label="Phone" value="🇮🇪  +353 87 123 4567" />
                <Field label="Address" value="123 Greenfield Road, Dublin 6, Ireland" />
                <Field label="Website" value="https://jereenandpaws.com" />
              </div>
            </div>
          </section>

          <section className="border-t border-[#151124]/10 p-6">
            <h2 className="font-serif text-xl">Business Description</h2>
            <p className="mt-1 text-sm text-[#6d667a]">Tell your clients about your business.</p>
            <textarea className="mt-4 min-h-24 w-full rounded-lg border border-[#151124]/10 px-4 py-3 text-sm leading-6 outline-none focus:border-[#5b2aa0]" defaultValue="At Jereen And Paws, we provide professional dog walking, training, and pet care services tailored to your dog’s individual needs. We treat every dog like family!" />
          </section>

          <section className="border-t border-[#151124]/10 p-6">
            <h2 className="font-serif text-xl">Social Media Links</h2>
            <p className="mt-1 text-sm text-[#6d667a]">Add your social media profiles to connect with your clients.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {[ ["f", "Facebook URL", "https://facebook.com/jereenandpaws", "bg-blue-600"], ["◎", "Instagram URL", "https://instagram.com/jereenandpaws", "bg-[#6c38c2]"], ["♪", "TikTok URL", "https://tiktok.com/@jereenandpaws", "bg-black"] ].map(([mark, label, value, color]) => <div key={label as string} className="flex items-center gap-3 rounded-lg border border-[#151124]/10 px-4 py-3"><span className={`grid size-7 shrink-0 place-items-center rounded-md text-base font-bold text-white ${color}`}>{mark as string}</span><div className="min-w-0"><p className="text-xs text-[#6d667a]">{label as string}</p><p className="truncate text-sm">{value as string}</p></div></div>)}
            </div>
          </section>

          <section className="border-t border-[#151124]/10 p-6">
            <h2 className="font-serif text-xl">Business Hours</h2>
            <p className="mt-1 text-sm text-[#6d667a]">Set your business hours for each day.</p>
            <div className="mt-4 divide-y divide-[#151124]/10 text-sm">
              {hours.map(([day, open, close, enabled, breakButton]) => <div key={day} className="grid gap-3 py-3 md:grid-cols-[11rem_10rem_1rem_10rem_4rem_1fr] md:items-center"><p className="font-semibold">{day}</p>{enabled ? <><SelectLike value={open} /><span className="text-center text-[#6d667a]">to</span><SelectLike value={close} /></> : <p className="col-span-3 text-[#6d667a]">Closed</p>}<Toggle enabled={enabled} />{breakButton && <button className="text-left text-sm font-semibold text-[#5b2aa0]"><Plus className="mr-1 inline size-4" />Add Break</button>}</div>)}
            </div>
          </section>
        </Card>

        <aside className="space-y-5">
          <Card className="p-6"><h2 className="font-serif text-xl">Your Plan</h2><div className="mt-6 flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><PawPrint className="size-7" /></span><div><p className="font-semibold">Professional Plan <span className="ml-2 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700">Active</span></p><p className="mt-1 text-sm text-[#6d667a]">Renews on June 25, 2024</p></div></div><button className="mt-6 w-full rounded-lg border border-[#151124]/10 bg-[#fbf9fd] px-5 py-3 text-sm font-semibold text-[#5b2aa0]">Manage Plan</button></Card>
          <Card className="p-6"><h2 className="font-serif text-xl">Storage Usage</h2><p className="mt-5 text-sm text-[#6d667a]">You&apos;ve used 2.4 GB of 10 GB</p><div className="mt-4 flex items-center gap-4"><div className="h-2 flex-1 rounded-full bg-[#eeeaf3]"><div className="h-full w-[24%] rounded-full bg-[#5b2aa0]" /></div><span className="text-sm text-[#4f4863]">24%</span></div><button className="mt-6 w-full rounded-lg border border-[#151124]/10 bg-[#fbf9fd] px-5 py-3 text-sm font-semibold text-[#5b2aa0]">Manage Storage</button></Card>
          <Card className="p-6"><h2 className="font-serif text-xl">Backup</h2><div className="mt-5 flex gap-4"><span className="grid size-10 place-items-center rounded-full bg-[#f0e9fb] text-[#5b2aa0]"><Cloud className="size-5" /></span><p className="text-sm leading-6 text-[#6d667a]">Last backup was 2 days ago.<br />Next backup in 22 hours.</p></div><button className="mt-6 w-full rounded-lg border border-[#151124]/10 bg-[#fbf9fd] px-5 py-3 text-sm font-semibold text-[#5b2aa0]">Run Backup Now</button></Card>
          <Card className="border-red-200 p-6"><h2 className="font-serif text-xl text-red-600">Danger Zone</h2><p className="mt-4 text-sm text-[#6d667a]">These actions are permanent and cannot be undone.</p><button className="mt-5 w-full rounded-lg border border-red-300 px-5 py-3 text-sm font-semibold text-red-600"><Download className="mr-2 inline size-4" />Export Data</button><button className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"><Trash2 className="mr-2 inline size-4" />Delete Account</button></Card>
        </aside>
      </div>
    </div>
  );
}