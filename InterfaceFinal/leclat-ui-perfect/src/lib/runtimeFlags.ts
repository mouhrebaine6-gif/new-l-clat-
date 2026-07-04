export const isUnityWebViewRuntime = (): boolean => {
  if (import.meta.env.VITE_UNITY_WEBVIEW === "1") return true;
  if (typeof window === "undefined") return false;

  return (
    document.documentElement.dataset.unityWebview === "1" ||
    /UnityPlayer|UnityWebView/i.test(navigator.userAgent)
  );
};
