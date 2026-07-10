import { Send, X } from "lucide-react";

type BookingRequestSlot = {
  id: string;
  date: string;
  startTime: string;
};

type DogOption = {
  id: string;
  name: string;
};

type BookingRequestModalProps = {
  isOpen: boolean;
  dogOptions: DogOption[];
  requestDogChoice: string;
  requestServiceName: string;
  requestSlots: BookingRequestSlot[];
  requestDurationMinutes: string;
  requestLocation: string;
  requestNotes: string;
  isRequestingBooking: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDogChoiceChange: (value: string) => void;
  onServiceNameChange: (value: string) => void;
  onSlotChange: (slotId: string, updates: Partial<Omit<BookingRequestSlot, "id">>) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slotId: string) => void;
  onDurationChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
};

export function BookingRequestModal({ isOpen, dogOptions, requestDogChoice, requestServiceName, requestSlots, requestDurationMinutes, requestLocation, requestNotes, isRequestingBooking, onClose, onSubmit, onDogChoiceChange, onServiceNameChange, onSlotChange, onAddSlot, onRemoveSlot, onDurationChange, onLocationChange, onNotesChange }: BookingRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17132a]/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="booking-request-title">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(23,19,42,0.32)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#24163f]/10 px-6 py-5 sm:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3f2581]">Request Booking</p>
            <h2 id="booking-request-title" className="mt-2 font-serif text-3xl text-[#241f30]">Request Booking</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#3f2581] transition hover:bg-[#f4eef8]" aria-label="Close booking request modal">
            <X className="size-6" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <form id="booking-request-form" onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-2">
            <fieldset className="lg:col-span-2">
              <legend className="text-sm font-semibold text-[#342c3f]">Who is this booking for?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dogOptions.map((dog) => <label key={dog.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#24163f]/15 px-4 py-3 text-sm font-semibold text-[#342c3f]">
                  <input type="radio" name="dogChoice" value={dog.id} checked={requestDogChoice === dog.id || (dogOptions.length === 1 && requestDogChoice === "both")} onChange={(event) => onDogChoiceChange(event.target.value)} />
                  {dog.name}
                </label>)}
                {dogOptions.length > 1 ? <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#24163f]/15 px-4 py-3 text-sm font-semibold text-[#342c3f]">
                  <input type="radio" name="dogChoice" value="both" checked={requestDogChoice === "both"} onChange={(event) => onDogChoiceChange(event.target.value)} />
                  Both dogs ({dogOptions.map((dog) => dog.name).join(" + ")})
                </label> : null}
                {!dogOptions.length ? <p className="text-sm text-[#8a2f20]">No dogs found yet.</p> : null}
              </div>
            </fieldset>
            <label className="text-sm font-semibold text-[#342c3f] lg:col-span-2">
              Service
              <input value={requestServiceName} onChange={(event) => onServiceNameChange(event.target.value)} required className="mt-2 w-full rounded-lg border border-[#24163f]/15 px-4 py-3 text-sm font-normal text-[#17132a]" placeholder="Dog walking, day care, overnight care…" />
            </label>
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#342c3f]">Dates and start times</p>
                  <p className="mt-1 text-xs leading-5 text-[#665d70]">Add as many days as you need. The service, duration, location, and notes below apply to every requested slot.</p>
                </div>
                <button type="button" onClick={onAddSlot} className="rounded border border-[#4d2e91]/30 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#3f2581]">Add another date</button>
              </div>
              <div className="mt-4 grid gap-4">
                {requestSlots.map((slot, index) => <div key={slot.id} className="grid gap-3 rounded-lg border border-[#24163f]/10 bg-[#fbf9fd] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <label className="text-sm font-semibold text-[#342c3f]">
                    Date {index + 1}
                    <input type="date" value={slot.date} onChange={(event) => onSlotChange(slot.id, { date: event.target.value })} required className="mt-2 w-full rounded-lg border border-[#24163f]/15 bg-white px-4 py-3 text-sm font-normal text-[#17132a]" />
                  </label>
                  <label className="text-sm font-semibold text-[#342c3f]">
                    Start time
                    <input type="time" value={slot.startTime} onChange={(event) => onSlotChange(slot.id, { startTime: event.target.value })} required className="mt-2 w-full rounded-lg border border-[#24163f]/15 bg-white px-4 py-3 text-sm font-normal text-[#17132a]" />
                  </label>
                  <button type="button" onClick={() => onRemoveSlot(slot.id)} disabled={requestSlots.length === 1} className="rounded border border-[#4d2e91]/20 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#3f2581] disabled:cursor-not-allowed disabled:opacity-40">Remove</button>
                </div>)}
              </div>
            </div>
            <label className="text-sm font-semibold text-[#342c3f] lg:col-span-2">
              How long?
              <select value={requestDurationMinutes} onChange={(event) => onDurationChange(event.target.value)} required className="mt-2 w-full rounded-lg border border-[#24163f]/15 bg-white px-4 py-3 text-sm font-normal text-[#17132a]">
                <option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1 hour 30 minutes</option><option value="120">2 hours</option><option value="240">Half day</option><option value="480">Full day</option><option value="1440">Overnight / 24 hours</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-[#342c3f] lg:col-span-2">
              Location
              <input value={requestLocation} onChange={(event) => onLocationChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#24163f]/15 px-4 py-3 text-sm font-normal text-[#17132a]" placeholder="Home address, usual pick-up point, or to be confirmed" />
            </label>
            <label className="text-sm font-semibold text-[#342c3f] lg:col-span-2">
              Notes
              <textarea value={requestNotes} onChange={(event) => onNotesChange(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-[#24163f]/15 px-4 py-3 text-sm font-normal text-[#17132a]" placeholder="Add preferred times, care notes, or anything Jeroen should know." />
            </label>
          </form>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#24163f]/10 bg-[#fbf9fd] px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button type="button" onClick={onClose} className="rounded border border-[#4d2e91]/25 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#3f2581]">Cancel</button>
          <button type="submit" form="booking-request-form" disabled={isRequestingBooking || !dogOptions.length} className="inline-flex items-center justify-center gap-3 rounded bg-[#4d2e91] px-7 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60">{isRequestingBooking ? "Sending…" : `Send ${requestSlots.length} booking request${requestSlots.length === 1 ? "" : "s"}`} <Send className="size-4" /></button>
        </footer>
      </div>
    </div>
  );
}