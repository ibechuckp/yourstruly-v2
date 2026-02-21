#!/bin/bash
# Download face-api.js models from vladmandic/face-api

MODEL_DIR="public/models/face-api"
mkdir -p "$MODEL_DIR"

BASE_URL="https://raw.githubusercontent.com/vladmandic/face-api/master/model"

# Model files (.bin and manifests)
MODELS=(
  "ssd_mobilenetv1_model-weights_manifest.json"
  "ssd_mobilenetv1_model.bin"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model.bin"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model.bin"
  "age_gender_model-weights_manifest.json"
  "age_gender_model.bin"
  "face_expression_model-weights_manifest.json"
  "face_expression_model.bin"
)

echo "Downloading face-api.js models to $MODEL_DIR..."

for model in "${MODELS[@]}"; do
  echo "  -> $model"
  curl -sL "$BASE_URL/$model" -o "$MODEL_DIR/$model"
  # Check if download was successful (file > 100 bytes)
  size=$(wc -c < "$MODEL_DIR/$model")
  if [ "$size" -lt 100 ]; then
    echo "     ⚠️  Warning: $model may not have downloaded correctly (${size} bytes)"
  fi
done

echo ""
echo "Model sizes:"
ls -lh "$MODEL_DIR"/*.bin 2>/dev/null || echo "No .bin files found"

echo ""
echo "✅ Done! Models downloaded to $MODEL_DIR"
