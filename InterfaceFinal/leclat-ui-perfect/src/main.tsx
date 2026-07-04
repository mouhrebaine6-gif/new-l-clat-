import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./legacy.css";
import LegacyApp from "./LegacyApp";
import { isUnityWebViewRuntime } from "@/lib/runtimeFlags";
import { MotionProvider } from "@/providers/MotionProvider";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root introuvable.");
}

if (isUnityWebViewRuntime()) {
  document.documentElement.dataset.unityWebview = "1";
  document.documentElement.classList.add("unity-webview");
}

createRoot(root).render(
  <StrictMode>
    <MotionProvider>
      <LegacyApp />
    </MotionProvider>
  </StrictMode>,
);
