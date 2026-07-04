import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Lock,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  ScanLine,
  WifiOff,
  X,
} from "lucide-react";
import { unlockedFragments, getFragment, localizeFragment, type Fragment } from "@/data/fragments";
import { usePorteur } from "@/lib/porteur";
import { FragmentIcon } from "@/components/FragmentIcon";
import { FragmentVisual } from "@/components/FragmentVisual";
import { ScanButton } from "@/components/ScanButton";
import { Ornement, Sceau } from "@/components/Sceau";
import { ScanTrace } from "@/components/motion/ScanTrace";
import { launchUnityScan, readScanCallback, isMobileDevice } from "@/lib/deeplink";
import { onUnityMessage, isInUnity, cancelUnityScan, launchAr } from "@/lib/unityBridge";
import { haptic } from "@/lib/haptics";
import { useOnline } from "@/hooks/use-online";
import { enqueueOfflineScan } from "@/lib/offlineQueue";
import { BackendStatusModule } from "@/components/BackendStatusModule";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { text, useI18n, type Localized } from "@/lib/i18n";
import { AR_SKINS, getActiveUnityModelId, getSkinAccess } from "@/lib/progression";
import { useAccountProgression } from "@/hooks/useAccountProgression";
import {
  createLocalPreviewResolution,
  hasScanBackend,
  resolveLeclatScan,
  type ScanAccessLevel,
  type ScanResolution,
  type ScanTier,
} from "@/lib/scanProgression";
import { newNonce } from "@/lib/supabaseScan";

type Phase = "idle" | "awaiting" | "scanning" | "tearing" | "revealing";
type ScanStatus = "idle" | "waiting_unity" | "camera_open" | "qr_received" | "resolved" | "error";
type ModelStatus = "local" | "remote" | "non disponible";
const SHOW_TECH = import.meta.env.VITE_SHOW_TECH === "1";

const DEFAULT_BACK_FRAGMENT_ID = "FRAGMENT_09_ASCENSION_TEST";

type ScanReceipt = {
  qrToken: string;
  publicCode?: string;
  fragmentHint?: string;
  fragmentId?: string;
  tier?: ScanTier;
  accessLevel?: ScanAccessLevel;
  qualifiedProgressDelta?: number;
  contextConfirmed?: boolean;
  status: "received" | "resolved" | "error";
  error?: string;
  timestamp: number;
};

const scanStatusLabels: Record<
  ScanStatus,
  { label: Localized<string>; detail: Localized<string> }
> = {
  idle: {
    label: text("En attente", "Waiting", "في الانتظار"),
    detail: text("Aucun passage en cours.", "No passage in progress.", "لا عبور جارٍ."),
  },
  waiting_unity: {
    label: text("Caméra appelée", "Camera called", "تم استدعاء الكاميرا"),
    detail: text(
      "Le scan s'ouvre avec la caméra.",
      "The scan opens with the camera.",
      "يفتح المسح بالكاميرا.",
    ),
  },
  camera_open: {
    label: text("Caméra ouverte", "Camera open", "الكاميرا مفتوحة"),
    detail: text(
      "Visez le logo brodé.",
      "Aim at the embroidered mark.",
      "وجّهها نحو العلامة المطرّزة.",
    ),
  },
  qr_received: {
    label: text("Signe reçu", "Mark received", "وصلت العلامة"),
    detail: text("Le tissu répond.", "The fabric answers.", "القماش يجيب."),
  },
  resolved: {
    label: text("Fragment reconnu", "Fragment recognized", "تم التعرف إلى الشذرة"),
    detail: text("Lire l'aperçu.", "Read the preview.", "اقرأ اللمحة."),
  },
  error: {
    label: text("Lecture impossible", "Cannot read", "تعذّرت القراءة"),
    detail: text(
      "Réessayez en visant le logo brodé.",
      "Try again while aiming at the embroidered mark.",
      "أعد المحاولة مع توجيه الكاميرا نحو العلامة المطرّزة.",
    ),
  },
};

