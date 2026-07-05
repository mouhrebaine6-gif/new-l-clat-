import { useCallback, useEffect, useMemo, useState } from "react";
import { fragments } from "@/data/fragments";
import { DEMO_LEVEL, DEMO_MAX } from "@/lib/demoMax";

export type AppEventType =
  | "garment_scanned"
  | "garment_activated"
  | "ar_launched"
  | "fragment_unlocked"
  | "mission_completed"
  | "skin_unlocked"
  | "quiz_completed"
  | "walking_steps"
  | "lore_opened";

export type MissionType = "scan" | "garment" | "ar" | "quiz" | "walk" | "lore" | "unlock";
export type SkinAccess = "unlocked" | "preview" | "locked";

export type DigitalGarment = {
  id: string;
  productId: string;
  name: string;
  fragmentId: string;
  collection: string;
  rarity: "essentiel" | "rare" | "mythique";
  previewToken: string;
};

export type ArSkin = {
  id: string;
  fragmentId: string;
  name: string;
  type: "wings" | "dragon" | "companion" | "orb";
  unityModelId: string;
  placement: "back" | "side" | "shoulder" | "front";
  requiredLevel: number;
  requiredMissionId?: string;
  requiredGarmentId?: string;
  previewAvailable: boolean;
  description: string;
};

export type MissionDefinition = {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  eventTypes: AppEventType[];
};

export type StoryReward = {
  id: string;
  title: string;
  levelRequired: number;
  sourceFile: string;
  summary: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
};

type UserMissionState = {
  progress: number;
  completedAt?: string;
  claimedAt?: string;
};

type AppEvent = {
  id: string;
  type: AppEventType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ProgressionScope = {
  ownerId?: string;
  mode?: "guest" | "account";
  pseudo?: string;
  lang?: ProgressionState["profile"]["lang"];
};

export type RemoteProgressionSnapshot = {
  profile?: Partial<ProgressionState["profile"]>;
  ownedGarmentIds?: string[];
  activeGarmentId?: string;
  unlockedSkinIds?: string[];
  activeSkinId?: string;
  missions?: Record<string, UserMissionState>;
};

export type ProgressionState = {
  version: 1;
  profile: {
    mode: "guest" | "account";
    pseudo: string;
    level: number;
    xpTotal: number;
    coins: number;
    lang: "fr" | "en" | "ar";
    country?: string;
    createdAt: string;
  };
  ownedGarmentIds: string[];
  activeGarmentId?: string;
  unlockedSkinIds: string[];
  activeSkinId?: string;
  missions: Record<string, UserMissionState>;
  events: AppEvent[];
  scanDays: string[];
  quiz: {
    answered: number;
    correct: number;
    bestPercent: number;
  };
  walking: {
    totalSteps: number;
    todaySteps: number;
    day: string;
  };
  storiesRead: string[];
};

const STORAGE_KEY = "leclat_progression_v1";
const STORAGE_EVENT = "leclat:progression";
const GUEST_OWNER_ID = "guest";
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const makeId = () =>
  globalThis.crypto?.randomUUID?.() || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const normalizeOwnerId = (ownerId?: string) =>
  (ownerId || GUEST_OWNER_ID).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || GUEST_OWNER_ID;

const storageKeyForOwner = (ownerId?: string) => `${STORAGE_KEY}:${normalizeOwnerId(ownerId)}`;

const getScopeOwnerId = (scope?: ProgressionScope) => normalizeOwnerId(scope?.ownerId);

const resolveMode = (scope?: ProgressionScope): ProgressionState["profile"]["mode"] =>
  scope?.mode || (scope?.ownerId ? "account" : "guest");

const levelThresholds: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
};

export const xpForLevel = (level: number) => {
  if (levelThresholds[level] !== undefined) return levelThresholds[level];
  const extra = level - 5;
  return 900 + extra * extra * 180 + extra * 140;
};

export const levelFromXp = (xp: number) => {
  let level = 1;
  for (let candidate = 2; candidate <= 50; candidate++) {
    if (xp >= xpForLevel(candidate)) level = candidate;
    else break;
  }
  return level;
};

export const levelProgress = (xp: number) => {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - current);
  return {
    level,
    nextLevel: level + 1,
    currentLevelXp: current,
    nextLevelXp: next,
    percent: Math.min(100, Math.round(((xp - current) / span) * 100)),
  };
};

