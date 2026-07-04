import { Languages } from "lucide-react";
import { languages, text, useI18n } from "@/lib/i18n";

const copy = {
  eyebrow: text("Langue", "Language", "اللغة"),
  title: text("Interface multilingue", "Multilingual interface", "واجهة متعددة اللغات"),
  active: text("actif", "active", "مفعّلة"),
  ready: text("prêt", "ready", "جاهزة"),
};

export const LanguageSwitch = ({ compact = false }: { compact?: boolean }) => {
  const { lang, setLang, tr } = useI18n();

  return (
    <div
      className={`inline-grid shrink-0 grid-cols-3 overflow-hidden border border-border/60 bg-noir-profond/80 ${
        compact ? "h-7 w-[78px]" : ""
      }`}
      aria-label={tr(copy.eyebrow)}
    >
      {languages.map((item) => {
        const active = item.id === lang;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLang(item.id)}
            lang={item.id}
            className={`flex min-w-0 items-center justify-center font-mono-eclat text-[9px] uppercase leading-none transition ${
              active ? "bg-laiton text-primary-foreground" : "text-voile-dim hover:text-laiton"
            } ${compact ? "h-full w-full px-0 tracking-normal" : "tap min-w-9 px-2 tracking-rituel"}`}
            aria-pressed={active}
            title={item.nativeName}
          >
            {item.short}
          </button>
        );
      })}
    </div>
  );
};

export const LanguageModule = () => {
  const { lang, setLang, tr } = useI18n();

  return (
    <section className="px-6 py-10 border-b border-border/40">
      <div className="flex items-center gap-3 mb-5">
        <Languages className="h-4 w-4 text-laiton" strokeWidth={1.25} />
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(copy.eyebrow)}
          </p>
          <h2 className="font-serif-rituel text-3xl leading-tight">{tr(copy.title)}</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {languages.map((item) => {
          const active = item.id === lang;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={`min-h-14 border px-3 py-2 text-center transition ${active ? "border-laiton bg-laiton/10 text-laiton" : "border-border/60 bg-card/30 text-voile-dim"}`}
            >
              <span className="block font-mono-eclat text-[11px] tracking-rituel uppercase">
                {item.short}
              </span>
              <span className="block font-serif-rituel text-sm leading-tight">
                {item.nativeName}
              </span>
              <span className="block font-mono-eclat text-[8px] tracking-rituel uppercase opacity-70">
                {item.id === lang ? tr(copy.active) : tr(copy.ready)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