const copy = {
  aim: text("Visez le logo brodé", "Aim at the embroidered mark", "وجّهها نحو العلامة المطرّزة"),
  noAr: text(
    "Aucun fragment augmenté demandé.",
    "No augmented fragment requested.",
    "لم تُطلب أي شذرة معززة.",
  ),
  unrecognized: text("Fragment non reconnu", "Fragment not recognized", "لم يتم التعرف إلى الشذرة"),
  retryLogo: text(
    "Réessayez en visant bien le logo brodé.",
    "Try again while aiming carefully at the embroidered mark.",
    "أعد المحاولة مع توجيهها جيدًا نحو العلامة المطرّزة.",
  ),
  veilClosed: text(
    "Le Voile s'est refermé un instant",
    "The Veil closed for a moment",
    "انغلق السِّتار للحظة",
  ),
  recognizedLater: text(
    "Le passage sera reconnu au retour du Voile.",
    "The passage will be recognized when the Veil returns.",
    "سيُعرَف العبور حين يعود السِّتار.",
  ),
  interrupted: text("Reconnaissance interrompue", "Recognition interrupted", "توقّف التعرّف"),
  retrySoon: text(
    "Nouvelle tentative dans 30 s.",
    "Trying again in 30s.",
    "محاولة جديدة بعد ٣٠ ثانية.",
  ),
  cameraReady: text(
    "Caméra ouverte · Approchez le logo brodé",
    "Camera open · Approach the embroidered mark",
    "الكاميرا مفتوحة · اقترب من العلامة المطرّزة",
  ),
  cancelled: text("Scan annulé", "Scan cancelled", "تم إلغاء المسح"),
  resume: text(
    "Vous pouvez reprendre quand vous voulez.",
    "You can resume whenever you want.",
    "يمكنك المتابعة متى أردت.",
  ),
  cameraDenied: text("Caméra refusée", "Camera denied", "تم رفض الكاميرا"),
  lightPreview: text(
    "L'expérience reste disponible en aperçu léger.",
    "The experience remains available as a light preview.",
    "تبقى التجربة متاحة كلمحة خفيفة.",
  ),
  recognizing: text("Reconnaissance…", "Recognizing…", "جارٍ التعرّف…"),
  openCamera: text("Ouvrir la caméra…", "Opening camera…", "فتح الكاميرا…"),
  waitingCloth: text("En attente du vêtement…", "Waiting for the garment…", "في انتظار القطعة…"),
  lightPreviewShort: text("Aperçu léger", "Light preview", "لمحة خفيفة"),
  noFragment: text("Aucun fragment à révéler", "No fragment to reveal", "لا شذرة للكشف"),
  emptyCodex: text(
    "Le Codex est encore vide.",
    "The Codex is still empty.",
    "السجل ما زال فارغًا.",
  ),
  fragmentCalled: text("Fragment appelé", "Fragment called", "تم استدعاء الشذرة"),
  presenceUnavailable: text(
    "Présence indisponible ici",
    "Presence unavailable here",
    "الحضور غير متاح هنا",
  ),
  presenceCanOpen: text(
    "La présence augmentée peut s'ouvrir.",
    "The augmented presence can open.",
    "يمكن للحضور المعزز أن ينفتح.",
  ),
  appReady: text(
    "Le bouton reste prêt dans l'app L'ÉCLAT.",
    "The button remains ready inside the L'ÉCLAT app.",
    "يبقى الزر جاهزًا داخل تطبيق L'ÉCLAT.",
  ),
  offlineButton: text("Le Voile s'est refermé", "The Veil has closed", "انغلق السِّتار"),
  scan: text("Scanner", "Scan", "امسح"),
  waiting: text("En attente", "Waiting", "في الانتظار"),
  scanSeal: text(
    "VISEZ LE LOGO BRODÉ · LE TISSU RÉPOND · ",
    "AIM AT THE EMBROIDERED MARK · THE FABRIC ANSWERS · ",
    "وجّهها نحو العلامة المطرّزة · القماش يجيب · ",
  ),
  scanCloth: text("Scanner le vêtement", "Scan the garment", "امسح القطعة"),
  intro: text(
    "Visez le logo brodé.",
    "Aim at the embroidered mark.",
    "وجّه الكاميرا نحو العلامة المطرّزة.",
  ),
  previewOnly: text(
    "Aperçu seulement · La suite reste protégée",
    "Preview only · The rest remains protected",
    "لمحة فقط · الباقي محفوظ",
  ),
  stability: text("Stabilité du Voile", "Veil stability", "ثبات السِّتار"),
  back: text("Retour", "Back", "رجوع"),
  cancel: text("Annuler", "Cancel", "إلغاء"),
  quit: text("Quitter", "Leave", "خروج"),
  threeGestures: text("Trois gestes", "Three gestures", "ثلاث حركات"),
  approach: text("Approcher", "Approach", "اقترب"),
  approachSub: text(
    "Le vêtement, près du logo brodé.",
    "The garment, near the embroidered mark.",
    "القطعة قرب العلامة المطرّزة.",
  ),
  hold: text("Tenir", "Hold", "اثبت"),
  holdSub: text(
    "Quelques secondes, sans bouger.",
    "A few seconds, without moving.",
    "ثوانٍ قليلة، بلا حركة.",
  ),
  receive: text("Recevoir", "Receive", "تلقَّ"),
  receiveSub: text(
    "Le fragment se reconnaît.",
    "The fragment recognizes itself.",
    "تتعرف الشذرة إلى نفسها.",
  ),
  thresholdTitle: text("Le seuil protège", "The threshold protects", "العتبة تحمي"),
  thresholdBody: text(
    "Un signe partagé ouvre un aperçu. La suite demande le vêtement, la présence et un lien confirmé.",
    "A shared mark opens a preview. The rest asks for the garment, presence and a confirmed link.",
    "العلامة المشتركة تفتح لمحة. وما بعدها يحتاج القطعة والحضور وصلة مؤكدة.",
  ),
  history: text(
    "Derniers fragments reconnus",
    "Latest recognized fragments",
    "آخر الشذرات المعروفة",
  ),
  none: text(
    "Aucun fragment reconnu pour l'instant.",
    "No fragment recognized yet.",
    "لم تُعرف أي شذرة بعد.",
  ),
  now: text("à l'instant", "just now", "الآن"),
  linkConfirmed: text("⊹ Lien confirmé ⊹", "⊹ Link confirmed ⊹", "⊹ تم تأكيد الصلة ⊹"),
  closeVeil: text("Refermer le Voile", "Close the Veil", "أغلق السِّتار"),
  skinLocked: text("Skin AR verrouillé", "AR skin locked", "سكين الواقع المعزز مقفل"),
  previewRitual: text("Aperçu rituel", "Ritual preview", "معاينة طقسية"),
  previewRitualDesc: text(
    "Simulation desktop — la vraie reconnaissance se fait avec la caméra.",
    "Desktop simulation — real recognition happens with the camera.",
    "محاكاة على سطح المكتب — التعرّف الحقيقي يتمّ بالكاميرا.",
  ),
};

const fragmentModels: Record<string, { name: string; status: ModelStatus; comment: string }> = {
  eveil: {
    name: "fragment_01_eveil_test.glb",
    status: "local",
    comment: "Modèle test léger à garder côté Unity.",
  },
  souffle: {
    name: "fragment_02_souffle.glb",
    status: "remote",
    comment: "À héberger plus tard dans RemoteContent/CDN.",
  },
  forge: {
    name: "fragment_03_forge.glb",
    status: "remote",
    comment: "Prévu pour chargement distant Unity.",
  },
  prisme: {
    name: "fragment_04_prisme.glb",
    status: "remote",
    comment: "Prévu pour chargement distant Unity.",
  },
  atome: {
    name: "fragment_05_atome.glb",
    status: "remote",
    comment: "Prévu pour chargement distant Unity.",
  },
};

/**
 * POST /v1/scan/resolve
 * - Sans backend (`VITE_API_BASE` vide) : on n'accorde JAMAIS un tier porteur/profond
 *   localement. On retourne au mieux un tier "preview" basé sur le hint Unity.
 * - Avec backend : la vérité est serveur. Le client ne fait que la refléter.
 * Aucune écriture dans l'état porteur (collect) ne doit être faite tant que le
 * backend ou Unity n'a pas confirmé un tier ≥ "porteur".
 */
