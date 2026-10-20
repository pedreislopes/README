import Link from "next/link";

/** Logo do Solid: um "bloco" laranja + o nome. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Solid — página inicial">
      <span className="grid h-8 w-8 grid-cols-2 gap-0.5 rounded-md bg-marca-600 p-1">
        <span className="rounded-sm bg-white/90" />
        <span className="rounded-sm bg-white/60" />
        <span className="rounded-sm bg-white/60" />
        <span className="rounded-sm bg-white/90" />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">Solid</span>
    </Link>
  );
}