export const GARMENT_CATALOG: DigitalGarment[] = fragments
  .filter((fragment) => fragment.unlocked)
  .map((fragment) => ({
    id: `garment_${fragment.id}`,
    productId: `drop01_${fragment.id}`,
    name: `T-shirt ${fragment.name}`,
    fragmentId: fragment.id,
    collection: "Drop 01",
    rarity: fragment.id === "atome" ? "rare" : "essentiel",
    previewToken: `LECLAT-${fragment.id.toUpperCase()}-TEST`,
  }));

export const AR_SKINS: ArSkin[] = [
  {
    id: "skin_wings_ascension",
    fragmentId: "eveil",
    name: "Ailes de démon",
    type: "wings",
    unityModelId: "FRAGMENT_09_ASCENSION_TEST",
    placement: "back",
    requiredLevel: 1,
    previewAvailable: true,
    description: "Présence ailée portée dans le dos.",
  },
  {
    id: "skin_wings_animated",
    fragmentId: "eveil",
    name: "Ailes animées",
    type: "wings",
    unityModelId: "FRAGMENT_13_ANIMATED_WING_TEST",
    placement: "back",
    requiredLevel: 1,
    previewAvailable: true,
    description: "Ailes légères centrées dans le dos.",
  },
  {
    id: "skin_angel_wings",
    fragmentId: "souffle",
    name: "Ailes d’ange",
    type: "wings",
    unityModelId: "FRAGMENT_10_ANGEL_WINGS_TEST",
    placement: "back",
    requiredLevel: 2,
    requiredMissionId: "first_scan",
    previewAvailable: true,
    description: "Variation claire, réservée aux porteurs ayant scanné.",
  },
  {
    id: "skin_dragon_wings",
    fragmentId: "forge",
    name: "Ailes de dragon",
    type: "wings",
    unityModelId: "FRAGMENT_11_DRAGON_WINGS_TEST",
    placement: "back",
    requiredLevel: 3,
    requiredMissionId: "first_garment",
    previewAvailable: true,
    description: "Ailes sombres, présence affirmée dans le dos.",
  },
  {
    id: "skin_mechanical_wings",
    fragmentId: "prisme",
    name: "Ailes mécaniques",
    type: "wings",
    unityModelId: "FRAGMENT_12_MECHANICAL_WINGS_TEST",
    placement: "back",
    requiredLevel: 1,
    previewAvailable: true,
    description: "Ailes mécaniques légères.",
  },
  {
    id: "skin_mecha_wings",
    fragmentId: "forge",
    name: "Ailes mécha",
    type: "wings",
    unityModelId: "FRAGMENT_14_MECHA_WINGS_TEST",
    placement: "back",
    requiredLevel: 1,
    previewAvailable: true,
    description: "Ailes mécha animées.",
  },
  {
    id: "skin_side_dragon",
    fragmentId: "prisme",
    name: "Dragon",
    type: "dragon",
    unityModelId: "FRAGMENT_15_DRAGON_TEST",
    placement: "side",
    requiredLevel: 5,
    requiredMissionId: "open_ar",
    previewAvailable: true,
    description: "Dragon compagnon, placé sur le côté.",
  },
  {
    id: "skin_shoulder_butterfly",
    fragmentId: "atome",
    name: "Papillon",
    type: "companion",
    unityModelId: "FRAGMENT_16_ANIMAL_TEST",
    placement: "shoulder",
    requiredLevel: 4,
    requiredMissionId: "quiz_first",
    previewAvailable: true,
    description: "Petit compagnon, au-dessus de l’épaule.",
  },
  {
    id: "skin_shoulder_robot",
    fragmentId: "forge",
    name: "Robot",
    type: "companion",
    unityModelId: "FRAGMENT_17_ROBOT_TEST",
    placement: "shoulder",
    requiredLevel: 6,
    requiredMissionId: "walk_1000",
    previewAvailable: true,
    description: "Compagnon robot compact.",
  },
  {
    id: "skin_fragment_orb",
    fragmentId: "atome",
    name: "Orbe",
    type: "orb",
    unityModelId: "FRAGMENT_18_ORB_TEST",
    placement: "back",
    requiredLevel: 1,
    previewAvailable: true,
    description: "Orbe discret, présence légère.",
  },
];