export default function ScanPage() {
  const navigate = useNavigate();
  const { lang, tr } = useI18n();
  const [phase, setPhase] = useState<Phase>("idle");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [revealed, setRevealed] = useState<(typeof unlockedFragments)[number] | null>(null);
  const [history, setHistory] = useState<typeof unlockedFragments>([]);
  const [lastScan, setLastScan] = useState<ScanReceipt | null>(null);
  const [arRequestState, setArRequestState] = useState(tr(copy.noAr));
  const [hookText, setHookText] = useState("");
  const [stepText, setStepText] = useState(tr(copy.aim));
  const [selectedBackFragmentId, setSelectedBackFragmentId] = useState(DEFAULT_BACK_FRAGMENT_ID);
  const { recordScan, state } = usePorteur();
  const {
    recordEvent: recordProgressEvent,
    selectSkin: selectProgressionSkin,
    state: progressionState,
  } = useAccountProgression(lang);
  const reduceMotion = useReducedMotion();

  const stabilite = Math.max(20, 100 - state.qualifiedProgressPoints * 4);
  const mobile = isMobileDevice();
  const online = useOnline();
  const insideUnity = isInUnity();
  const scanActive = phase === "awaiting" || phase === "scanning";
  useEffect(() => {
    if (scanActive) return;
    const activeUnityModelId = getActiveUnityModelId(progressionState);
    setSelectedBackFragmentId((current) =>
      current === activeUnityModelId ? current : activeUnityModelId,
    );
  }, [progressionState, scanActive]);

  const resetScanState = useCallback(
    (notifyNative = true) => {
      if (notifyNative && insideUnity) cancelUnityScan();
      setPhase("idle");
      setScanStatus("idle");
      setStepText(tr(copy.aim));
      setArRequestState(tr(copy.noAr));
    },
    [insideUnity, tr],
  );

  const cancelCurrentScan = useCallback(() => {
    haptic("tap");
    resetScanState(true);
  }, [resetScanState]);

  const leaveScan = useCallback(() => {
    haptic("tap");
    resetScanState(true);
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  }, [navigate, resetScanState]);

  const reveal = useCallback(
    (fragmentId: string, resolution?: ScanResolution) => {
      const tier = resolution?.legacy_tier || "preview";
      const f = getFragment(fragmentId);
      if (!f || !f.unlocked) {
        setScanStatus("error");
        setLastScan((current) => ({
          qrToken: current?.qrToken || "unknown",
          publicCode: resolution?.public_code || current?.publicCode,
          fragmentHint: current?.fragmentHint || fragmentId,
          fragmentId,
          tier,
          accessLevel: resolution?.access_level,
          qualifiedProgressDelta: resolution?.qualified_progress_delta,
          contextConfirmed: resolution?.context_confirmed,
          status: "error",
          error: "Fragment non reconnu ou verrouillé",
          timestamp: Date.now(),
        }));
        toast(tr(copy.unrecognized), { description: tr(copy.retryLogo) });
        setPhase("idle");
        return;
      }
      setScanStatus("resolved");
      setLastScan((current) => ({
        qrToken: current?.qrToken || "web-callback",
        publicCode: resolution?.public_code || current?.publicCode,
        fragmentHint: current?.fragmentHint || fragmentId,
        fragmentId: f.id,
        tier,
        accessLevel: resolution?.access_level || "scanner_preview",
        qualifiedProgressDelta: resolution?.qualified_progress_delta || 0,
        contextConfirmed: Boolean(resolution?.context_confirmed),
        status: "resolved",
        timestamp: Date.now(),
      }));
      setPhase("tearing");
      haptic("rituel");
      setTimeout(
        () => {
          setRevealed(f);
          // SÉCURITÉ : on ne marque le fragment comme officiellement collecté que
          // si le backend a confirmé un tier ≥ porteur. Sans backend → preview only.
          recordScan({
            fragmentId: f.id,
            accessLevel: resolution?.access_level || "scanner_preview",
            bondStatus: resolution?.bond_status,
            qualifiedProgressDelta: resolution?.qualified_progress_delta || 0,
            publicCode: resolution?.public_code,
          });
          recordProgressEvent("garment_scanned", {
            fragment_id: f.id,
            unity_model_id: selectedBackFragmentId,
            access_level: resolution?.access_level || "scanner_preview",
            public_code: resolution?.public_code,
          });
          setHistory((h) => [f, ...h.filter((x) => x.id !== f.id)].slice(0, 5));
          setPhase("revealing");
        },
        reduceMotion ? 200 : 1100,
      );
    },
    [recordProgressEvent, recordScan, reduceMotion, selectedBackFragmentId, tr],
  );

  // Callback web depuis l'app AR (?fragment=eveil) — DEV / preview only.
  // En prod, ce paramètre ne déclenche pas d'unlock : il est ignoré côté client
  // sans backend pour éviter qu'une URL forgée ne marque un fragment.
  useEffect(() => {
    const fid = readScanCallback();
    if (!fid) return;
    if (!hasScanBackend() && !import.meta.env.DEV) {
      window.history.replaceState({}, "", "/scan");
      return;
    }
    reveal(fid, createLocalPreviewResolution(fid, `web-callback-${fid}`));
    window.history.replaceState({}, "", "/scan");
  }, [reveal]);

  // === Unity bridge : écoute SCAN_RESULT ===
  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let resolveInFlight = false;

    const off = onUnityMessage<{
      qr_token: string;
      fragment_hint?: string;
      marker_id?: string;
      scan_session_id?: string;
      pose_quality?: number;
      stability_ms?: number;
      timestamp?: number;
    }>("SCAN_RESULT", async (payload) => {
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (!payload?.qr_token) return;
      // Verrou anti-double message (double tap, ré-émission pont) : un seul
      // resolveLeclatScan en vol à la fois.
      if (resolveInFlight) return;
      resolveInFlight = true;
      // Nonce stable pour toute la tentative (y compris le retry 30 s) :
      // l'idempotence serveur fusionne les doublons au lieu de les recompter.
      const scanNonce = newNonce();
      setScanStatus("qr_received");
      setLastScan({
        qrToken: payload.qr_token,
        fragmentHint: payload.fragment_hint,
        status: "received",
        timestamp: payload.timestamp || Date.now(),
      });
      try {
        const r = await resolveLeclatScan({
          qrToken: payload.qr_token,
          sceauId: state.sceauId,
          hint: payload.fragment_hint,
          markerId: payload.marker_id,
          scanSessionId: payload.scan_session_id,
          poseQuality: payload.pose_quality,
          stabilityMs: payload.stability_ms,
          nonce: scanNonce,
        });
        setLastScan((current) => ({
          qrToken: current?.qrToken || payload.qr_token,
          publicCode: r.public_code,
          fragmentHint: current?.fragmentHint || payload.fragment_hint,
          fragmentId: r.fragment_id,
          tier: r.legacy_tier,
          accessLevel: r.access_level,
          qualifiedProgressDelta: r.qualified_progress_delta,
          contextConfirmed: r.context_confirmed,
          status: "resolved",
          timestamp: Date.now(),
        }));
        reveal(r.fragment_id, r);
      } catch (e) {
        setScanStatus("error");
        setLastScan((current) => ({
          qrToken: current?.qrToken || payload.qr_token,
          fragmentHint: current?.fragmentHint || payload.fragment_hint,
          status: "error",
          error: e instanceof Error ? e.message : "scan_error",
          timestamp: Date.now(),
        }));
        if (!online) {
          const hint = payload.fragment_hint;
          if (hint) enqueueOfflineScan(hint, "scan");
          toast(tr(copy.veilClosed), {
            description: tr(copy.recognizedLater),
          });
          setPhase("idle");
        } else {
          toast(tr(copy.interrupted), { description: tr(copy.retrySoon) });
          retryTimer = setTimeout(() => {
            // simple retry policy — même nonce : le serveur ne recompte pas
            // si la première tentative avait déjà été enregistrée.
            void resolveLeclatScan({
              qrToken: payload.qr_token,
              sceauId: state.sceauId,
              hint: payload.fragment_hint,
              markerId: payload.marker_id,
              scanSessionId: payload.scan_session_id,
              poseQuality: payload.pose_quality,
              stabilityMs: payload.stability_ms,
              nonce: scanNonce,
            })
              .then((r) => {
                if (!disposed) reveal(r.fragment_id, r);
              })
              .catch(() => {
                if (!disposed) setPhase("idle");
              });
          }, 30_000);
        }
      } finally {
        resolveInFlight = false;
      }
    });

    const offReady = onUnityMessage("SCAN_READY", () => {
      setPhase("scanning");
      setScanStatus("camera_open");
      setStepText(tr(copy.cameraReady));
    });
    const offCancel = onUnityMessage("SCAN_CANCEL", () => {
      resetScanState(false);
      toast(tr(copy.cancelled), { description: tr(copy.resume) });
    });
    const offError = onUnityMessage<{ code?: string; message?: string }>("ERROR", (payload) => {
      if (payload?.code !== "CAMERA_PERMISSION_DENIED") return;
      resetScanState(false);
      toast(tr(copy.cameraDenied), {
        description: tr(copy.lightPreview),
      });
    });

    return () => {
      disposed = true;
      off();
      offReady();
      offCancel();
      offError();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [reveal, state.sceauId, online, resetScanState, tr]);

  // Texte d'étape pendant scanning
  useEffect(() => {
    if (phase !== "scanning") return;
    const steps = [tr(scanStatusLabels.camera_open.label), tr(copy.aim), tr(copy.recognizing)];
    let i = 0;
    setStepText(steps[0]);
    const t = setInterval(() => {
      i++;
      if (i < steps.length) setStepText(steps[i]);
    }, 1100);
    return () => clearInterval(t);
  }, [phase, tr]);

  const launch = () => {
    if (phase !== "idle") return;
    haptic("select");
    setArRequestState(tr(copy.noAr));

    if (!online) {
      setScanStatus("error");
      toast(tr(copy.offlineButton), {
        description: tr(copy.recognizedLater),
      });
      return;
    }

    setRevealed(null);
    setLastScan(null);
    setHookText("");

    if (insideUnity) {
      // Dans Unity : on demande au host d'ouvrir la caméra et on attend SCAN_READY/SCAN_RESULT
      setPhase("awaiting");
      setScanStatus("waiting_unity");
      setStepText(tr(copy.waitingCloth));
      launchUnityScan(selectedBackFragmentId);
      return;
    }

    if (mobile) {
      // Tentative de deeplink vers l'app AR installée
      launchUnityScan(selectedBackFragmentId);
      setPhase("awaiting");
      setScanStatus("waiting_unity");
      setStepText(tr(copy.openCamera));
      // Si l'app n'est pas installée, on retombe en idle après 4 s
      setTimeout(() => setPhase((p) => (p === "awaiting" ? "idle" : p)), 4000);
      return;
    }

    // Desktop sans backend ni Unity : on informe poliment
    // Mode aperçu rituel : on simule une révélation pour permettre la visualisation
    // de l'animation complète (sans jamais marquer le fragment comme collecté).
    const pool = unlockedFragments;
    if (pool.length === 0) {
      toast(tr(copy.noFragment), { description: tr(copy.emptyCodex) });
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setPhase("awaiting");
    setScanStatus("waiting_unity");
    setStepText(tr(copy.lightPreviewShort));
    if (SHOW_TECH) {
      toast(tr(copy.previewRitual), {
        description: tr(copy.previewRitualDesc),
      });
    }
    setTimeout(
      () => {
        setPhase("scanning");
        setScanStatus("camera_open");
      },
      reduceMotion ? 100 : 700,
    );
    setTimeout(
      () => {
        setLastScan({
          qrToken: `preview-${pick.id}-${Date.now()}`,
          publicCode: `PREVIEW-${pick.id.toUpperCase()}`,
          fragmentHint: pick.id,
          accessLevel: "scanner_preview",
          qualifiedProgressDelta: 0,
          contextConfirmed: false,
          status: "received",
          timestamp: Date.now(),
        });
        reveal(pick.id, createLocalPreviewResolution(pick.id, `preview-${pick.id}`));
      },
      reduceMotion ? 300 : 1800,
    );
  };

  const receivedFragmentId = revealed?.id || lastScan?.fragmentId || lastScan?.fragmentHint || "";
  const receivedFragment = receivedFragmentId
    ? localizeFragment(getFragment(receivedFragmentId), lang)
    : null;
  const modelInfo = receivedFragment ? fragmentModels[receivedFragment.id] : undefined;

  const requestFragmentAr = (fragmentId: string, mode: "preview" | "rituel" = "rituel") => {
    haptic("select");
    const sent = launchAr(selectedBackFragmentId, mode);
    if (sent) {
      recordProgressEvent("ar_launched", {
        fragment_id: fragmentId,
        unity_model_id: selectedBackFragmentId,
        mode,
      });
    }
    setArRequestState(
      sent
        ? `${tr(copy.fragmentCalled)} - ${selectedBackFragmentId}.`
        : tr(copy.presenceUnavailable),
    );
    toast(sent ? tr(copy.fragmentCalled) : tr(copy.presenceUnavailable), {
      description: sent ? tr(copy.presenceCanOpen) : tr(copy.appReady),
    });
  };

  const close = () => {
    haptic("tap");
    if (insideUnity) cancelUnityScan();
    setPhase("idle");
    setScanStatus("idle");
    setRevealed(null);
    setHookText("");
    setStepText(tr(copy.aim));
  };

  // Effet machine à écrire pour le hook
  useEffect(() => {
    if (phase !== "revealing" || !revealed) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setHookText(revealed.hook.slice(0, i));
      if (i >= revealed.hook.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [phase, revealed]);

  const buttonLabel = !online
    ? tr(copy.offlineButton)
    : phase === "awaiting"
      ? tr(copy.waitingCloth)
      : phase === "scanning"
        ? tr(copy.recognizing)
        : phase === "idle"
          ? tr(copy.scan)
          : tr(copy.recognizing);

  const buttonHint = !online
    ? tr(copy.recognizedLater)
    : phase === "awaiting"
      ? tr(copy.aim)
      : tr(copy.aim);

  return (
    <div className="pb-12 relative">
      <div className="sticky top-14 z-30 px-4 pt-3 safe-top">
        <div className="mx-auto flex max-w-sm items-center justify-between gap-3 border border-border/50 bg-background/95 px-3 py-2 shadow-textile">
          <button
            type="button"
            onClick={leaveScan}
            className="tap inline-flex items-center gap-2 font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim transition hover:text-laiton active:text-laiton"
            aria-label={tr(copy.back)}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
            {tr(copy.back)}
          </button>
          {scanActive ? (
            <button
              type="button"
              onClick={cancelCurrentScan}
              className="tap inline-flex items-center gap-2 font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton transition active:text-foreground"
              aria-label={tr(copy.cancel)}
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.cancel)}
            </button>
          ) : (
            <button
              type="button"
              onClick={launch}
              disabled={!online || phase !== "idle"}
              className="tap inline-flex items-center gap-2 font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton transition active:text-foreground disabled:text-voile-dim/45"
              aria-label={tr(copy.scan)}
            >
              <ScanLine className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.scan)}
            </button>
          )}
        </div>
      </div>

      {/* En-tête */}
      <section className="px-6 pt-8 pb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 ciel-poussiere opacity-50 anim-drift pointer-events-none" />
        <div className="relative">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-3">
            {tr(text("Rituel d'entrée · III", "Entry ritual · III", "طقس الدخول · III"))}
          </p>
          <h1 className="font-serif-rituel text-4xl sm:text-6xl leading-none">
            {tr(copy.scanCloth)}
          </h1>
          <p className="font-serif-rituel italic text-base text-voile-dim mt-3">{tr(copy.intro)}</p>
          {!hasScanBackend() && SHOW_TECH && (
            <p className="mt-4 inline-block font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton/80 border border-laiton/30 px-2.5 py-1">
              {tr(copy.previewOnly)}
            </p>
          )}
          <Ornement className="mt-5 max-w-[12rem] mx-auto" />
        </div>
      </section>

      {/* Stabilité du voile */}
      <section className="px-6 mb-6 max-w-sm mx-auto">
        <div className="flex items-baseline justify-between mb-2">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
            {tr(copy.stability)}
          </p>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {stabilite}%
          </p>
        </div>
        <div className="relative h-px w-full bg-border">
          <div
            className="absolute inset-y-0 left-0 ligne-sacrée"
            style={{ width: `${stabilite}%`, height: "1px" }}
          />
        </div>
      </section>

      {/* Présence à afficher en AR — choix utilisateur (uniquement ici) */}
      <section className="px-6 mb-7 max-w-sm mx-auto">
        <p className="mb-3 text-center font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
          {tr(text("Présence à afficher", "Presence to display", "الحضور المعروض"))}
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {AR_SKINS.map((skin) => {
            const locked = getSkinAccess(skin, progressionState) === "locked";
            const active = selectedBackFragmentId === skin.unityModelId;
            return (
              <button
                key={skin.id}
                type="button"
                disabled={scanActive || locked}
                onClick={() => {
                  haptic("select");
                  selectProgressionSkin(skin.id);
                  setSelectedBackFragmentId(skin.unityModelId);
                }}
                aria-pressed={active}
                className={`tap flex-none rounded-full border px-4 py-2 font-mono-eclat text-[10px] uppercase tracking-rituel transition disabled:opacity-60 ${
                  active
                    ? "border-laiton bg-laiton/15 text-laiton"
                    : locked
                      ? "border-border/40 text-voile-dim/40"
                      : "border-border/60 text-voile-dim hover:border-laiton/40 hover:text-laiton"
                }`}
              >
                {locked && <Lock className="mr-1.5 inline h-3 w-3" strokeWidth={1.5} />}
                {skin.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Viseur */}
      <section className="px-6">
        {/* V2 — trace animée au-dessus du viseur */}
        <div className="my-6 mx-auto max-w-sm lumen" aria-hidden="true">
          <ScanTrace />
        </div>
        <div className="relative aspect-square w-full max-w-[17.5rem] sm:max-w-sm mx-auto">
          <div
            className="absolute inset-0 anim-respire pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(var(--laiton) / 0.18), transparent 65%)",
            }}
          />

          {/* Anneaux orbitaux (repris du mockup premium) */}
          {!reduceMotion && (
            <>
              <motion.div
                aria-hidden="true"
                className="absolute inset-1 rounded-full border border-dashed border-laiton/25 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, ease: "linear", repeat: Infinity }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute inset-1 rounded-full pointer-events-none"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent, hsl(var(--laiton) / 0.14), transparent 30%)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, ease: "linear", repeat: Infinity }}
              />
            </>
          )}

          <div className="absolute inset-4 opacity-20 pointer-events-none">
            <Sceau className="w-full h-full" label={tr(copy.scanSeal)} />
          </div>

          <div className="absolute inset-8 border border-laiton/30">
            {[
              "top-0 left-0 border-t border-l",
              "top-0 right-0 border-t border-r",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((c, i) => (
              <span key={i} className={`absolute w-6 h-6 border-laiton ${c}`} />
            ))}

            <AnimatePresence>
              {(phase === "scanning" || phase === "awaiting") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 overflow-hidden"
                >
                  <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-laiton to-transparent anim-faille" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                >
                  <ScanLine className="w-8 h-8 text-laiton/60" strokeWidth={1} />
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
                    {tr(copy.waiting)}
                  </p>
                </motion.div>
              )}
              {(phase === "scanning" || phase === "awaiting") && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center px-4 text-center"
                >
                  <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton anim-respire">
                    {stepText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          <ScanButton
            onClick={launch}
            disabled={phase !== "idle"}
            voileFerme={!online}
            label={buttonLabel}
            hint={buttonHint}
          />
        </div>
        {scanActive && (
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <Button
              type="button"
              variant="pierre"
              size="lg"
              onClick={cancelCurrentScan}
              className="min-h-12 whitespace-normal px-4 text-center"
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.cancel)}
            </Button>
            <Button
              type="button"
              variant="voile"
              size="lg"
              onClick={leaveScan}
              className="min-h-12 whitespace-normal px-4 text-center"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
              {tr(copy.quit)}
            </Button>
          </div>
        )}
      </section>

      {SHOW_TECH && (
        <section className="px-6 mt-8 space-y-3">
          <UnityScanModule
            scanStatus={scanStatus}
            insideUnity={insideUnity}
            online={online}
            onLaunch={launch}
            disabled={phase !== "idle"}
          />
          <FragmentReceivedModule
            fragment={receivedFragment ?? null}
            lastScan={lastScan}
            onOpenAr={() => receivedFragment && requestFragmentAr(receivedFragment.id, "rituel")}
          />
          <ModelModule
            fragment={receivedFragment ?? null}
            modelInfo={modelInfo}
            requestState={arRequestState}
            onRequestAr={() =>
              receivedFragment && requestFragmentAr(receivedFragment.id, "preview")
            }
          />
          <BackendStatusModule compact />
        </section>
      )}

      {/* Trois gestes */}
      <section className="px-6 mt-12">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4 text-center">
          {tr(copy.threeGestures)}
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["I", tr(copy.approach), tr(copy.approachSub)],
            ["II", tr(copy.hold), tr(copy.holdSub)],
            ["III", tr(copy.receive), tr(copy.receiveSub)],
          ].map(([n, t, d]) => (
            <div
              key={n as string}
              className="text-center space-y-2 px-2 py-3 border-t border-laiton/15"
            >
              <p className="font-serif-rituel italic text-laiton text-3xl leading-none">{n}</p>
              <p className="font-serif-rituel text-base">{t}</p>
              <p className="font-mono-eclat text-[8px] tracking-rituel uppercase text-voile-dim/80 leading-snug">
                {d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 mt-8 max-w-sm mx-auto text-center border-y border-laiton/15 py-5">
        <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
          {tr(copy.thresholdTitle)}
        </p>
        <p className="mt-2 font-serif-rituel italic text-base leading-snug text-voile-dim">
          {tr(copy.thresholdBody)}
        </p>
      </section>

      {/* Historique */}
      <section className="px-6 mt-12">
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(copy.history)}
          </p>
          <span className="font-mono-eclat text-[10px] tracking-rituel uppercase text-voile-dim">
            {history.length}/5
          </span>
        </div>
        {history.length === 0 ? (
          <p className="font-serif-rituel italic text-voile-dim text-sm border-t border-b border-border/30 py-6 text-center">
            {tr(copy.none)}
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-4 border-b border-border/40 hover:border-laiton/40 transition-colors p-3 bg-gradient-to-r from-card/30 to-transparent"
              >
                <FragmentIcon id={f.id} className="w-5 h-5 text-laiton shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim">
                    Fragment {f.number}
                  </p>
                  <p className="font-serif-rituel text-lg leading-none mt-0.5">
                    {localizeFragment(f, lang)?.name}
                  </p>
                </div>
                <span className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim/60">
                  {tr(copy.now)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === OVERLAY CINÉMATIQUE PLEIN ÉCRAN === */}
      <AnimatePresence>
        {(phase === "tearing" || phase === "revealing") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.2 : 0.5 }}
            className="fixed inset-0 z-[70] bg-noir-profond overflow-hidden safe-top safe-bottom"
          >
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: reduceMotion ? 0.3 : 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "center", willChange: "transform" }}
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-laiton to-transparent"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: phase === "revealing" ? "100vw" : "8px" }}
              transition={{
                duration: reduceMotion ? 0.4 : 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-laiton/15 to-transparent pointer-events-none"
            />

            <div className="absolute inset-0 ciel-poussiere opacity-80 anim-drift pointer-events-none" />

            <AnimatePresence>
              {phase === "revealing" && revealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0.3 : 0.8,
                    delay: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative h-full flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto"
                >
                  <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mb-4">
                    {tr(scanStatusLabels.resolved.label)}
                  </p>
                  <p className="font-mono-eclat text-[9px] tracking-rituel uppercase text-voile-dim mb-8">
                    N° {revealed.number}
                  </p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0.3 : 1.0,
                      delay: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative my-4 w-72 h-72 sm:w-80 sm:h-80"
                  >
                    <FragmentVisual
                      id={revealed.id}
                      alt={revealed.name}
                      loading="eager"
                      withAura
                      className="w-full h-full"
                    />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="font-serif-rituel text-5xl sm:text-6xl mt-6"
                  >
                    {revealed.name}
                  </motion.h2>

                  <p className="font-serif-rituel italic text-lg sm:text-xl text-voile-dim mt-6 leading-snug min-h-[3.5rem] max-w-md">
                    « {hookText}
                    <span className="text-laiton anim-respire">|</span> »
                  </p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                    className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton mt-8"
                  >
                    {lastScan?.accessLevel === "scanner_preview"
                      ? tr(copy.previewOnly)
                      : tr(copy.linkConfirmed)}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7, duration: 0.6 }}
                    className="mt-10"
                  >
                    <Button variant="rituel" size="lg" onClick={close} className="gap-3">
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.25} /> {tr(copy.closeVeil)}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const UnityScanModule = ({
  scanStatus,
  insideUnity,
  online,
  disabled,
  onLaunch,
}: {
  scanStatus: ScanStatus;
  insideUnity: boolean;
  online: boolean;
  disabled: boolean;
  onLaunch: () => void;
}) => {
  const { tr } = useI18n();
  const status = scanStatusLabels[scanStatus];
  const showTechnical = SHOW_TECH;

  return (
    <div className="relative bg-gradient-to-b from-card/30 to-transparent p-5 border-t border-laiton/15">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(text("Reconnaissance du tissu", "Fabric recognition", "تعرّف القماش"))}
          </p>
          <h2 className="font-serif-rituel text-3xl leading-tight">
            {tr(text("Reconnaissance native", "Native recognition", "تعرّف أصلي"))}
          </h2>
        </div>
        {showTechnical && (
          <StatusPill active={insideUnity} label={insideUnity ? "Unity" : "Navigateur"} />
        )}
        {!showTechnical && !online && (
          <span className="font-mono-eclat text-[9px] tracking-rituel uppercase text-laiton/70 inline-flex items-center gap-1.5">
            <WifiOff className="w-3 h-3" strokeWidth={1.25} />
            Hors ligne
          </span>
        )}
      </div>

      {showTechnical && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <InfoLine
            icon={Radio}
            label="État"
            value={tr(status.label)}
            active={scanStatus !== "idle" && scanStatus !== "error"}
          />
          <InfoLine
            icon={online ? ShieldCheck : WifiOff}
            label={tr(text("Réseau", "Network", "الشبكة"))}
            value={
              online
                ? tr(text("Disponible", "Available", "متاحة"))
                : tr(text("Hors ligne", "Offline", "دون اتصال"))
            }
            active={online}
          />
        </div>
      )}

      <p className="mb-4 font-serif-rituel italic text-base leading-snug text-voile-dim">
        {showTechnical
          ? tr(status.detail)
          : tr(
              text(
                "Approchez le tissu, laissez la caméra reconnaître le signe brodé.",
                "Bring the fabric closer and let the camera recognize the embroidered mark.",
                "قرّب القماش ودع الكاميرا تتعرّف إلى العلامة المطرّزة.",
              ),
            )}
      </p>

      <Button
        variant="rituel"
        size="lg"
        onClick={onLaunch}
        disabled={disabled || !online}
        className="min-h-12 w-full whitespace-normal px-4 text-center"
      >
        <ScanLine className="h-4 w-4" strokeWidth={1.25} />
        {tr(text("Ouvrir la caméra", "Open camera", "افتح الكاميرا"))}
      </Button>
    </div>
  );
};

