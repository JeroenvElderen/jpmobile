import { PawPrint } from "lucide-react";

import { Card } from "./card";

export function BackendPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-5 md:p-10">
      <Card className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b2aa0]">Backend portal</p>
        <h1 className="mt-4 font-serif text-3xl">{title} <PawPrint className="inline size-6 text-[#6c38c2]" /></h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d667a]">
          This backend section is wired as its own component and ready for the dedicated {title.toLowerCase()} experience.
        </p>
      </Card>
    </div>
  );
}