export const MISSIONS: MissionDefinition[] = [
  {
    id: "first_scan",
    title: "Premier scan",
    description: "Scanner un vetement ou un marqueur de test.",
    type: "scan",
    target: 1,
    rewardXp: 75,
    rewardCoins: 20,
    eventTypes: ["garment_scanned"],
  },
  {
    id: "first_garment",
    title: "T-shirt active",
    description: "Lier une piece textile au dressing digital.",
    type: "garment",
    target: 1,
    rewardXp: 125,
    rewardCoins: 35,
    eventTypes: ["garment_activated"],
  },
  {
    id: "open_ar",
    title: "Presence AR",
    description: "Ouvrir une experience AR depuis le scan.",
    type: "ar",
    target: 1,
    rewardXp: 90,
    rewardCoins: 25,
    eventTypes: ["ar_launched"],
  },
  {
    id: "scan_three_days",
    title: "Trois jours de signes",
    description: "Scanner sur trois jours differents.",
    type: "scan",
    target: 3,
    rewardXp: 220,
    rewardCoins: 60,
    eventTypes: ["garment_scanned"],
  },
  {
    id: "quiz_first",
    title: "Memoire du Voile",
    description: "Reussir une question canonique.",
    type: "quiz",
    target: 1,
    rewardXp: 80,
    rewardCoins: 20,
    eventTypes: ["quiz_completed"],
  },
  {
    id: "quiz_80",
    title: "Porteur attentif",
    description: "Obtenir au moins 80% sur une sequence quiz.",
    type: "quiz",
    target: 1,
    rewardXp: 180,
    rewardCoins: 50,
    eventTypes: ["quiz_completed"],
  },
  {
    id: "walk_1000",
    title: "Marche textile",
    description: "Avancer de 1000 pas avec le projet.",
    type: "walk",
    target: 1000,
    rewardXp: 120,
    rewardCoins: 30,
    eventTypes: ["walking_steps"],
  },
  {
    id: "read_lore",
    title: "Archive ouverte",
    description: "Debloquer ou lire une histoire canonique.",
    type: "lore",
    target: 1,
    rewardXp: 110,
    rewardCoins: 25,
    eventTypes: ["lore_opened"],
  },
  {
    id: "first_skin",
    title: "Skin revele",
    description: "Debloquer un skin AR autorise.",
    type: "unlock",
    target: 1,
    rewardXp: 100,
    rewardCoins: 35,
    eventTypes: ["skin_unlocked"],
  },
];

export const STORY_REWARDS: StoryReward[] = [
  {
    id: "forgeron_lore_niveau10",
    title: "Le Forgeron des braises froides",
    levelRequired: 10,
    sourceFile: "forgeron_lore_niveau10.jsx",
    summary: "Le Forgeron ne recompense pas. Il eprouve la tenue.",
  },
  {
    id: "sira_story_niveau20",
    title: "Sira - Le tissu carbonise",
    levelRequired: 20,
    sourceFile: "sira_story_niveau20.jsx",
    summary: "Sira regarde ce qu'un porteur parfait peut casser.",
  },
  {
    id: "archive_niveau30",
    title: "Archive niveau 30",
    levelRequired: 30,
    sourceFile: "server_reward_niveau30",
    summary: "Lecture protegee, reservee au compte eligible.",
  },
  {
    id: "archive_niveau40",
    title: "Archive niveau 40",
    levelRequired: 40,
    sourceFile: "server_reward_niveau40",
    summary: "Recompense narrative a servir cote backend.",
  },
  {
    id: "trois_visions_niveau50",
    title: "Trois visions sans explication",
    levelRequired: 50,
    sourceFile: "a_creer",
    summary: "Recompense finale de lecture, sans resolution facile.",
  },
];

export const QUIZ_BANK: QuizQuestion[] = [
  {
    id: "q-voile-filtre",
    question: "Le Voile sert d'abord a quoi ?",
    answers: ["Detruire le reel", "Filtrer la perception", "Remplacer le monde"],
    correctIndex: 1,
  },
  {
    id: "q-qr",
    question: "Un QR code seul suffit-il comme preuve definitive ?",
    answers: ["Oui", "Non", "Seulement hors ligne"],
    correctIndex: 1,
  },
  {
    id: "q-origine",
    question: "Quel fragment porte le principe du centre et de la redistribution ?",
    answers: ["L'Origine", "Le Souffle", "La Forge"],
    correctIndex: 0,
  },
  {
    id: "q-bonded",
    question: "Comment nommer une relation vetement/utilisateur validee ?",
    answers: ["Bonded", "Visible", "Libre"],
    correctIndex: 0,
  },
];

