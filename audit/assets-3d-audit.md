# Audit assets 3D LECLAT

Generated: 2026-06-17T12:18:25.492Z

## Summary

- Manifest entries: 10
- Actual GLB files in StreamingAssets: 10
- Missing GLBs: 0
- Extra GLBs: 0
- Textures above 512 px: 0
- Models above 2 MB: MODEL_0476:2.157MB
- Production-approved entries: 0/10

## GLB Details

| Model | Exists | Size MB | Max Texture | Images | Animations | License |
|---|---:|---:|---:|---:|---:|---|
| MODEL_0060 | yes | 0.702 | 512 | 2 | 6 | LICENSE_REVIEW_REQUIRED_BEFORE_PRODUCTION |
| MODEL_0188 | yes | 0.208 | 512 | 2 | 0 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0312 | yes | 0.25 | 512 | 1 | 0 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0429 | yes | 0.028 | 0 | 0 | 0 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0500 | yes | 0.491 | 512 | 1 | 2 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0476 | yes | 2.157 | 512 | 9 | 1 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0091 | yes | 1.854 | 512 | 4 | 1 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0255 | yes | 0.478 | 512 | 2 | 1 | LICENSE_REVIEW_REQUIRED_BEFORE_PRODUCTION |
| MODEL_0518 | yes | 1.066 | 512 | 7 | 1 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |
| MODEL_0104 | yes | 0.055 | 512 | 1 | 1 | INTERNAL_TEST_ONLY_LICENSE_UNKNOWN |

## Notes

- The previous `_backup_originals` folder was moved out of `StreamingAssets` to keep originals intact without shipping them in the app.
- `MODEL_0476` remains slightly above the 2 MB mobile budget and should be reviewed visually before further compression.
- All entries still require license approval before production because `productionApproved` is false in the manifest.
