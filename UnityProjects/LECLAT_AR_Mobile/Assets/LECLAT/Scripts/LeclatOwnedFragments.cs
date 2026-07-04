using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Liste des fragments POSSÉDÉS par ce téléphone — 1 par t-shirt acheté dont le
    /// QR a été scanné. On peut posséder plusieurs t-shirts → plusieurs fragments
    /// « owner » (ex. [eveil, souffle]).
    ///
    /// Sert à distinguer OWNER (le fragment détecté est dans la liste) de VISITOR
    /// (pas dans la liste → le scan « compte » côté backend). Intégrité locale par
    /// hash lié au device (tamper-evidence, pas sécurité backend).
    /// </summary>
    public static class LeclatOwnedFragments
    {
        private const string ListKey = "leclat.owned.v1";
        private const string HashKey = "leclat.owned.hash.v1";
        private const string Salt = "LECLAT_OWNED_FRAGMENTS_V1";

        /// <summary>Fragments possédés (vide si intégrité cassée ou aucun).</summary>
        public static IReadOnlyList<string> GetAll()
        {
            var csv = PlayerPrefs.GetString(ListKey, string.Empty);
            if (string.IsNullOrEmpty(csv))
            {
                return Array.Empty<string>();
            }
            if (PlayerPrefs.GetString(HashKey, string.Empty) != Hash(csv))
            {
                return Array.Empty<string>(); // intégrité cassée → ignore
            }
            return csv.Split(',');
        }

        public static bool IsOwned(string fragmentId)
        {
            if (string.IsNullOrEmpty(fragmentId))
            {
                return false;
            }
            foreach (var f in GetAll())
            {
                if (string.Equals(f, fragmentId, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }
            return false;
        }

        public static int Count => GetAll().Count;

        /// <summary>Ajoute un fragment possédé (idempotent). Appelé après un QR validé.</summary>
        public static void Add(string fragmentId)
        {
            if (string.IsNullOrWhiteSpace(fragmentId))
            {
                return;
            }

            var list = new List<string>(GetAll());
            foreach (var f in list)
            {
                if (string.Equals(f, fragmentId, StringComparison.OrdinalIgnoreCase))
                {
                    return; // déjà possédé
                }
            }

            list.Add(fragmentId);
            var csv = string.Join(",", list);
            PlayerPrefs.SetString(ListKey, csv);
            PlayerPrefs.SetString(HashKey, Hash(csv));
            PlayerPrefs.Save();
        }

        private static string Hash(string csv)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(Salt + "|" + csv + "|" + LeclatDeviceIdentity.DeviceId));
            var sb = new StringBuilder(bytes.Length * 2);
            for (var i = 0; i < bytes.Length; i++)
            {
                sb.Append(bytes[i].ToString("x2"));
            }
            return sb.ToString();
        }
    }
}