const createDefaultState = (): ProgressionState => {
  const level = DEMO_MAX ? DEMO_LEVEL : levelFromXp(0);
  return {
    version: 1,
    profile: {
      mode: "guest",
      pseudo: "Porteur",
      level,
      xpTotal: DEMO_MAX ? xpForLevel(DEMO_LEVEL) : 0,
      coins: 0,
      lang: "fr",
      createdAt: now(),
    },
    ownedGarmentIds: [],
    activeGarmentId: undefined,
    unlockedSkinIds: AR_SKINS.filter((skin) => skin.requiredLevel <= level).map((skin) => skin.id),
    activeSkinId: "skin_wings_animated",
    missions: {},
    events: [],
    scanDays: [],
    quiz: { answered: 0, correct: 0, bestPercent: 0 },
    walking: { totalSteps: 0, todaySteps: 0, day: today() },
    storiesRead: [],
  };
};

const normalizeState = (value: unknown): ProgressionState => {
  const base = createDefaultState();
  if (!value || typeof value !== "object") return base;
  const parsed = value as Partial<ProgressionState>;
  const xpTotal = Math.max(0, Number(parsed.profile?.xpTotal ?? base.profile.xpTotal));
  const level = DEMO_MAX ? Math.max(DEMO_LEVEL, levelFromXp(xpTotal)) : levelFromXp(xpTotal);
  const unlockedSkinIds = new Set([
    ...base.unlockedSkinIds,
    ...(Array.isArray(parsed.unlockedSkinIds) ? parsed.unlockedSkinIds : []),
  ]);
  return {
    ...base,
    ...parsed,
    profile: {
      ...base.profile,
      ...parsed.profile,
      xpTotal,
      coins: Math.max(0, Number(parsed.profile?.coins ?? base.profile.coins)),
      level,
    },
    ownedGarmentIds: Array.isArray(parsed.ownedGarmentIds) ? parsed.ownedGarmentIds : [],
    unlockedSkinIds: [...unlockedSkinIds],
    missions: parsed.missions || {},
    events: Array.isArray(parsed.events) ? parsed.events.slice(-80) : [],
    scanDays: Array.isArray(parsed.scanDays) ? parsed.scanDays : [],
    quiz: { ...base.quiz, ...parsed.quiz },
    walking: { ...base.walking, ...parsed.walking },
    storiesRead: Array.isArray(parsed.storiesRead) ? parsed.storiesRead : [],
  };
};

const migrateLegacyGuestStorage = () => {
  if (typeof window === "undefined") return;
  const guestKey = storageKeyForOwner(GUEST_OWNER_ID);
  if (window.localStorage.getItem(guestKey)) return;
  const legacy = window.localStorage.getItem(STORAGE_KEY);
  if (legacy) window.localStorage.setItem(guestKey, legacy);
};

const applyScope = (state: ProgressionState, scope?: ProgressionScope): ProgressionState => {
  const mode = resolveMode(scope);
  const pseudo = scope?.pseudo?.trim() || state.profile.pseudo || "Porteur";
  const lang = scope?.lang || state.profile.lang;
  if (state.profile.mode === mode && state.profile.pseudo === pseudo && state.profile.lang === lang)
    return state;
  return {
    ...state,
    profile: {
      ...state.profile,
      mode,
      pseudo,
      lang,
    },
  };
};

export const readProgression = (ownerId?: string): ProgressionState => {
  if (typeof window === "undefined") return createDefaultState();
  try {
    migrateLegacyGuestStorage();
    const raw = window.localStorage.getItem(storageKeyForOwner(ownerId));
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return createDefaultState();
  }
};

const writeProgression = (state: ProgressionState, ownerId?: string) => {
  if (typeof window === "undefined") return;
  const scopedOwnerId = getScopeOwnerId({ ownerId });
  window.localStorage.setItem(storageKeyForOwner(scopedOwnerId), JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent(STORAGE_EVENT, { detail: { ownerId: scopedOwnerId, state } }),
  );
};

