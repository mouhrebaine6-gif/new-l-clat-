import { useEffect, useState, useCallback } from "react";
import type { Lang, Localized } from "@/lib/i18n";
import type { BondStatus, ScanAccessLevel } from "@/lib/scanProgression";

export type PorteurState = {
  name: string;
  sceauId: string;
  collected: string[];
  relations: Record<string, FragmentRelation>;
  uniqueScanKeys: string[];
  fragmentScanCounts: Record<string, number>;
  qualifiedProgressPoints: number;
  activeFragmentId?: string;
  scans: number;
  createdAt: number;
  serment: boolean; // a juré le serment
  onboarded: boolean; // a fini l'onboarding
  intention?: string; // une phrase rituelle saisie
};

export type FragmentRelation = {
  fragmentId: string;
  bondStatus: BondStatus;
  qualifiedProgressPoints: number;
  previewSeenAt?: number;
  firstValidScanAt?: number;
  lastQualifiedProgressAt?: number;
  publicCode?: string;
};

export type RecordScanInput = {
  fragmentId: string;
  accessLevel: ScanAccessLevel;
  bondStatus?: BondStatus;
  qualifiedProgressDelta?: number;
  publicCode?: string;
};

const KEY = "eclat_porteur_v1";

const generateSceauId = () => {
  const a = "AETHRSLNVOIM".split("");
  const pick = () => a[Math.floor(Math.random() * a.length)];
  return `${pick()}${pick()}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}-${pick()}${pick()}`;
};

const initial = (): PorteurState => {
  // Mode démo : ?demo=1 dans l'URL → débloque tout (10 fragments, niveau max)
  if (
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("demo") === "1"
  ) {
    const all = [
      "eveil",
      "souffle",
      "forge",
      "prisme",
      "atome",
      "eclipse",
      "horizon",
      "resonance",
      "ascension",
      "origine",
    ];
    return {
      name: "Porteur Démo",
      sceauId: generateSceauId(),
      collected: all,
      relations: Object.fromEntries(
        all.map((id) => [
          id,
          {
            fragmentId: id,
            bondStatus: "deep_active" as const,
            qualifiedProgressPoints: 40,
            previewSeenAt: Date.now(),
            firstValidScanAt: Date.now(),
            lastQualifiedProgressAt: Date.now(),
          },
        ]),
      ),
      uniqueScanKeys: all,
      fragmentScanCounts: Object.fromEntries(all.map((id) => [id, 40])),
      qualifiedProgressPoints: 1200,
      activeFragmentId: undefined,
      scans: 120,
      createdAt: Date.now(),
      serment: true,
      onboarded: true,
    };
  }
  return {
    name: "Porteur",
    sceauId: generateSceauId(),
    collected: [],
    relations: {},
    uniqueScanKeys: [],
    fragmentScanCounts: {},
    qualifiedProgressPoints: 0,
    scans: 0,
    createdAt: Date.now(),
    serment: false,
    onboarded: false,
  };
};

const read = (): PorteurState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = initial();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return initial();
  }
};

const write = (s: PorteurState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("porteur:update"));
};

const LEVEL_TITLES: Localized<string>[] = [
  {
    fr: "Porteur du seuil",
    en: "Threshold bearer",
    ar: "حامل العتبة",
  },
  {
    fr: "Écho du tissu",
    en: "Echo of the fabric",
    ar: "صدى القماش",
  },
  {
    fr: "Lecteur de signes",
    en: "Reader of signs",
    ar: "قارئ العلامات",
  },
  {
    fr: "Gardien de la faille",
    en: "Keeper of the rift",
    ar: "حارس الشق",
  },
  {
    fr: "Fragment éveillé",
    en: "Awakened fragment",
    ar: "شذرة مستيقظة",
  },
  {
    fr: "Ligne tenue",
    en: "Held line",
    ar: "خط ثابت",
  },
  {
    fr: "Passage calme",
    en: "Quiet passage",
    ar: "عبور هادئ",
  },
  {
    fr: "Porteur confirmé",
    en: "Confirmed bearer",
    ar: "حامل مؤكّد",
  },
  {
    fr: "Éclat montant",
    en: "Rising éclat",
    ar: "بريق صاعد",
  },
  {
    fr: "Origine approchée",
    en: "Origin approached",
    ar: "اقتراب من الأصل",
  },
];

export const getPorteurTitle = (niveau: number, lang: Lang) =>
  LEVEL_TITLES[Math.max(0, Math.min(9, niveau - 1))][lang];

