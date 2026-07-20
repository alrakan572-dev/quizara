# Quizara Phase 2 — Find Difference Production Repair

## Completed

- Replaced the unsafe Pexels importer that duplicated the same image and stored empty differences.
- The importer now accepts only real original/modified image pairs with validated hotspot coordinates.
- Added SHA-256 comparison to reject identical image files even when URLs differ.
- Added HTTPS, MIME type, file size, language, difficulty, time-limit, and hotspot validation.
- Protected the import function with `IMPORT_IMAGES_SECRET` through `x-import-secret`.
- Added batch limit of 25 challenges per request.
- Stored imported images in the `find-difference` Storage bucket.
- Added database integrity checks and automatically deactivated existing invalid active levels.
- Added a partial unique index for `(source, api_id)`.
- Fixed `get-next-game` so valid hotspot data reaches the active Find Difference page.

## Required deployment

```powershell
supabase secrets set IMPORT_IMAGES_SECRET="CREATE_A_LONG_RANDOM_SECRET"
supabase db push
supabase functions deploy import-images
supabase functions deploy get-next-game
npm run verify
```

## Production import body

Send a POST request to `import-images` with header:

```text
x-import-secret: <IMPORT_IMAGES_SECRET>
```

Example structure:

```json
{
  "challenges": [
    {
      "external_id": "level-001",
      "source": "content-pipeline",
      "image_1_url": "https://.../original.jpg",
      "image_2_url": "https://.../modified.jpg",
      "language": "en",
      "difficulty": "medium",
      "time_limit": 60,
      "active": true,
      "differences": [
        { "id": 1, "x": 31.5, "y": 42.0, "radius": 5.5, "label": "Missing object" }
      ]
    }
  ]
}
```

No mock levels or placeholder images are included.