const updateMissionProgress = (
  state: ProgressionState,
  eventType: AppEventType,
  payload: Record<string, unknown>,
) => {
  const nextMissions = { ...state.missions };
  for (const mission of MISSIONS) {
    if (!mission.eventTypes.includes(eventType)) continue;
    const current = nextMissions[mission.id] || { progress: 0 };
    if (current.claimedAt) {
      nextMissions[mission.id] = current;
      continue;
    }

    let progress = current.progress;
    if (mission.id === "scan_three_days") {
      progress = state.scanDays.length;
    } else if (mission.id === "walk_1000") {
      progress =
        payload.server_verified === true
          ? Math.min(mission.target, Number(payload.steps_total ?? state.walking.totalSteps))
          : progress;
    } else if (mission.id === "quiz_80") {
      const percent = Number(payload.percent ?? 0);
      progress = payload.server_verified === true && percent >= 80 ? mission.target : progress;
    } else if (mission.id === "quiz_first") {
      const correct = Boolean(payload.correct);
      progress = payload.server_verified === true && correct ? mission.target : progress;
    } else {
      progress = Math.min(mission.target, progress + 1);
    }

    nextMissions[mission.id] = {
      ...current,
      progress,
      completedAt: progress >= mission.target ? current.completedAt || now() : current.completedAt,
    };
  }
  return nextMissions;
};

export const getSkinByUnityModelId = (unityModelId: string) =>
  AR_SKINS.find((skin) => skin.unityModelId === unityModelId);

export const getSkinAccess = (skin: ArSkin, state: ProgressionState): SkinAccess => {
  if (DEMO_MAX) return "unlocked";
  if (state.unlockedSkinIds.includes(skin.id)) return "unlocked";
  if (skin.previewAvailable) return "preview";
  return "locked";
};

export const skinLockReason = (skin: ArSkin, state: ProgressionState) => {
  if (getSkinAccess(skin, state) !== "locked") return "";
  if (state.profile.level < skin.requiredLevel) return `Niveau ${skin.requiredLevel}`;
  if (skin.requiredMissionId && !state.missions[skin.requiredMissionId]?.claimedAt)
    return "Mission";
  if (skin.requiredGarmentId && !state.ownedGarmentIds.includes(skin.requiredGarmentId))
    return "Vetement";
  return "Verrouille";
};

const isEligibleForSkin = (skin: ArSkin, state: ProgressionState) => {
  if (DEMO_MAX) return true;
  if (state.profile.level < skin.requiredLevel) return false;
  if (skin.requiredMissionId && !state.missions[skin.requiredMissionId]?.claimedAt) return false;
  if (skin.requiredGarmentId && !state.ownedGarmentIds.includes(skin.requiredGarmentId))
    return false;
  return true;
};

const unlockEligibleSkins = (state: ProgressionState) => {
  const unlocked = new Set(state.unlockedSkinIds);
  const events = [...state.events];
  let changed = false;
  for (const skin of AR_SKINS) {
    if (unlocked.has(skin.id) || !isEligibleForSkin(skin, state)) continue;
    unlocked.add(skin.id);
    changed = true;
    events.push({
      id: makeId(),
      type: "skin_unlocked",
      payload: { skin_id: skin.id, unity_model_id: skin.unityModelId },
      createdAt: now(),
    });
  }
  return changed ? { ...state, unlockedSkinIds: [...unlocked], events: events.slice(-80) } : state;
};

export const getActiveUnityModelId = (state: ProgressionState) => {
  const activeSkin = AR_SKINS.find((skin) => skin.id === state.activeSkinId);
  if (activeSkin && getSkinAccess(activeSkin, state) !== "locked") return activeSkin.unityModelId;
  return (
    AR_SKINS.find((skin) => getSkinAccess(skin, state) !== "locked")?.unityModelId ||
    "FRAGMENT_09_ASCENSION_TEST"
  );
};

