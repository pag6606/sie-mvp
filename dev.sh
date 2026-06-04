#!/bin/bash
# SIE Development Environment — Podman Edition
# Usage: ./dev.sh [start|stop|status]
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
POD_NAME="sie-dev"

start() {
    echo "🐳 Starting SIE services with Podman..."

    # Create pod for networking
    podman pod exists "$POD_NAME" 2>/dev/null || podman pod create --name "$POD_NAME" \
        -p 5432:5432 -p 5672:5672 -p 15672:15672 -p 1025:1025 -p 8025:8025

    # PostgreSQL
    podman run -d --pod "$POD_NAME" --name sie-postgres \
        -e POSTGRES_DB=sie -e POSTGRES_USER=sie -e POSTGRES_PASSWORD=sie_dev \
        -v sie-postgres-data:/var/lib/postgresql/data \
        docker.io/library/postgres:15-alpine

    # RabbitMQ
    podman run -d --pod "$POD_NAME" --name sie-rabbitmq \
        -e RABBITMQ_DEFAULT_USER=sie -e RABBITMQ_DEFAULT_PASS=sie_dev \
        docker.io/library/rabbitmq:3-management

    # Mailpit
    podman run -d --pod "$POD_NAME" --name sie-mailpit \
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
    echo "   Backend:    cd backend && ./mvnw spring-boot:run"
    echo "   Frontend:   cd frontend && npm run dev -- --host"
    echo ""
    echo "   📱 Para probar desde el móvil en la misma WiFi:"
    echo "      Backend expuesto en http://$(hostname -I | awk '{print $1}'):8080"
    echo "      Frontend expuesto en http://$(hostname -I | awk '{print $1}'):5173"
}

stop() {
    echo "🛑 Stopping SIE services..."
    podman pod stop "$POD_NAME" 2>/dev/null
    podman pod rm -f "$POD_NAME" 2>/dev/null
    echo "✅ Stopped"
}

status() {
    podman pod ps --filter name="$POD_NAME" 2>/dev/null || echo "Services not running"
}

case "${1:-start}" in
    start) start ;;
    stop) stop ;;
    restart) stop; start ;;
    status) status ;;
    *) echo "Usage: $0 {start|stop|restart|status}" ;;
esac