const FragmentReceivedModule = ({
  fragment,
  lastScan,
  onOpenAr,
}: {
  fragment: Fragment | null;
  lastScan: ScanReceipt | null;
  onOpenAr: () => void;
}) => {
  const { tr } = useI18n();
  const showTechnical = SHOW_TECH;
  return (
    <div className="relative bg-gradient-to-b from-card/30 to-transparent p-5 border-t border-laiton/15 overflow-hidden">
      {fragment && (
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <FragmentIcon id={fragment.id} className="w-40 h-40 text-laiton" />
        </div>
      )}
      <div className="relative mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(text("Fragment reçu", "Fragment received", "وصلت الشذرة"))}
          </p>
          <h2 className="font-serif-rituel text-3xl leading-tight">
            {fragment
              ? fragment.name
              : tr(text("En attente du tissu", "Waiting for the fabric", "في انتظار القماش"))}
          </h2>
          {fragment && (
            <p className="font-serif-rituel italic text-sm text-voile-dim mt-1">
              N° {fragment.number} · {fragment.colorLabel}
            </p>
          )}
        </div>
        {fragment ? (
          <FragmentIcon id={fragment.id} className="h-8 w-8 text-laiton" />
        ) : (
          <Box className="h-7 w-7 text-voile-dim/60" strokeWidth={1.25} />
        )}
      </div>

      {showTechnical && (
        <div className="grid gap-2 sm:grid-cols-3">
          <InfoLine
            icon={CheckCircle2}
            label="ID"
            value={fragment?.id || lastScan?.fragmentHint || "en attente"}
            active={Boolean(fragment)}
          />
          <InfoLine
            icon={Radio}
            label="Reconnaissance"
            value={lastScan?.status || "idle"}
            active={lastScan?.status === "resolved"}
          />
          <InfoLine
            icon={ShieldCheck}
            label="Tier"
            value={lastScan?.tier || "preview"}
            active={lastScan?.tier !== undefined && lastScan.tier !== "preview"}
          />
        </div>
      )}

      {lastScan?.error && (
        <p className="mt-3 border-l border-destructive/60 pl-3 py-1 font-serif-rituel italic text-sm text-voile-dim">
          {tr(
            text(
              "Le passage n'a pas été reconnu. Réessayez en visant le logo brodé.",
              "The passage was not recognized. Try again while aiming at the embroidered mark.",
              "لم يتم التعرف إلى العبور. أعد المحاولة مع توجيه الكاميرا نحو العلامة المطرّزة.",
            ),
          )}
        </p>
      )}

      <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          asChild
          variant="pierre"
          size="lg"
          disabled={!fragment}
          className="min-h-12 whitespace-normal px-4 text-center"
        >
          <Link to={fragment ? `/fragments/${fragment.id}` : "/fragments"}>
            {tr(text("Ouvrir le fragment", "Open fragment", "افتح الشذرة"))}
          </Link>
        </Button>
        <Button
          variant="voile"
          size="lg"
          disabled={!fragment}
          onClick={onOpenAr}
          className="min-h-12 whitespace-normal px-4 text-center"
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.25} />
          {tr(text("Ouvrir en AR", "Open in AR", "فتح بالواقع المعزز"))}
        </Button>
      </div>
    </div>
  );
};

