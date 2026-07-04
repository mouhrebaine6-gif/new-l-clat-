using System;

namespace Leclat.AR
{
    public readonly struct LeclatQrPayload
    {
        public readonly string FragmentId;
        public readonly string Token;

        private LeclatQrPayload(string fragmentId, string token)
        {
            FragmentId = fragmentId;
            Token = token;
        }

        /// <summary>
        /// Forme canonique "leclat:&lt;fragment&gt;:&lt;token&gt;" — c'est CETTE chaîne
        /// complète qui est stockée dans public.tshirts.qr_token côté serveur.
        /// </summary>
        public string CanonicalPayload =>
            string.IsNullOrEmpty(Token) ? "leclat:" + FragmentId : "leclat:" + FragmentId + ":" + Token;

        public static bool TryParse(string raw, out LeclatQrPayload payload, out string reason)
        {
            payload = default;
            reason = string.Empty;

            if (string.IsNullOrWhiteSpace(raw))
            {
                reason = "empty";
                return false;
            }

            var value = raw.Trim();
            if (!value.StartsWith("leclat:", StringComparison.OrdinalIgnoreCase))
            {
                reason = "prefix";
                return false;
            }

            var parts = value.Split(':');
            if (parts.Length < 2 || parts.Length > 3)
            {
                reason = "format";
                return false;
            }

            var fragment = parts[1].Trim().ToLowerInvariant();
            if (!LeclatFragmentRegistry.TryGetByFragmentId(fragment, out _))
            {
                reason = "fragment";
                return false;
            }

            payload = new LeclatQrPayload(fragment, parts.Length == 3 ? parts[2].Trim() : string.Empty);
            return true;
        }
    }
}
