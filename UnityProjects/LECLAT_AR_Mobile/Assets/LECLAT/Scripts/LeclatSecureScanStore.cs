using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Local integrity check for the first QR scan.
    /// This is tamper-evidence, not backend-grade security.
    /// </summary>
    public static class LeclatSecureScanStore
    {
        private const string FragmentKey = "leclat.secure.fragment.v1";
        private const string TokenKey = "leclat.secure.token.v1";
        private const string HashKey = "leclat.secure.hash.v1";
        private const string TimestampKey = "leclat.secure.timestamp.v1";

        private const string HashSalt = "LECLAT_LOCAL_QR_FIRST_SCAN_V1";

        public struct ServerScanRequest
        {
            public string fragment;
            public string token;
            public string device_id;
            public string nonce;
        }

        public static bool TryGetValidFragment(out string fragmentId)
        {
            return TryGetValidScan(out fragmentId, out _);
        }

        public static bool TryGetValidTokenForFragment(string expectedFragmentId, out string token)
        {
            token = string.Empty;
            if (!TryGetValidScan(out var fragmentId, out var storedToken) ||
                string.IsNullOrWhiteSpace(storedToken) ||
                !string.Equals(fragmentId, expectedFragmentId, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            token = storedToken;
            return true;
        }

        public static bool TryGetValidScan(out string fragmentId, out string token)
        {
            fragmentId = PlayerPrefs.GetString(FragmentKey, string.Empty);
            token = PlayerPrefs.GetString(TokenKey, string.Empty);
            var hash = PlayerPrefs.GetString(HashKey, string.Empty);

            if (string.IsNullOrWhiteSpace(fragmentId) ||
                string.IsNullOrWhiteSpace(hash) ||
                !LeclatFragmentRegistry.TryGetByFragmentId(fragmentId, out _))
            {
                fragmentId = string.Empty;
                return false;
            }

            if (hash != ComputeHash(fragmentId, token, LeclatDeviceIdentity.DeviceId))
            {
                Clear();
                fragmentId = string.Empty;
                token = string.Empty;
                return false;
            }

            return true;
        }

        public static void Save(string fragmentId, string token)
        {
            if (string.IsNullOrWhiteSpace(fragmentId))
            {
                throw new ArgumentException("Fragment id is required.", nameof(fragmentId));
            }

            PlayerPrefs.SetString(FragmentKey, fragmentId);
            PlayerPrefs.SetString(TokenKey, token ?? string.Empty);
            PlayerPrefs.SetString(HashKey, ComputeHash(fragmentId, token ?? string.Empty, LeclatDeviceIdentity.DeviceId));
            PlayerPrefs.SetString(TimestampKey, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString());
            PlayerPrefs.Save();
        }

        public static void Clear()
        {
            PlayerPrefs.DeleteKey(FragmentKey);
            PlayerPrefs.DeleteKey(TokenKey);
            PlayerPrefs.DeleteKey(HashKey);
            PlayerPrefs.DeleteKey(TimestampKey);
            PlayerPrefs.Save();
        }

        public static ServerScanRequest BuildServerRequest(string fragmentId, string token)
        {
            return new ServerScanRequest
            {
                fragment = fragmentId,
                token = token ?? string.Empty,
                device_id = LeclatDeviceIdentity.DeviceId,
                nonce = LeclatScanNonce.Create(),
            };
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