export const mergeRemoteProgressionSnapshot = (
  state: ProgressionState,
  snapshot: RemoteProgressionSnapshot,
): ProgressionState => {
  const xpTotal = Math.max(0, Number(snapshot.profile?.xpTotal ?? state.profile.xpTotal));
  const nextLevel = Math.max(
    DEMO_MAX ? DEMO_LEVEL : 1,
    levelFromXp(xpTotal),
    Number(snapshot.profile?.level ?? state.profile.level),
  );
  const ownedGarmentIds = snapshot.ownedGarmentIds ?? state.ownedGarmentIds;
  const unlockedSkinIds = new Set([
    ...AR_SKINS.filter((skin) => skin.requiredLevel <= nextLevel).map((skin) => skin.id),
    ...(snapshot.unlockedSkinIds ?? state.unlockedSkinIds),
  ]);
  const activeSkinId =
    snapshot.activeSkinId && AR_SKINS.some((skin) => skin.id === snapshot.activeSkinId)
      ? snapshot.activeSkinId
      : state.activeSkinId;

  return unlockEligibleSkins({
    ...state,
    profile: {
      ...state.profile,
      ...snapshot.profile,
      mode: "account",
      xpTotal,
      coins: Math.max(0, Number(snapshot.profile?.coins ?? state.profile.coins)),
      level: nextLevel,
      createdAt: snapshot.profile?.createdAt || state.profile.createdAt,
    },
    ownedGarmentIds,
    activeGarmentId: snapshot.activeGarmentId || state.activeGarmentId || ownedGarmentIds[0],
    unlockedSkinIds: [...unlockedSkinIds],
    activeSkinId,
    missions: snapshot.missions ? { ...state.missions, ...snapshot.missions } : state.missions,
  });
};

const applyEvent = (
  state: ProgressionState,
  type: AppEventType,
  payload: Record<string, unknown>,
): ProgressionState => {
  const event: AppEvent = {
    id: makeId(),
    type,
    payload,
    createdAt: now(),
  };
  let next: ProgressionState = {
    ...state,
    events: [event, ...state.events].slice(0, 80),
  };

  if (type === "garment_scanned") {
    const day = today();
    next = {
      ...next,
      scanDays: next.scanDays.includes(day) ? next.scanDays : [...next.scanDays, day],
    };
  }

  if (type === "quiz_completed") {
    const correct = Boolean(payload.correct);
    const total = Math.max(1, Number(payload.total ?? 1));
    const score = Math.max(0, Number(payload.score ?? (correct ? 1 : 0)));
    const percent = Math.round((score / total) * 100);
    next = {
      ...next,
      quiz: {
        answered: next.quiz.answered + total,
        correct: next.quiz.correct + score,
        bestPercent: Math.max(next.quiz.bestPercent, percent),
      },
    };
    payload.percent = percent;
  }

  if (type === "walking_steps") {
    const steps = Math.max(0, Number(payload.steps ?? 0));
    const currentDay = today();
    const sameDay = next.walking.day === currentDay;
    next = {
      ...next,
      walking: {
        day: currentDay,
        todaySteps: (sameDay ? next.walking.todaySteps : 0) + steps,
        totalSteps: next.walking.totalSteps + steps,
      },
    };
  }

  next = {
    ...next,
    missions: updateMissionProgress(next, type, payload),
  };
  return unlockEligibleSkins(next);
};

const mutateProgression = (
  ownerId: string,
  scope: ProgressionScope | undefined,
  mutator: (state: ProgressionState) => ProgressionState,
) => {
  const next = applyScope(mutator(applyScope(readProgression(ownerId), scope)), scope);
  writeProgression(next, ownerId);
  return next;
};

