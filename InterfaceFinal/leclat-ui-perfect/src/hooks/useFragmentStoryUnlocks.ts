import { useEffect, useState } from "react";
import { loadStorySegments } from "@/lib/storyContentApi";
import { buildFragmentStoryUnlocks, type FragmentStory } from "@/data/storyUnlocks";

type Status = "loading" | "ready" | "error";

export const useFragmentStoryUnlocks = () => {
  const [stories, setStories] = useState<FragmentStory[] | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    loadStorySegments()
      .then((segments) => {
        if (cancelled) return;
        setStories(buildFragmentStoryUnlocks(segments));
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, stories };
};
