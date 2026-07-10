"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Grid2X2,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PawPrint,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { usePortalDogImages } from "./use-portal-dog-images";

type FAQCategory =
  | "All"
  | "Bookings"
  | "Walks"
  | "Care"
  | "Training"
  | "Payments"
  | "Policies"
  | "Other";

type FAQItem = {
  category: Exclude<FAQCategory, "All">;
  question: string;
  answer: string;
};

const faqCategories = [
  [Grid2X2, "All"],
  [CalendarDays, "Bookings"],
  [PawPrint, "Walks"],
  [Heart, "Care"],
  [Star, "Training"],
  [CreditCard, "Payments"],
  [ShieldCheck, "Policies"],
  [MoreHorizontal, "Other"],
] as const satisfies readonly (readonly [React.ComponentType<{ className?: string; "aria-hidden"?: true }>, FAQCategory])[];

const faqItems = [
  {
    category: "Bookings",
    question: "How do I book a walk, care visit, or training session?",
    answer:
      "Open My Bookings and choose New Booking. Pick the service, date, preferred time, and add any notes about your dog. Once the request is reviewed, you will receive a confirmation in the portal.",
  },
  {
    category: "Bookings",
    question: "Can I book recurring weekly care?",
    answer:
      "Yes. Recurring walks, visits, day care, and training sessions can be arranged when availability allows. Send the days and times you need, and Jeroen will confirm a schedule that works for your dog.",
  },
  {
    category: "Bookings",
    question: "How far in advance should I book?",
    answer:
      "For regular care, booking at least one week ahead is best. For boarding, overnight support, or busy holiday periods, earlier is better so there is enough time for planning and a meet-and-greet if needed.",
  },
  {
    category: "Bookings",
    question: "Can I reschedule or cancel my booking?",
    answer:
      "Most bookings can be rescheduled from My Bookings when enough notice is given. If the portal does not allow the change, send a message and Jeroen will help you adjust it.",
  },
  {
    category: "Bookings",
    question: "What information should I share before the first booking?",
    answer:
      "Please share your dog's age, breed, routine, lead manners, recall, health needs, behaviour notes, vet details, access instructions, feeding needs, and anything that helps your dog feel safe.",
  },
  {
    category: "Bookings",
    question: "Do you offer a meet-and-greet before the first service?",
    answer:
      "Yes. A meet-and-greet is recommended before regular care, group walks, boarding, or training. It helps your dog meet Jeroen calmly and gives you a chance to talk through routines and expectations.",
  },
  {
    category: "Bookings",
    question: "Can I book care for more than one dog?",
    answer:
      "Yes. Multi-dog bookings are welcome when the dogs are comfortable together and the service is suitable. Add each dog to your profile so their needs and notes stay organised.",
  },
  {
    category: "Walks",
    question: "Do you offer solo walks and group walks?",
    answer:
      "Yes. Solo walks are ideal for puppies, senior dogs, reactive dogs, dogs in training, or dogs who simply prefer individual attention. Group walks are arranged only when the dogs are a good match.",
  },
  {
    category: "Walks",
    question: "How long are the walks?",
    answer:
      "Walk length depends on the service you book and your dog's needs. Sessions can be calm sniff walks, structured training walks, social walks, or longer adventures when appropriate.",
  },
  {
    category: "Walks",
    question: "Will my dog be kept on lead?",
    answer:
      "Dogs are kept on lead unless off-lead time has been discussed, approved, and is safe for the environment. Safety, recall, local rules, and your instructions always come first.",
  },
  {
    category: "Walks",
    question: "What happens in bad weather?",
    answer:
      "Walks usually continue in normal rain or wind with suitable care. If weather is unsafe, the session may be adjusted to a shorter comfort walk, enrichment visit, or rescheduled when possible.",
  },
  {
    category: "Walks",
    question: "Can you walk nervous or reactive dogs?",
    answer:
      "Often, yes. Nervous or reactive dogs are handled with calm, structured support and usually start with solo sessions. Jeroen will talk through triggers, handling preferences, and realistic goals first.",
  },
  {
    category: "Walks",
    question: "Do you collect and drop off dogs?",
    answer:
      "Collection and drop-off can be arranged for many services depending on location, timing, and the dog's comfort with travel. Access and handover instructions can be added to your profile.",
  },
  {
    category: "Walks",
    question: "What equipment should my dog have?",
    answer:
      "A secure collar or harness, ID tag, and lead are recommended. For dogs who pull, slip gear, or need extra support, Jeroen may suggest safer equipment after meeting your dog.",
  },
  {
    category: "Care",
    question: "What dog care services do you offer?",
    answer:
      "Services can include dog walking, training, day care, home check-ins, drop-ins, boarding, overnight support, and custom care plans depending on availability and your dog's needs.",
  },
  {
    category: "Care",
    question: "Do you offer home check-ins or drop-in visits?",
    answer:
      "Yes. Drop-ins can include comfort breaks, feeding, fresh water, medication support, play, garden time, litter or accident checks, and a short update so you know your dog is settled.",
  },
  {
    category: "Care",
    question: "Do you offer day care, boarding, or overnight stays?",
    answer:
      "These services may be available by arrangement and usually require extra planning. A meet-and-greet is important so routines, sleeping arrangements, feeding, and safety needs are clear.",
  },
  {
    category: "Care",
    question: "Can you care for puppies or senior dogs?",
    answer:
      "Yes, when the service is suitable. Puppies and senior dogs often need shorter outings, extra patience, toilet breaks, gentle handling, and routines that match their age and energy.",
  },
  {
    category: "Care",
    question: "Can you give medication?",
    answer:
      "Medication support may be possible when instructions are clear and the dog accepts it safely. Please provide written instructions, dosage details, timing, vet information, and emergency contacts.",
  },
  {
    category: "Care",
    question: "What if my dog is not feeling well?",
    answer:
      "Let Jeroen know as soon as possible. Depending on the situation, the booking may become a comfort visit, be shortened, or be rescheduled. Urgent concerns will be handled according to your vet and emergency contact details.",
  },
  {
    category: "Care",
    question: "Will you feed my dog or refresh water?",
    answer:
      "Yes. Feeding and fresh water can be included in visits or longer care sessions. Add feeding instructions, portions, allergies, and treat rules to your dog's profile.",
  },
  {
    category: "Training",
    question: "How do training packages work?",
    answer:
      "Training starts with your goals and your dog's behaviour history. Jeroen will recommend a plan, session rhythm, and practical homework so progress continues between sessions.",
  },
  {
    category: "Training",
    question: "What training methods do you use?",
    answer:
      "Training is calm, reward-based, and focused on communication, confidence, and realistic progress. The aim is to help dogs learn without fear, pressure, or confusion.",
  },
  {
    category: "Training",
    question: "What behaviours can training help with?",
    answer:
      "Training can support loose lead walking, recall, settling, puppy foundations, confidence, focus around distractions, polite greetings, impulse control, and everyday routines.",
  },
  {
    category: "Training",
    question: "Can training help with reactivity or anxiety?",
    answer:
      "Training may help many reactive or anxious dogs, but the plan depends on the dog, triggers, environment, and safety. Sessions usually start gently with management, confidence, and controlled exposure.",
  },
  {
    category: "Training",
    question: "Will I get homework after training sessions?",
    answer:
      "Yes. You will receive simple practice steps so training fits into daily life. Short, consistent practice is usually more useful than long sessions once in a while.",
  },
  {
    category: "Training",
    question: "Can training be combined with walks?",
    answer:
      "Yes. Training walks are useful for lead skills, focus, confidence, and real-world manners. They can be booked separately or used alongside a wider training plan.",
  },
  {
    category: "Payments",
    question: "How do I pay for services?",
    answer:
      "Invoices are available in the portal. You can review invoice details, payment status, and outstanding balances from the Invoices section.",
  },
  {
    category: "Payments",
    question: "When will I receive an invoice?",
    answer:
      "Invoices are usually issued after a booking or according to your regular care arrangement. You can also choose email invoice updates if you prefer reminders in your inbox.",
  },
  {
    category: "Payments",
    question: "Can I see past invoices and receipts?",
    answer:
      "Yes. The Invoices section keeps your paid and outstanding invoices organised, including session details, dates, invoice numbers, and downloadable copies.",
  },
  {
    category: "Payments",
    question: "What happens if a payment is late?",
    answer:
      "If a payment is late, Jeroen may send a reminder and pause future bookings until the balance is settled. If you need help, send a message before the due date.",
  },
  {
    category: "Payments",
    question: "Are deposits required?",
    answer:
      "Deposits may be requested for boarding, overnight support, high-demand dates, or larger care plans. If a deposit applies, it will be clearly stated before confirmation.",
  },
  {
    category: "Payments",
    question: "Do cancellation fees apply?",
    answer:
      "Cancellation fees may apply when bookings are cancelled at short notice, especially for reserved time slots, boarding, or overnight care. The exact policy depends on the service and timing.",
  },
  {
    category: "Policies",
    question: "Are your walkers and trainers insured?",
    answer:
      "Yes. Jeroen & Paws operates with appropriate professional care standards and insurance for dog care services. Ask if you need specific documentation for your records.",
  },
  {
    category: "Policies",
    question: "What areas do you service?",
    answer:
      "Service availability depends on the booking type and travel schedule. Jeroen & Paws primarily supports Greystones and nearby County Wicklow areas, with details confirmed before booking.",
  },
  {
    category: "Policies",
    question: "What vaccinations or health checks are required?",
    answer:
      "Dogs should be healthy, parasite-managed, and up to date with appropriate vaccinations for their lifestyle and service type. Group care, boarding, and day care may require stricter checks.",
  },
  {
    category: "Policies",
    question: "How do you handle keys and home access?",
    answer:
      "Access details are handled carefully and only used for booked services. Please provide clear instructions, alarm details if relevant, and a backup contact in case access is blocked.",
  },
  {
    category: "Policies",
    question: "What happens in an emergency?",
    answer:
      "Jeroen will contact you or your emergency contact as soon as possible and, if needed, contact your vet or the nearest suitable vet. Keep emergency details current in your profile.",
  },
  {
    category: "Policies",
    question: "Can you share photos of my dog?",
    answer:
      "Photo updates can be shared privately through the portal. Public sharing is only done with permission, and you can update your preferences if you do not want photos used outside your account.",
  },
  {
    category: "Policies",
    question: "Do you accept every dog into group care?",
    answer:
      "No. Group care depends on temperament, safety, size, play style, confidence, and the existing group. Some dogs are happier and safer with solo care.",
  },
  {
    category: "Other",
    question: "How will I receive photo updates?",
    answer:
      "Photo updates are shared in Session Galleries when available. You can view recent sessions, favourite photos, and revisit older galleries from your portal.",
  },
  {
    category: "Other",
    question: "How can I contact you if I have an urgent question?",
    answer:
      "Use the Send a message button in the portal for normal questions. For urgent same-day care details, use the fastest contact method you have been given for your booking.",
  },
  {
    category: "Other",
    question: "Can I request the same person every time?",
    answer:
      "Jeroen aims to keep care consistent whenever possible. Regular dogs benefit from familiar routines, but availability and service type may affect scheduling.",
  },
  {
    category: "Other",
    question: "What makes Jeroen & Paws different?",
    answer:
      "The service is personal, calm, and relationship-led. Your dog is treated as an individual, with care shaped around temperament, confidence, routine, and what helps them feel safe.",
  },
  {
    category: "Other",
    question: "Can I update my dog's details later?",
    answer:
      "Yes. Use Profile to keep your dog's care notes, age, preferences, behaviour information, and contact details up to date before future bookings.",
  },
] as const satisfies readonly FAQItem[];

function FaqPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-[#24163f]/10 bg-white shadow-[0_18px_55px_rgba(29,23,40,0.08)] ${className}`}>
      {children}
    </section>
  );
}

function normalise(value: string) {
  return value.trim().toLowerCase();
}

export function FAQ({
  accessToken,
  onBackToDashboard,
}: {
  accessToken?: string;
  onBackToDashboard: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqItems[0].question);

  const filteredQuestions = useMemo(() => {
    const query = normalise(searchQuery);

    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        normalise(`${item.category} ${item.question} ${item.answer}`).includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    return faqItems.reduce<Record<FAQCategory, number>>(
      (counts, item) => {
        counts.All += 1;
        counts[item.category] += 1;
        return counts;
      },
      {
        All: 0,
        Bookings: 0,
        Walks: 0,
        Care: 0,
        Training: 0,
        Payments: 0,
        Policies: 0,
        Other: 0,
      },
    );
  }, []);

  const questionCountLabel = `${filteredQuestions.length} ${filteredQuestions.length === 1 ? "question" : "questions"}`;
  const dogImages = usePortalDogImages(accessToken, 1);

  return (
    <div className="px-4 py-6 text-[#17132a] sm:px-8 lg:px-10 lg:py-10">
      <header className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4d2e91]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to Dashboard
          </button>
          <h1 className="font-serif text-4xl leading-tight text-[#241f30]">
            FAQ <PawPrint aria-hidden="true" className="inline size-6 text-[#8b5cf6]" />
          </h1>
          <p className="mt-3 text-sm text-[#17132a]">Find answers to common questions about our services.</p>
        </div>
        <div className="flex items-center gap-5">
          <button aria-label="Notifications" className="relative text-[#2f1b59]">
            <Bell className="size-6" />
            <span className="absolute -right-1 -top-2 grid size-5 place-items-center rounded-full bg-[#17132a] text-[0.65rem] font-black text-white">2</span>
          </button>
          <div className="relative size-14 overflow-hidden rounded-full ring-2 ring-[#ead9b8]">
            <Image src={dogImages.getImage(0, "/images/dogs/ace.jpg") || "/images/dogs/ace.jpg"} alt="Client dog photo" fill sizes="56px" className="object-cover" />
          </div>
        </div>
      </header>

      <div className="mx-auto mt-8 max-w-6xl space-y-6">
        <FaqPanel className="p-5 sm:p-7">
          <label className="relative block">
            <span className="sr-only">Search for a question</span>
            <Search aria-hidden="true" className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#6b6473]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setOpenQuestion(null);
              }}
              placeholder="Search for a question..."
              className="h-14 w-full rounded-lg border border-[#24163f]/10 bg-white px-14 text-sm text-[#241f30] outline-none transition placeholder:text-[#7a7283] focus:border-[#4d2e91]/50 focus:ring-4 focus:ring-[#4d2e91]/10"
            />
          </label>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {faqCategories.map(([Icon, label]) => {
              const active = activeCategory === label;

              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setActiveCategory(label);
                    setOpenQuestion(null);
                  }}
                  className={`grid min-h-24 place-items-center rounded-lg border px-4 py-5 text-sm font-semibold transition ${active ? "border-[#4d2e91] bg-[#fbf8ff] text-[#4d2e91]" : "border-[#24163f]/10 bg-white text-[#2f2938] hover:border-[#4d2e91]/35"}`}
                >
                  <Icon aria-hidden="true" className={`mb-3 size-7 ${active ? "text-[#4d2e91]" : "text-[#6d4b9b]"}`} />
                  <span>{label}</span>
                  <span className="mt-2 text-xs font-normal text-[#665d70]">{categoryCounts[label]}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl text-[#241f30]">
              {activeCategory === "All" ? "All Questions" : `${activeCategory} Questions`}
            </h2>
            <p className="text-sm text-[#665d70]">{questionCountLabel}</p>
          </div>

          <div className="mt-6 space-y-3">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((item) => {
                const isOpen = item.question === openQuestion;

                return (
                  <article key={item.question} className="rounded-lg border border-[#24163f]/10 bg-white">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenQuestion((current) => (current === item.question ? null : item.question))}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                    >
                      <span className={`font-semibold ${isOpen ? "text-[#4d2e91]" : "text-[#17132a]"}`}>{item.question}</span>
                      {isOpen ? (
                        <ChevronUp aria-hidden="true" className="size-5 shrink-0 text-[#4d2e91]" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-[#4d2e91]" />
                      )}
                    </button>

                    {isOpen ? (
                      <div className="grid gap-6 px-5 pb-7 pt-2 sm:grid-cols-[1fr_auto] sm:px-6">
                        <p className="max-w-3xl text-sm leading-6 text-[#3a3048]">{item.answer}</p>
                        <div className="hidden min-w-40 place-items-center text-[#a78bfa] sm:grid">
                          <PawPrint aria-hidden="true" className="size-20 opacity-35" />
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-lg border border-[#24163f]/10 bg-[#fbf8ff] px-5 py-8 text-center">
                <p className="font-semibold text-[#241f30]">No matching questions found.</p>
                <p className="mt-2 text-sm text-[#665d70]">Try another search term or choose a different category.</p>
              </div>
            )}
          </div>
        </FaqPanel>

        <section className="flex flex-col gap-5 rounded-xl bg-[#f4eef8] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex gap-5">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#4d2e91] text-white">
              <MessageCircle aria-hidden="true" className="size-7" />
            </span>
            <div>
              <h2 className="font-serif text-2xl text-[#241f30]">Still need help?</h2>
              <p className="mt-2 text-sm text-[#5f5769]">Can&apos;t find the answer you&apos;re looking for?</p>
              <p className="mt-1 text-sm text-[#5f5769]">Our team is happy to help.</p>
            </div>
          </div>
          <div className="sm:text-right">
            <Link href="/contact" className="inline-flex items-center justify-center gap-3 rounded bg-[#4d2e91] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white">
              Send us a message <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <p className="mt-3 text-xs text-[#8a8291]">Average reply: within a few hours</p>
          </div>
        </section>
      </div>
    </div>
  );
}
