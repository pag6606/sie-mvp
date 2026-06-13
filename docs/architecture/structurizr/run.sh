#!/bin/bash
# Structurizr Local — visualiza el modelo C4 del SIE
# Uso: ./run.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/.tmp"

mkdir -p "$DATA_DIR"
cp "$SCRIPT_DIR/workspace.dsl" "$DATA_DIR/"

echo "Iniciando Structurizr en http://localhost:8085 ..."
echo "Presiona Ctrl+C para detener."
echo ""

podman run -it --rm \
  -p 8085:8080 \
  -v "$DATA_DIR:/usr/local/structurizr:Z" \
  --user 0 \
  structurizr/structurizr local
