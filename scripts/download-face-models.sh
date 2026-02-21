#!/bin/bash
# Download face-api.js models

MODEL_DIR="public/models/face-api"
mkdir -p "$MODEL_DIR"

BASE_URL="https://raw.githubusercontent.com/vladmandic/face-api/master/model"

MODELS=(
  "ssd_mobilenetv1_model-weights_manifest.json"
  "ssd_mobilenetv1_model-shard1"
  "ssd_mobilenetv1_model-shard2"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
  "face_recognition_model-shard2"
  "age_gender_model-weights_manifest.json"
  "age_gender_model-shard1"
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1"
)

echo "Downloading face-api.js models to $MODEL_DIR..."

for model in "${MODELS[@]}"; do
  echo "  -> $model"
  curl -sL "$BASE_URL/$model" -o "$MODEL_DIR/$model"
done

echo "✅ Done! Models downloaded to $MODEL_DIR"
