import { supabase } from "@/lib/supabaseClient";
import type { Lang } from "@/lib/i18n";

/**
 * Le texte du roman (30 segments x FR/EN/AR) vit dans Supabase
 * (public.story_segments, lecture publique) plutôt que dans le bundle JS —
 * ces fichiers pesaient ~470 Ko à eux seuls. Récupéré une fois, mis en cache
 * mémoire + localStorage pour les visites suivantes et le mode hors-ligne.
 */
export type StorySegmentsByLang = Record<Lang, string[][]>;

const CACHE_KEY = "eclat_story_segments_v1";

let memoryCache: StorySegmentsByLang | null = null;
let inFlight: Promise<StorySegmentsByLang> | null = null;

const emptySegments = (): StorySegmentsByLang => ({ fr: [], en: [], ar: [] });

function readLocalCache(): StorySegmentsByLang | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as StorySegmentsByLang) : null;
  } catch {
    return null;
  }
}

function writeLocalCache(data: StorySegmentsByLang) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Stockage indisponible ou plein : le cache mémoire suffit pour la session.
  }
}

async function fetchFromSupabase(): Promise<StorySegmentsByLang> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("story_segments")
    .select("lang, segment_index, paragraphs")
    .order("segment_index", { ascending: true });
  if (error) throw error;

  const result = emptySegments();
  for (const row of data ?? []) {
    const lang = row.lang as Lang;
    const paragraphs = row.paragraphs as string[];
    if (result[lang]) result[lang][row.segment_index as number] = paragraphs;
  }
  return result;
}

export async function loadStorySegments(): Promise<StorySegmentsByLang> {
  if (memoryCache) return memoryCache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const data = await fetchFromSupabase();
      memoryCache = data;
      writeLocalCache(data);
      return data;
    } catch (err) {
      const cached = readLocalCache();
      if (cached) {
        memoryCache = cached;
        return cached;
      }
      throw err;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
