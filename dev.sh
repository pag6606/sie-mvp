#!/bin/bash
# SIE Development Environment — Podman Edition (idempotente)
# Usage: ./dev.sh [start|stop|restart|status]
#
# Idempotente: `start` reusa contenedores existentes (corriendo o detenidos)
# y solo crea los que falten. Los datos del volumen sie-postgres-data se preservan.
set -e

POD_NAME="sie-dev"

# ──────────────────────────────────────────────────────────────
# Reusa un contenedor existente (lo arranca si está detenido) o lo crea.
# Uso: ensure_container <nombre> [args-de-podman-run...]
# ──────────────────────────────────────────────────────────────
ensure_container() {
    local name="$1"; shift
    if podman container exists "$name" 2>/dev/null; then
        # Ya existe (corriendo o detenido): arrancar es no-op si ya está UP.
        podman start "$name" >/dev/null 2>&1 || true
        echo "  ↻  $name: reutilizado y arrancado"
    else
        podman run -d --pod "$POD_NAME" --name "$name" "$@" >/dev/null
        echo "  ✚  $name: creado"
    fi
}

start() {
    echo "🐳 Starting SIE services with Podman (idempotente)..."

    # Pod (idempotente)
    if ! podman pod exists "$POD_NAME" 2>/dev/null; then
        podman pod create --name "$POD_NAME" \
            -p 5432:5432 -p 5672:5672 -p 15672:15672 -p 1025:1025 -p 8025:8025 >/dev/null
        echo "  ✚  Pod '$POD_NAME' creado"
    else
        echo "  ↻  Pod '$POD_NAME' ya existe"
    fi

    # Contenedores (idempotentes)
    ensure_container sie-postgres \
        -e POSTGRES_DB=sie -e POSTGRES_USER=sie -e POSTGRES_PASSWORD=sie_dev \
        -v sie-postgres-data:/var/lib/postgresql/data \
        docker.io/library/postgres:15-alpine

    ensure_container sie-rabbitmq \
        -e RABBITMQ_DEFAULT_USER=sie -e RABBITMQ_DEFAULT_PASS=sie_dev \
        docker.io/library/rabbitmq:3-management

    ensure_container sie-mailpit \
        -e MP_MAX_MESSAGES=5000 -e MP_SMTP_AUTH_ACCEPT_ANY=true -e MP_SMTP_AUTH_ALLOW_INSECURE=true \
        docker.io/axllent/mailpit:latest

    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 8

    echo ""
    echo "✅ SIE Development Environment Ready"
    echo "   PostgreSQL: localhost:5432 (sie/sie_dev)"
    echo "   RabbitMQ:   localhost:5672 (management: :15672)"
    echo "   Mailpit:    localhost:1025 (web UI: :8025)"
    echo ""
    echo "   Backend:    cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev"
    echo "   Frontend:   cd frontend && npm run dev -- --host"
    echo ""
    echo "   📱 Para probar desde el móvil en la misma WiFi:"
    echo "      Backend expuesto en http://$(hostname -I | awk '{print $1}'):8080"
    echo "      Frontend expuesto en http://$(hostname -I | awk '{print $1}'):5173"
    echo ""
    echo "   💡 ./dev.sh start es idempotente: podés correrlo las veces que quieras."
}

stop() {
    echo "🛑 Stopping SIE services..."
    podman pod stop "$POD_NAME" 2>/dev/null || true
    podman pod rm -f "$POD_NAME" 2>/dev/null || true
    echo "✅ Stopped (los datos del volumen sie-postgres-data se conservan)"
}

status() {
    echo "── Pod ──"
    podman pod ps --filter "name=$POD_NAME" 2>/dev/null || echo "Pod no encontrado"
    echo ""
    echo "── Contenedores SIE ──"
    podman ps -a --filter "name=sie-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
        || echo "Sin contenedores sie-*"
}

case "${1:-start}" in
    start)   start ;;
    stop)    stop ;;
    restart) stop; start ;;
    status)  status ;;
    *) echo "Usage: $0 {start|stop|restart|status}" ;;
esac
