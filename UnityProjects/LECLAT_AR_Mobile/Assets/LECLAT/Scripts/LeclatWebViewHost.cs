using UnityEngine;
#if LECLAT_GREE_WEBVIEW
using System.IO;
using Gree.UnityWebView; // WebViewObject (variante UPM package-nofragment)
#endif

namespace Leclat.AR
{
    /// <summary>
    /// Hôte WebView (GREE unity-webview) : fait tourner l'app React (StreamingAssets)
    /// DANS Unity et relie le pont natif.
    ///
    ///   natif → web : LeclatNativeBridge.MessageToWeb  → EvaluateJS(window.postMessage)
    ///   web → natif : window.Unity.call(json)          → LeclatNativeBridge.ReceiveFromWeb
    ///
    /// Le pont web (unityBridge.ts) supporte déjà `window.Unity.call` (transport GREE)
    /// et l'écoute des 'message' — aucun changement web requis.
    ///
    /// INSTALLATION (manuelle, dans ton Éditeur) :
    ///   1. Importer gree/unity-webview (.unitypackage) — https://github.com/gree/unity-webview
    ///   2. Player Settings ▸ Other ▸ Scripting Define Symbols : ajouter  LECLAT_GREE_WEBVIEW
    ///   3. Rebuild. Le define active le code ci-dessous.
    /// Sans le define, ce composant ne fait que logguer (le projet reste compilable).
    /// </summary>
    public sealed class LeclatWebViewHost : MonoBehaviour
    {
        private LeclatNativeBridge bridge;
#if LECLAT_GREE_WEBVIEW
        private WebViewObject webView;
#endif

        private void Start()
        {
            bridge = GetComponent<LeclatNativeBridge>() ?? FindAnyObjectByType<LeclatNativeBridge>();
            if (bridge == null)
            {
                Debug.LogError("[LECLAT] WebViewHost : LeclatNativeBridge introuvable.");
                return;
            }

#if LECLAT_GREE_WEBVIEW
            var go = new GameObject("LECLAT_WebView");
            go.transform.SetParent(transform, false);
            webView = go.AddComponent<WebViewObject>();

            // cb = messages JS → natif (le web fait window.Unity.call(json)).
            // transparent: true → la caméra Vuforia (rendue par Unity DERRIÈRE la
            // WebView) devient visible partout où le web est transparent. Le web
            // reste opaque partout SAUF pendant le scan (classe .leclat-scan-live),
            // où il se rend transparent pour laisser voir la caméra AR.
            webView.Init(cb: OnMessageFromWeb, transparent: true, enableWKWebView: true);
            bridge.MessageToWeb += OnMessageToWeb;

            webView.LoadURL(ResolveIndexUrl());
            webView.SetMargins(0, 0, 0, 0);
            webView.SetVisibility(true);
            Debug.Log("[LECLAT] WebViewHost (GREE) actif.");
#else
            Debug.LogWarning(
                "[LECLAT] WebViewHost inactif : importe gree/unity-webview puis ajoute le define " +
                "LECLAT_GREE_WEBVIEW (Player Settings ▸ Scripting Define Symbols). Sans WebView, le " +
                "pont logue MessageToWeb mais l'app React ne s'affiche pas.");
#endif
        }

#if LECLAT_GREE_WEBVIEW
        // StreamingAssets → URL chargeable par le WebView selon la plateforme.
        private static string ResolveIndexUrl()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            // Sur Android, StreamingAssets vit dans l'APK et est exposé via android_asset.
            return "file:///android_asset/LECLAT/WebUI/index.html";
#else
            return "file://" + Path.Combine(Application.streamingAssetsPath, "LECLAT", "WebUI", "index.html");
#endif
        }

        private void OnMessageFromWeb(string json)
        {
            if (!string.IsNullOrEmpty(json))
                bridge.ReceiveFromWeb(json);
        }

        private void OnMessageToWeb(string json)
        {
            if (webView == null)
                return;
            // Le pont web écoute l'événement 'message' → on relaie l'enveloppe JSON telle quelle.
            webView.EvaluateJS("window.postMessage(" + json + ", '*');");
        }

        private void OnDestroy()
        {
            if (bridge != null)
                bridge.MessageToWeb -= OnMessageToWeb;
        }
#endif
    }
}
