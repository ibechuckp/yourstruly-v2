# Photo Digitization Feature

## Overview
This feature allows users to digitize printed family photos by:
1. Taking a photo or uploading a scan of printed photos (single or grid layout)
2. Automatically detecting individual photos in the image
3. Cropping and optionally enhancing each photo
4. Saving them as individual images in the gallery

## Files Created

### Core Library
- `src/lib/photoDigitize.ts` - Detection and processing utilities
  - Grid line detection using histogram analysis
  - Region extraction from detected gaps
  - AI vision response parsing
  - Region validation and merging

### API Endpoints
- `src/app/api/digitize/detect/route.ts` - Photo detection endpoint
  - Uses AI (Gemini) for accurate boundary detection
  - Falls back to histogram-based gap detection
  - Returns bounding boxes with preview crops

- `src/app/api/digitize/enhance/route.ts` - Enhancement endpoint
  - Integrates with Replicate Real-ESRGAN for AI upscaling
  - Falls back to Sharp-based enhancement when no API key
  - 2x upscale + sharpen + color correction

- `src/app/api/digitize/route.ts` - Main processing endpoint
  - Crops photos based on detected regions
  - Applies enhancement if requested
  - Uploads to Supabase storage
  - Creates memory records

### UI Components
- `src/components/gallery/DigitizeModal.tsx` - Multi-step modal UI
  - Step 1: Capture - Camera or file upload
  - Step 2: Detect - Shows detection progress
  - Step 3: Review - Preview detected photos, select/deselect
  - Step 4: Process - Shows processing progress
  - Step 5: Complete - Success confirmation

## Configuration

### Environment Variables
Add to `.env.local`:
```
# Optional - for AI photo enhancement
REPLICATE_API_TOKEN=r8_...
```

Without the Replicate token, the system will use Sharp for basic enhancement (still functional, just not AI-powered).

## Usage

1. Go to Gallery page
2. Click the "+" button to open upload modal
3. Select "Digitize Printed Photos"
4. Take a photo or upload a scan
5. Review detected photos
6. Toggle enhancement on/off
7. Click "Save X photos"

## Technical Details

### Detection Methods

1. **AI Vision (default)** - Uses Gemini to analyze the image and return bounding boxes
   - More accurate for irregular layouts
   - Better at detecting overlapping or tilted photos
   - Requires GEMINI_API_KEY

2. **Histogram Analysis (fallback)** - Analyzes brightness patterns
   - Finds horizontal and vertical "gaps" (bright white regions)
   - Creates grid regions from gap intersections
   - Works well for standard grid layouts (2x2, 3x3)

### Enhancement

- **Replicate Real-ESRGAN** (~$0.006/run, ~5-11 seconds)
  - 2-4x upscaling with AI
  - Face enhancement (GFPGAN)
  - Damage/noise reduction

- **Sharp (fallback)**
  - Lanczos3 2x upscaling
  - Auto-levels normalization
  - Sharpening
  - Brightness/saturation boost

## Dependencies

Already installed:
- `sharp` - Image processing
- `@google/generative-ai` - Gemini AI for detection

Optional:
- Replicate API account for AI enhancement

## Future Enhancements

- [ ] Manual region adjustment UI
- [ ] Batch processing for multiple scans
- [ ] Date estimation from photo content
- [ ] Automatic color correction for faded photos
- [ ] Scratch/damage removal