export const useLeclatProgression = (scope?: ProgressionScope) => {
  const ownerId = getScopeOwnerId(scope);
  const scopeMode = resolveMode(scope);
  const scopePseudo = scope?.pseudo;
  const scopeLang = scope?.lang;
  const readScoped = useCallback(
    () =>
      applyScope(readProgression(ownerId), {
        mode: scopeMode,
        pseudo: scopePseudo,
        lang: scopeLang,
      }),
    [ownerId, scopeLang, scopeMode, scopePseudo],
  );
  const [state, setState] = useState(readScoped);

  useEffect(() => {
    const onUpdate = (event?: Event) => {
      const detail = (event as CustomEvent<{ ownerId?: string }> | undefined)?.detail;
      if (detail?.ownerId && detail.ownerId !== ownerId) return;
      setState(readScoped());
    };
    window.addEventListener(STORAGE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    const scoped = readScoped();
    setState(scoped);
    writeProgression(scoped, ownerId);
    return () => {
      window.removeEventListener(STORAGE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [ownerId, readScoped]);

  const recordEvent = useCallback(
    (type: AppEventType, payload: Record<string, unknown> = {}) => {
      const next = mutateProgression(
        ownerId,
        { mode: scopeMode, pseudo: scopePseudo, lang: scopeLang },
        (current) => applyEvent(current, type, payload),
      );
      void import("@/lib/progressionApi")
        .then(({ syncAppEvent }) => syncAppEvent(type, payload))
        .catch(() => {
          // Sync distante best-effort : l'état local reste la source d'affichage.
        });
      return next;
    },
    [ownerId, scopeLang, scopeMode, scopePseudo],
  );

  const claimMission = useCallback(
    (missionId: string) => {
      return mutateProgression(
        ownerId,
        { mode: scopeMode, pseudo: scopePseudo, lang: scopeLang },
        (current) => {
          const mission = MISSIONS.find((item) => item.id === missionId);
          const userMission = current.missions[missionId];
          if (!mission || !userMission?.completedAt || userMission.claimedAt) return current;
          const xpTotal = current.profile.xpTotal + mission.rewardXp;
          const next: ProgressionState = {
            ...current,
            profile: {
              ...current.profile,
              xpTotal,
              coins: current.profile.coins + mission.rewardCoins,
              level: levelFromXp(xpTotal),
            },
            missions: {
              ...current.missions,
              [missionId]: { ...userMission, claimedAt: now() },
            },
          };
          return unlockEligibleSkins(
            applyEvent(next, "mission_completed", {
              mission_id: missionId,
              reward_xp: mission.rewardXp,
              reward_coins: mission.rewardCoins,
            }),
          );
        },
      );
    },
    [ownerId, scopeLang, scopeMode, scopePseudo],
  );

  const activateGarment = useCallback(
    (token: string) => {
      const normalized = token.trim().toUpperCase();
      const match =
        GARMENT_CATALOG.find((garment) => garment.previewToken.toUpperCase() === normalized) ||
        GARMENT_CATALOG.find((garment) => normalized.includes(garment.fragmentId.toUpperCase())) ||
        GARMENT_CATALOG[0];
      return mutateProgression(
        ownerId,
        { mode: scopeMode, pseudo: scopePseudo, lang: scopeLang },
        (current) => {
          if (current.ownedGarmentIds.includes(match.id)) return current;
          return applyEvent(
            {
              ...current,
              ownedGarmentIds: [...current.ownedGarmentIds, match.id],
              activeGarmentId: current.activeGarmentId || match.id,
            },
            "garment_activated",
            { garment_id: match.id, product_id: match.productId, token_preview: true },
          );
        },
      );
    },
    [ownerId, scopeLang, scopeMode, scopePseudo],
  );

  const selectSkin = useCallback(
    (skinId: string) => {
      return mutateProgression(
        ownerId,
        { mode: scopeMode, pseudo: scopePseudo, lang: scopeLang },
        (current) => {
          const skin = AR_SKINS.find((item) => item.id === skinId);
          if (!skin || getSkinAccess(skin, current) === "locked") return current;
          return { ...current, activeSkinId: skin.id };
        },
      );
    },
    [ownerId, scopeLang, scopeMode, scopePseudo],
  );

  const mergeRemoteSnapshot = useCallback(
    (snapshot: RemoteProgressionSnapshot) =>
      mutateProgression(
        ownerId,
        { mode: "account", pseudo: scopePseudo, lang: scopeLang },
        (current) => mergeRemoteProgressionSnapshot(current, snapshot),
      ),
    [ownerId, scopeLang, scopePseudo],
  );

  const addWalkingSteps = useCallback(
    (steps: number) => recordEvent("walking_steps", { steps }),
    [recordEvent],
  );

  const answerQuiz = useCallback(
    (correct: boolean) =>
      recordEvent("quiz_completed", {
        correct,
        score: correct ? 1 : 0,
        total: 1,
      }),
    [recordEvent],
  );

  const markStoryRead = useCallback(
    (storyId: string) => {
      mutateProgression(
        ownerId,
        { mode: scopeMode, pseudo: scopePseudo, lang: scopeLang },
        (current) => ({
          ...current,
          storiesRead: current.storiesRead.includes(storyId)
            ? current.storiesRead
            : [...current.storiesRead, storyId],
        }),
      );
      return recordEvent("lore_opened", { story_id: storyId });
    },
    [ownerId, recordEvent, scopeLang, scopeMode, scopePseudo],
  );

  const activeSkin = useMemo(
    () => AR_SKINS.find((skin) => skin.id === state.activeSkinId) || AR_SKINS[0],
    [state.activeSkinId],
  );

  return {
    activateGarment,
    activeSkin,
    addWalkingSteps,
    answerQuiz,
    claimMission,
    level: levelProgress(state.profile.xpTotal),
    markStoryRead,
    mergeRemoteSnapshot,
    recordEvent,
    selectSkin,
    state,
  };
};
