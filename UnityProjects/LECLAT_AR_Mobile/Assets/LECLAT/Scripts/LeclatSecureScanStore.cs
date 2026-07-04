using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Local integrity check for the first QR scan.
    /// Stocke UN token par fragment (multi-t-shirts) : scanner le QR d'un 2e
    /// t-shirt ne doit jamais effacer le token du premier.
    /// This is tamper-evidence, not backend-grade security.
    /// </summary>
    public static class LeclatSecureScanStore
    {
        // Clés v1 (mono-fragment) — lues uniquement pour migration one-shot.
        private const string LegacyFragmentKey = "leclat.secure.fragment.v1";
        private const string LegacyTokenKey = "leclat.secure.token.v1";
        private const string LegacyHashKey = "leclat.secure.hash.v1";
        private const string LegacyTimestampKey = "leclat.secure.timestamp.v1";

        private const string HashSalt = "LECLAT_LOCAL_QR_FIRST_SCAN_V1";

        private static string NormalizeFragmentId(string fragmentId) =>
            (fragmentId ?? string.Empty).Trim().ToLowerInvariant();

        private static string TokenKey(string normalizedId) => "leclat.secure.token." + normalizedId + ".v2";
        private static string HashKey(string normalizedId) => "leclat.secure.hash." + normalizedId + ".v2";
        private static string TimestampKey(string normalizedId) => "leclat.secure.ts." + normalizedId + ".v2";

        public static bool TryGetValidFragment(out string fragmentId)
        {
            return TryGetValidScan(out fragmentId, out _);
        }

        public static bool TryGetValidTokenForFragment(string expectedFragmentId, out string token)
        {
            token = string.Empty;
            if (string.IsNullOrWhiteSpace(expectedFragmentId) ||
                !LeclatFragmentRegistry.TryGetByFragmentId(expectedFragmentId, out _))
            {
                return false;
            }

            MigrateLegacyEntryIfAny();

            var id = NormalizeFragmentId(expectedFragmentId);
            var storedToken = PlayerPrefs.GetString(TokenKey(id), string.Empty);
            var storedHash = PlayerPrefs.GetString(HashKey(id), string.Empty);
            if (string.IsNullOrWhiteSpace(storedToken) || string.IsNullOrWhiteSpace(storedHash))
            {
                return false;
            }

            if (storedHash != ComputeHash(id, storedToken, LeclatDeviceIdentity.DeviceId))
            {
                ClearFragment(id); // altéré → on invalide cette entrée seulement
                return false;
            }

            token = storedToken;
            return true;
        }

        /// <summary>Premier fragment possédé dont le token local est valide.</summary>
        public static bool TryGetValidScan(out string fragmentId, out string token)
        {
            MigrateLegacyEntryIfAny();
            fragmentId = string.Empty;
            token = string.Empty;

            foreach (var owned in LeclatOwnedFragments.GetAll())
            {
                if (TryGetValidTokenForFragment(owned, out var storedToken))
                {
                    fragmentId = NormalizeFragmentId(owned);
                    token = storedToken;
                    return true;
                }
            }

            return false;
        }

        public static void Save(string fragmentId, string token)
        {
            if (string.IsNullOrWhiteSpace(fragmentId))
            {
                throw new ArgumentException("Fragment id is required.", nameof(fragmentId));
            }

            MigrateLegacyEntryIfAny();

            var id = NormalizeFragmentId(fragmentId);
            var value = token ?? string.Empty;
            PlayerPrefs.SetString(TokenKey(id), value);
            PlayerPrefs.SetString(HashKey(id), ComputeHash(id, value, LeclatDeviceIdentity.DeviceId));
            PlayerPrefs.SetString(TimestampKey(id), DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString());
            PlayerPrefs.Save();
        }

        public static void Clear()
        {
            foreach (var owned in LeclatOwnedFragments.GetAll())
            {
                ClearFragment(NormalizeFragmentId(owned));
            }
            DeleteLegacyKeys();
            PlayerPrefs.Save();
        }

        private static void ClearFragment(string normalizedId)
        {
            PlayerPrefs.DeleteKey(TokenKey(normalizedId));
            PlayerPrefs.DeleteKey(HashKey(normalizedId));
            PlayerPrefs.DeleteKey(TimestampKey(normalizedId));
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Migration one-shot v1 → v2. Le hash v1 couvrait le fragmentId tel que
        /// stocké (casse d'origine) : on le valide à l'identique avant de re-hasher
        /// sur l'id normalisé. Les clés v1 sont supprimées dans tous les cas.
        /// </summary>
        private static void MigrateLegacyEntryIfAny()
        {
            var legacyFragment = PlayerPrefs.GetString(LegacyFragmentKey, string.Empty);
            if (string.IsNullOrWhiteSpace(legacyFragment))
            {
                return;
            }

            var legacyToken = PlayerPrefs.GetString(LegacyTokenKey, string.Empty);
            var legacyHash = PlayerPrefs.GetString(LegacyHashKey, string.Empty);
            var legacyValid =
                !string.IsNullOrWhiteSpace(legacyHash) &&
                LeclatFragmentRegistry.TryGetByFragmentId(legacyFragment, out _) &&
                legacyHash == ComputeHash(legacyFragment, legacyToken, LeclatDeviceIdentity.DeviceId);

            if (legacyValid)
            {
                var id = NormalizeFragmentId(legacyFragment);
                // Ne jamais écraser une entrée v2 déjà écrite pour ce fragment.
                if (string.IsNullOrEmpty(PlayerPrefs.GetString(TokenKey(id), string.Empty)))
                {
                    PlayerPrefs.SetString(TokenKey(id), legacyToken);
                    PlayerPrefs.SetString(HashKey(id), ComputeHash(id, legacyToken, LeclatDeviceIdentity.DeviceId));
                    PlayerPrefs.SetString(
                        TimestampKey(id),
                        PlayerPrefs.GetString(
                            LegacyTimestampKey,
                            DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()));
                }
            }

            DeleteLegacyKeys();
            PlayerPrefs.Save();
        }

        private static void DeleteLegacyKeys()
        {
            PlayerPrefs.DeleteKey(LegacyFragmentKey);
            PlayerPrefs.DeleteKey(LegacyTokenKey);
            PlayerPrefs.DeleteKey(LegacyHashKey);
            PlayerPrefs.DeleteKey(LegacyTimestampKey);
        }

        private static string ComputeHash(string fragmentId, string token, string deviceId)
        {
            var input = HashSalt + "|" + fragmentId + "|" + token + "|" + deviceId;
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
            var sb = new StringBuilder(bytes.Length * 2);
            for (var i = 0; i < bytes.Length; i++)
            {
                sb.Append(bytes[i].ToString("x2"));
            }
            return sb.ToString();
        }
    }
}
