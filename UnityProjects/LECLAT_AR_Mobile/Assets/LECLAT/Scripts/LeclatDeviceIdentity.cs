using System;
using UnityEngine;

namespace Leclat.AR
{
    /// <summary>
    /// Stable local device identifier used by the future backend scan policy.
    /// It is not a security secret; it is a durable client-side signal.
    /// </summary>
    public static class LeclatDeviceIdentity
    {
        private const string DeviceIdKey = "leclat.device_id.v1";

        public static string DeviceId
        {
            get
            {
                var id = PlayerPrefs.GetString(DeviceIdKey, string.Empty);
                if (!string.IsNullOrWhiteSpace(id))
                {
                    return id;
                }

                id = Guid.NewGuid().ToString("N");
                PlayerPrefs.SetString(DeviceIdKey, id);
                PlayerPrefs.Save();
                return id;
            }
        }
    }
}
