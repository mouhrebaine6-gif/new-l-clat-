using System;
using System.Reflection;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// QR decoder bridge. ML Kit can be added later behind this facade; ZXing.NET is
    /// used when a compatible zxing.dll is present in Assets/Plugins.
    ///
    /// Perf (scan QR à 5 Hz) : la résolution par réflexion (types/méthode/propriété)
    /// et le lecteur ZXing sont RÉSOLUS UNE FOIS puis mis en cache. Le buffer RGB est
    /// réutilisé entre les frames. Avant : ~3 Mo + 10 appels de réflexion par tentative.
    /// </summary>
    public static class LeclatQrDecoder
    {
        private static Assembly zxingAssembly;
        private static bool searchedAssembly;
        private static string lastBackendStatus = "not_checked";

        // Cache de réflexion — résolu une seule fois.
        private static bool apiResolved;
        private static bool apiOk;
        private static Type luminanceType, hybridType, bitmapType;
        private static MethodInfo decodeMethod;
        private static PropertyInfo textProperty;
        private static object reader; // MultiFormatReader réutilisable

        // Buffer RGB réutilisé (évite ~3 Mo d'alloc GC par tentative).
        private static byte[] rgbBuffer;

        public static string BackendStatus => lastBackendStatus;

        public static bool TryDecode(Color32[] pixels, int width, int height, out string text)
        {
            text = string.Empty;
            if (pixels == null || pixels.Length == 0 || width <= 0 || height <= 0)
            {
                lastBackendStatus = "invalid_frame";
                return false;
            }

            return TryDecodeWithZxing(pixels, width, height, out text);
        }

        private static bool TryDecodeWithZxing(Color32[] pixels, int width, int height, out string text)
        {
            text = string.Empty;
            if (!ResolveApi())
            {
                return false;
            }

            try
            {
                var needed = pixels.Length * 3;
                if (rgbBuffer == null || rgbBuffer.Length < needed)
                {
                    rgbBuffer = new byte[needed];
                }
                var rgb = rgbBuffer;
                for (var i = 0; i < pixels.Length; i++)
                {
                    var p = pixels[i];
                    var j = i * 3;
                    rgb[j] = p.r;
                    rgb[j + 1] = p.g;
                    rgb[j + 2] = p.b;
                }

                var luminance = Activator.CreateInstance(luminanceType, rgb, width, height);
                var binarizer = Activator.CreateInstance(hybridType, luminance);
                var bitmap = Activator.CreateInstance(bitmapType, binarizer);

                var result = decodeMethod.Invoke(reader, new[] { bitmap });
                if (result == null)
                {
                    lastBackendStatus = "zxing_no_result";
                    return false;
                }

                text = textProperty?.GetValue(result) as string ?? string.Empty;
                lastBackendStatus = string.IsNullOrWhiteSpace(text) ? "zxing_empty" : "zxing";
                return !string.IsNullOrWhiteSpace(text);
            }
            catch (TargetInvocationException)
            {
                lastBackendStatus = "zxing_no_result";
                return false;
            }
            catch (Exception e)
            {
                lastBackendStatus = "zxing_error:" + e.GetType().Name;
                return false;
            }
        }

        /// <summary>Résout et cache l'API ZXing par réflexion (une seule fois).</summary>
        private static bool ResolveApi()
        {
            if (apiResolved)
            {
                return apiOk;
            }
            apiResolved = true;

            var asm = FindZxingAssembly();
            if (asm == null)
            {
                lastBackendStatus = "zxing_missing";
                return false;
            }

            luminanceType = asm.GetType("ZXing.RGBLuminanceSource");
            hybridType = asm.GetType("ZXing.Common.HybridBinarizer");
            bitmapType = asm.GetType("ZXing.BinaryBitmap");
            var readerType = asm.GetType("ZXing.MultiFormatReader");
            if (luminanceType == null || hybridType == null || bitmapType == null || readerType == null)
            {
                lastBackendStatus = "zxing_api_missing";
                return false;
            }

            decodeMethod = readerType.GetMethod("decode", new[] { bitmapType }) ??
                           readerType.GetMethod("Decode", new[] { bitmapType });
            if (decodeMethod == null)
            {
                lastBackendStatus = "zxing_decode_missing";
                return false;
            }

            var resultType = asm.GetType("ZXing.Result");
            textProperty = resultType?.GetProperty("Text");
            reader = Activator.CreateInstance(readerType);

            apiOk = true;
            return true;
        }

        private static Assembly FindZxingAssembly()
        {
            if (searchedAssembly)
            {
                return zxingAssembly;
            }

            searchedAssembly = true;
            var assemblies = AppDomain.CurrentDomain.GetAssemblies();
            for (var i = 0; i < assemblies.Length; i++)
            {
                var asm = assemblies[i];
                var name = asm.GetName().Name;
                if (name != null && name.IndexOf("zxing", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    zxingAssembly = asm;
                    return zxingAssembly;
                }
            }

            return null;
        }
    }
}