export const computeLevel = (collected: number, qualifiedProgressPoints: number) => {
  const base = collected * 10 + Math.min(qualifiedProgressPoints, 40) * 2;
  const niveau = Math.max(1, Math.min(10, Math.floor(base / 14) + 1));
  return { niveau, titre: getPorteurTitle(niveau, "fr"), progress: Math.min(100, base) };
};

export const usePorteur = () => {
  const [state, setState] = useState<PorteurState>(() => read());

  useEffect(() => {
    const handler = () => setState(read());
    window.addEventListener("porteur:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("porteur:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const recordScan = useCallback((input: RecordScanInput) => {
    write(applyScanResult(read(), input));
  }, []);

  const collect = useCallback((fragmentId: string) => {
    write(
      applyScanResult(read(), {
        fragmentId,
        accessLevel: "fragment_awakened",
        bondStatus: "awakened",
        qualifiedProgressDelta: 1,
      }),
    );
  }, []);

  const reset = useCallback(() => write(initial()), []);

  const rename = useCallback((name: string) => {
    const s = read();
    write({ ...s, name: name.slice(0, 24) || "Porteur" });
  }, []);

  const completeOnboarding = useCallback(
    (p: { name: string; intention?: string; serment: boolean }) => {
      const s = read();
      write({
        ...s,
        name: p.name.slice(0, 24) || "Porteur",
        intention: p.intention?.slice(0, 140),
        serment: p.serment,
        onboarded: true,
      });
    },
    [],
  );

  return {
    state,
    recordScan,
    collect,
    reset,
    rename,
    completeOnboarding,
    ...computeLevel(state.collected.length, state.qualifiedProgressPoints),
  };
};

const normalizeState = (raw: Partial<PorteurState>): PorteurState => {
  const base = initial();
  const relations = normalizeRelations(raw.relations);
  const collected = Array.isArray(raw.collected) ? raw.collected.filter(Boolean) : [];
  const uniqueScanKeys = Array.isArray(raw.uniqueScanKeys)
    ? Array.from(
        new Set(
          raw.uniqueScanKeys
            .filter((key): key is string => typeof key === "string" && Boolean(key.trim()))
            .map(normalizeScanKey),
        ),
      )
    : deriveUniqueScanKeys(relations, collected);
  const fragmentScanCounts = normalizeFragmentScanCounts(
    raw.fragmentScanCounts,
    relations,
    collected,
  );
  const qualifiedProgressPoints =
    typeof raw.qualifiedProgressPoints === "number"
      ? Math.max(0, raw.qualifiedProgressPoints)
      : sumQualifiedProgress(relations);

  return {
    ...base,
    ...raw,
    collected,
    relations,
    uniqueScanKeys,
    fragmentScanCounts,
    qualifiedProgressPoints,
    scans: typeof raw.scans === "number" ? Math.max(0, raw.scans) : 0,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : base.createdAt,
    serment: Boolean(raw.serment),
    onboarded: Boolean(raw.onboarded),
  };
};

const normalizeRelations = (raw: unknown): Record<string, FragmentRelation> => {
  if (!raw || typeof raw !== "object") return {};
  const next: Record<string, FragmentRelation> = {};
  for (const [fragmentId, relation] of Object.entries(
    raw as Record<string, Partial<FragmentRelation>>,
  )) {
    if (!fragmentId || !relation) continue;
    next[fragmentId] = {
      fragmentId,
      bondStatus: relation.bondStatus || "seen",
      qualifiedProgressPoints: Math.max(0, Number(relation.qualifiedProgressPoints) || 0),
      previewSeenAt: relation.previewSeenAt,
      firstValidScanAt: relation.firstValidScanAt,
      lastQualifiedProgressAt: relation.lastQualifiedProgressAt,
      publicCode: relation.publicCode,
    };
  }
  return next;
};

const applyScanResult = (state: PorteurState, input: RecordScanInput): PorteurState => {
  const now = Date.now();
  const relation = state.relations[input.fragmentId] || {
    fragmentId: input.fragmentId,
    bondStatus: "none" as BondStatus,
    qualifiedProgressPoints: 0,
  };
  const delta = Math.max(0, Math.floor(input.qualifiedProgressDelta || 0));
  const isQualified = input.accessLevel !== "scanner_preview" && delta > 0;
  const bondStatus = strongestBond(
    relation.bondStatus,
    input.bondStatus || accessLevelToBondStatus(input.accessLevel),
  );
  const nextRelation: FragmentRelation = {
    ...relation,
    bondStatus,
    publicCode: input.publicCode || relation.publicCode,
    previewSeenAt: relation.previewSeenAt || now,
    firstValidScanAt: relation.firstValidScanAt || (isQualified ? now : undefined),
    lastQualifiedProgressAt: isQualified ? now : relation.lastQualifiedProgressAt,
    qualifiedProgressPoints: relation.qualifiedProgressPoints + delta,
  };
  const relations = { ...state.relations, [input.fragmentId]: nextRelation };
  const shouldCollect = input.accessLevel !== "scanner_preview";
  const collected =
    shouldCollect && !state.collected.includes(input.fragmentId)
      ? [...state.collected, input.fragmentId]
      : state.collected;
  const scanKey = getUniqueScanKey(input);
  const uniqueScanKeys = state.uniqueScanKeys.includes(scanKey)
    ? state.uniqueScanKeys
    : [...state.uniqueScanKeys, scanKey];
  // Règle métier : un scan visiteur (scanner_preview) n'alimente jamais les
  // paliers d'histoire — seuls les scans qualifiés comptent (cf. Constitution).
  const fragmentScanCounts = shouldCollect
    ? {
        ...state.fragmentScanCounts,
        [input.fragmentId]: (state.fragmentScanCounts[input.fragmentId] || 0) + 1,
      }
    : state.fragmentScanCounts;

  return {
    ...state,
    relations,
    collected,
    uniqueScanKeys,
    fragmentScanCounts,
    activeFragmentId: shouldCollect ? input.fragmentId : state.activeFragmentId,
    qualifiedProgressPoints: sumQualifiedProgress(relations),
    scans: state.scans + 1,
  };
};

const accessLevelToBondStatus = (access: ScanAccessLevel): BondStatus => {
  if (access === "fragment_deep") return "deep_active";
  if (access === "fragment_bonded") return "bonded_active";
  if (access === "fragment_awakened") return "awakened";
  return "seen";
};

const BOND_RANK: Record<BondStatus, number> = {
  none: 0,
  seen: 1,
  awakened: 2,
  bonded_dormant: 3,
  bonded_frozen: 3,
  bonded_revoked: 3,
  bonded_active: 4,
  deep_active: 5,
};

const strongestBond = (a: BondStatus, b: BondStatus): BondStatus =>
  BOND_RANK[b] > BOND_RANK[a] ? b : a;

const sumQualifiedProgress = (relations: Record<string, FragmentRelation>) =>
  Object.values(relations).reduce((total, relation) => total + relation.qualifiedProgressPoints, 0);

const normalizeScanKey = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "_")
    .slice(0, 96);

const getUniqueScanKey = (input: RecordScanInput) =>
  normalizeScanKey(input.publicCode || `fragment:${input.fragmentId}`);

const deriveUniqueScanKeys = (relations: Record<string, FragmentRelation>, collected: string[]) => {
  const relationKeys = Object.values(relations)
    .map((relation) => relation.publicCode)
    .filter((code): code is string => Boolean(code));
  return Array.from(
    new Set([...relationKeys, ...collected.map((fragmentId) => `fragment:${fragmentId}`)]),
  ).map(normalizeScanKey);
};

const normalizeFragmentScanCounts = (
  raw: unknown,
  relations: Record<string, FragmentRelation>,
  collected: string[],
) => {
  const counts: Record<string, number> = {};
  if (raw && typeof raw === "object") {
    for (const [fragmentId, value] of Object.entries(raw as Record<string, unknown>)) {
      const count = Math.floor(Number(value));
      if (fragmentId && Number.isFinite(count) && count > 0) counts[fragmentId] = count;
    }
  }

  // Seules les relations avec au moins un scan qualifié (jamais les previews
  // visiteur) garantissent un compteur ≥ 1 à la réhydratation.
  for (const [fragmentId, relation] of Object.entries(relations)) {
    if (relation.firstValidScanAt) counts[fragmentId] = Math.max(counts[fragmentId] || 0, 1);
  }
  for (const fragmentId of collected) {
    counts[fragmentId] = Math.max(counts[fragmentId] || 0, 1);
  }

  return counts;
};

export const toRoman = (n: number) => {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let r = "";
  let v = n;
  for (const [k, s] of map)
    while (v >= k) {
      r += s;
      v -= k;
    }
  return r || "—";
};