const ModelModule = ({
  fragment,
  modelInfo,
  requestState,
  onRequestAr,
}: {
  fragment: Fragment | null;
  modelInfo?: { name: string; status: ModelStatus; comment: string };
  requestState: string;
  onRequestAr: () => void;
}) => {
  const { tr } = useI18n();
  const showTechnical = SHOW_TECH;
  const model = modelInfo || {
    name: fragment
      ? `fragment_${fragment.number}_${fragment.id}.glb`
      : tr(text("Aucun modèle sélectionné", "No model selected", "لا نموذج محدد")),
    status: "non disponible" as ModelStatus,
    comment: fragment
      ? tr(
          text(
            "Entrée manifest à créer côté RemoteContent.",
            "Manifest entry to create later.",
            "مدخل البيان سيُنشأ لاحقًا.",
          ),
        )
      : tr(
          text(
            "Scannez ou simulez un fragment avant de demander l'AR.",
            "Scan or preview a fragment before requesting AR.",
            "امسح شذرة أو عاينها قبل طلب الواقع المعزز.",
          ),
        ),
  };
  // En production : on ne montre pas le nom de fichier .glb à l'utilisateur final.
  const titre = showTechnical
    ? model.name
    : fragment
      ? tr(
          text(
            "Modèle vivant en réalité augmentée",
            "Living model in augmented reality",
            "نموذج حي بالواقع المعزز",
          ),
        )
      : tr(text("Aucun modèle disponible", "No model available", "لا نموذج متاح"));

  return (
    <div className="relative bg-gradient-to-b from-card/30 to-transparent p-5 border-t border-laiton/15">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono-eclat text-[10px] tracking-rituel uppercase text-laiton">
            {tr(text("Modèle 3D", "3D model", "نموذج ثلاثي الأبعاد"))}
          </p>
          <h2 className="font-serif-rituel text-3xl leading-tight">{titre}</h2>
        </div>
        <Box className="h-7 w-7 text-laiton" strokeWidth={1.25} />
      </div>

      {showTechnical && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <InfoLine
            icon={Box}
            label={tr(text("Statut", "Status", "الحالة"))}
            value={model.status}
            active={model.status !== "non disponible"}
          />
          <InfoLine
            icon={Send}
            label={tr(text("Demande AR", "AR request", "طلب الواقع المعزز"))}
            value={requestState}
            active={requestState.startsWith("Le fragment")}
          />
        </div>
      )}

      <p className="mb-4 font-serif-rituel italic text-base leading-snug text-voile-dim">
        {showTechnical
          ? `${model.comment} ${tr(text("Le web ne charge pas de gros GLB : l'app garde le rendu augmenté.", "The web layer does not load heavy GLB files: the app keeps the augmented rendering.", "طبقة الويب لا تحمّل ملفات ثقيلة: التطبيق يتولى العرض المعزز."))}`
          : fragment
            ? tr(
                text(
                  "Ouvrez le fragment dans votre espace.",
                  "Open the fragment in your space.",
                  "افتح الشذرة في مساحتك.",
                ),
              )
            : tr(
                text(
                  "Reconnaissez d'abord un fragment pour ouvrir sa présence augmentée.",
                  "Recognize a fragment first to open its augmented presence.",
                  "تعرّف إلى شذرة أولًا لفتح حضورها المعزز.",
                ),
              )}
      </p>

      <Button
        variant="voile"
        size="lg"
        disabled={!fragment}
        onClick={onRequestAr}
        className="min-h-12 w-full whitespace-normal px-4 text-center"
      >
        <Send className="h-4 w-4" strokeWidth={1.25} />
        {tr(text("Ouvrir le fragment en AR", "Open fragment in AR", "افتح الشذرة بالواقع المعزز"))}
      </Button>
    </div>
  );
};

const InfoLine = ({
  icon: Icon,
  label,
  value,
  active,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  label: string;
  value: string;
  active: boolean;
}) => (
  <div className="border-l border-laiton/30 bg-noir-profond/30 px-3 py-2">
    <p className="mb-1 flex items-center gap-2 font-mono-eclat text-[8px] uppercase tracking-rituel text-voile-dim">
      <Icon className="h-3 w-3 text-laiton/80" strokeWidth={1.25} />
      {label}
    </p>
    <p
      className={`break-words font-serif-rituel text-base leading-tight ${active ? "text-laiton" : "text-voile-dim"}`}
    >
      {value}
    </p>
  </div>
);

const StatusPill = ({ active, label }: { active: boolean; label: string }) => (
  <span
    className={`shrink-0 border px-2 py-1 font-mono-eclat text-[8px] uppercase tracking-rituel ${active ? "border-laiton/50 text-laiton" : "border-border/60 text-voile-dim"}`}
  >
    {label}
  </span>
);
