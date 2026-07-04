using System;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Leclat.AR
{
    internal static class LeclatJson
    {
        public const string BridgeVersion = "1.1.0";

        /// <summary>
        /// Lit une chaîne par clé. Recherche "à plat" : comme les clés du contrat
        /// (fragment_id, selected_fragment_id, sessionNonce, nonce, type) sont
        /// uniques dans l'enveloppe, ça récupère correctement la valeur même
        /// imbriquée dans `payload`. Pour cibler le payload explicitement, utiliser
        /// <see cref="ReadStringInPayload"/>.
        /// </summary>
        public static string ReadString(string json, string key)
        {
            if (string.IsNullOrEmpty(json) || string.IsNullOrEmpty(key))
            {
                return string.Empty;
            }

            var pattern = $"\"{Regex.Escape(key)}\"\\s*:\\s*\"(?<value>(?:\\\\.|[^\"])*)\"";
            var match = Regex.Match(json, pattern);
            return match.Success ? Regex.Unescape(match.Groups["value"].Value) : string.Empty;
        }

        /// <summary>
        /// Lit une clé en privilégiant l'objet `payload:{...}` (champs imbriqués du
        /// web), avec repli sur la recherche à plat. Évite toute ambiguïté quand une
        /// même clé pourrait exister au niveau enveloppe ET payload.
        /// </summary>
        public static string ReadStringInPayload(string json, string key)
        {
            var payload = ExtractObject(json, "payload");
            if (!string.IsNullOrEmpty(payload))
            {
                var inner = ReadString(payload, key);
                if (!string.IsNullOrEmpty(inner))
                {
                    return inner;
                }
            }
            return ReadString(json, key);
        }

        /// <summary>Extrait le sous-objet JSON `"key":{ ... }` (équilibrage d'accolades).</summary>
        private static string ExtractObject(string json, string key)
        {
            if (string.IsNullOrEmpty(json))
            {
                return string.Empty;
            }

            var marker = "\"" + key + "\"";
            var keyIndex = json.IndexOf(marker, StringComparison.Ordinal);
            if (keyIndex < 0)
            {
                return string.Empty;
            }

            var open = json.IndexOf('{', keyIndex + marker.Length);
            if (open < 0)
            {
                return string.Empty;
            }

            var depth = 0;
            for (var i = open; i < json.Length; i++)
            {
                var c = json[i];
                if (c == '{')
                {
                    depth++;
                }
                else if (c == '}')
                {
                    depth--;
                    if (depth == 0)
                    {
                        return json.Substring(open, i - open + 1);
                    }
                }
            }
            return string.Empty;
        }

        public static string EventEnvelope(string eventName, string nonce, string payloadJson)
        {
            var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            return "{\"type\":\"" + Escape(eventName) + "\"," +
                   "\"event\":\"" + Escape(eventName) + "\"," +
                   "\"nonce\":\"" + Escape(nonce) + "\"," +
                   "\"ts\":" + ts.ToString(CultureInfo.InvariantCulture) + "," +
                   "\"bridgeVersion\":\"" + BridgeVersion + "\"," +
                   "\"payload\":" + payloadJson + "}";
        }

        public static string StringField(string key, string value)
        {
            return "\"" + Escape(key) + "\":\"" + Escape(value) + "\"";
        }

        public static string BoolField(string key, bool value)
        {
            return "\"" + Escape(key) + "\":" + (value ? "true" : "false");
        }

        public static string NumberField(string key, float value)
        {
            return "\"" + Escape(key) + "\":" + value.ToString("0.###", CultureInfo.InvariantCulture);
        }

        public static string IntField(string key, long value)
        {
            return "\"" + Escape(key) + "\":" + value.ToString(CultureInfo.InvariantCulture);
        }

        public static string Escape(string value)
        {
            return string.IsNullOrEmpty(value)
                ? string.Empty
                : value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
