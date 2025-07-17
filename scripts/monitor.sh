#!/bin/bash

# Continuous Monitoring Script for Quiz Platform
# Monitors application health, performance, and sends alerts

set -e

# Configuration
MONITOR_INTERVAL="${MONITOR_INTERVAL:-300}"  # 5 minutes
LOG_FILE="${LOG_FILE:-/var/log/quiz-platform-monitor.log}"
ALERT_THRESHOLD="${ALERT_THRESHOLD:-3}"      # Number of failures before alert
RECOVERY_THRESHOLD="${RECOVERY_THRESHOLD:-2}" # Number of successes to consider recovered
API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

# Alert configuration
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
EMAIL_ALERT="${EMAIL_ALERT:-}"
ALERT_COOLDOWN="${ALERT_COOLDOWN:-1800}"     # 30 minutes between alerts

# State files
STATE_DIR="/tmp/quiz-platform-monitor"
FAILURE_COUNT_FILE="$STATE_DIR/failure_count"
SUCCESS_COUNT_FILE="$STATE_DIR/success_count"
LAST_ALERT_FILE="$STATE_DIR/last_alert"
LAST_STATUS_FILE="$STATE_DIR/last_status"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${BLUE}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

success() {
    local message="[SUCCESS] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

warning() {
    local message="[WARNING] $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

error() {
    local message="[ERROR] $1"
    echo -e "${RED}${message}${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE"
}

# Initialize state directory
init_state() {
    mkdir -p "$STATE_DIR"
    
    # Initialize counters if they don't exist
    [ ! -f "$FAILURE_COUNT_FILE" ] && echo "0" > "$FAILURE_COUNT_FILE"
    [ ! -f "$SUCCESS_COUNT_FILE" ] && echo "0" > "$SUCCESS_COUNT_FILE"
    [ ! -f "$LAST_ALERT_FILE" ] && echo "0" > "$LAST_ALERT_FILE"
    [ ! -f "$LAST_STATUS_FILE" ] && echo "unknown" > "$LAST_STATUS_FILE"
}

# Get state values
get_failure_count() {
    cat "$FAILURE_COUNT_FILE" 2>/dev/null || echo "0"
}

get_success_count() {
    cat "$SUCCESS_COUNT_FILE" 2>/dev/null || echo "0"
}

get_last_alert() {
    cat "$LAST_ALERT_FILE" 2>/dev/null || echo "0"
}

get_last_status() {
    cat "$LAST_STATUS_FILE" 2>/dev/null || echo "unknown"
}

# Set state values
set_failure_count() {
    echo "$1" > "$FAILURE_COUNT_FILE"
}

set_success_count() {
    echo "$1" > "$SUCCESS_COUNT_FILE"
}

set_last_alert() {
    echo "$1" > "$LAST_ALERT_FILE"
}

set_last_status() {
    echo "$1" > "$LAST_STATUS_FILE"
}

# Health check function
perform_health_check() {
    local health_script="$(dirname "$0")/health-check.sh"
    
    if [ -f "$health_script" ]; then
        # Run health check script
        if "$health_script" --api-url "$API_URL" --frontend-url "$FRONTEND_URL" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Fallback: simple health check
        if curl -sf --max-time 10 "$API_URL/api/v1/health" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    fi
}

# Send Slack alert
send_slack_alert() {
    local message="$1"
    local color="$2"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Quiz Platform Alert",
            "text": "$message",
            "footer": "Quiz Platform Monitor",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
    fi
}

# Send email alert
send_email_alert() {
    local subject="$1"
    local message="$2"
    
    if [ -n "$EMAIL_ALERT" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$EMAIL_ALERT" || true
    fi
}

# Check if we should send alert (considering cooldown)
should_send_alert() {
    local last_alert=$(get_last_alert)
    local current_time=$(date +%s)
    local time_diff=$((current_time - last_alert))
    
    if [ $time_diff -gt $ALERT_COOLDOWN ]; then
        return 0
    else
        return 1
    fi
}

# Send failure alert
send_failure_alert() {
    local failure_count=$1
    
    if should_send_alert; then
        local message="🚨 Quiz Platform is experiencing issues!

Failure Count: $failure_count
API URL: $API_URL
Frontend URL: $FRONTEND_URL
Time: $(date)

The application has failed health checks $failure_count times consecutively."

        log "Sending failure alert (failure count: $failure_count)"
        send_slack_alert "$message" "danger"
        send_email_alert "Quiz Platform Alert - Service Down" "$message"
        set_last_alert "$(date +%s)"
    else
        log "Alert suppressed due to cooldown period"
    fi
}

# Send recovery alert
send_recovery_alert() {
    local success_count=$1
    
    local message="✅ Quiz Platform has recovered!

Success Count: $success_count
API URL: $API_URL
Frontend URL: $FRONTEND_URL
Time: $(date)

The application is now responding normally after $success_count consecutive successful health checks."

    log "Sending recovery alert (success count: $success_count)"
    send_slack_alert "$message" "good"
    send_email_alert "Quiz Platform Recovery - Service Restored" "$message"
    set_last_alert "$(date +%s)"
}

# Process health check result
process_health_result() {
    local health_status=$1
    local current_failure_count=$(get_failure_count)
    local current_success_count=$(get_success_count)
    local last_status=$(get_last_status)
    
    if [ $health_status -eq 0 ]; then
        # Health check passed
        success "Health check passed"
        
        # Reset failure count and increment success count
        set_failure_count "0"
        set_success_count $((current_success_count + 1))
        
        # Check if we've recovered from a failure state
        if [ "$last_status" = "failed" ] && [ $((current_success_count + 1)) -ge $RECOVERY_THRESHOLD ]; then
            send_recovery_alert $((current_success_count + 1))
            set_last_status "healthy"
        elif [ "$last_status" = "unknown" ]; then
            set_last_status "healthy"
        fi
    else
        # Health check failed
        error "Health check failed"
        
        # Reset success count and increment failure count
        set_success_count "0"
        local new_failure_count=$((current_failure_count + 1))
        set_failure_count "$new_failure_count"
        
        # Check if we should send alert
        if [ $new_failure_count -ge $ALERT_THRESHOLD ]; then
            if [ "$last_status" != "failed" ]; then
                send_failure_alert $new_failure_count
                set_last_status "failed"
            fi
        fi
    fi
}

# Collect and log metrics
collect_metrics() {
    local timestamp=$(date +%s)
    local iso_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Basic metrics
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 2>/dev/null || echo "0")
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}' 2>/dev/null || echo "0")
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1 2>/dev/null || echo "0")
    
    # Application-specific metrics (if available)
    local response_time="0"
    if command -v curl >/dev/null 2>&1; then
        local start_time=$(date +%s%N)
        curl -sf --max-time 5 "$API_URL/api/v1/health" >/dev/null 2>&1 && {
            local end_time=$(date +%s%N)
            response_time=$(( (end_time - start_time) / 1000000 ))
        }
    fi
    
    # Log metrics
    local metrics_line="$iso_timestamp,cpu:$cpu_usage,memory:$memory_usage,disk:$disk_usage,response_time:$response_time"
    echo "$metrics_line" >> "${LOG_FILE%.log}-metrics.csv"
}

# Cleanup old logs
cleanup_logs() {
    # Keep only last 30 days of logs
    find "$(dirname "$LOG_FILE")" -name "$(basename "$LOG_FILE")*" -type f -mtime +30 -delete 2>/dev/null || true
}

# Signal handlers
cleanup_and_exit() {
    log "Monitor stopped by signal"
    exit 0
}

# Trap signals
trap cleanup_and_exit TERM INT

# Main monitoring loop
monitor_loop() {
    log "Starting continuous monitoring..."
    log "Monitor interval: ${MONITOR_INTERVAL}s"
    log "Alert threshold: $ALERT_THRESHOLD failures"
    log "Recovery threshold: $RECOVERY_THRESHOLD successes"
    log "API URL: $API_URL"
    log "Frontend URL: $FRONTEND_URL"
    
    while true; do
        log "Performing health check..."
        
        # Perform health check
        if perform_health_check; then
            process_health_result 0
        else
            process_health_result 1
        fi
        
        # Collect metrics
        collect_metrics
        
        # Cleanup old logs periodically (every 24 checks, roughly once per day if interval is 1 hour)
        if [ $(($(date +%s) % 86400)) -lt $MONITOR_INTERVAL ]; then
            cleanup_logs
        fi
        
        # Wait for next check
        log "Waiting ${MONITOR_INTERVAL}s until next check..."
        sleep $MONITOR_INTERVAL
    done
}

# Main execution
main() {
    # Check if already running
    local pidfile="/var/run/quiz-platform-monitor.pid"
    if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
        error "Monitor is already running (PID: $(cat "$pidfile"))"
        exit 1
    fi
    
    # Write PID file
    echo $$ > "$pidfile"
    
    # Initialize state
    init_state
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Start monitoring
    monitor_loop
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --interval)
            MONITOR_INTERVAL="$2"
            shift 2
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --email)
            EMAIL_ALERT="$2"
            shift 2
            ;;
        --alert-threshold)
            ALERT_THRESHOLD="$2"
            shift 2
            ;;
        --recovery-threshold)
            RECOVERY_THRESHOLD="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --interval SECONDS          Monitor interval (default: 300)"
            echo "  --api-url URL               API base URL"
            echo "  --frontend-url URL          Frontend URL"
            echo "  --log-file PATH             Log file path"
            echo "  --slack-webhook URL         Slack webhook URL for alerts"
            echo "  --email EMAIL               Email address for alerts"
            echo "  --alert-threshold NUMBER    Failures before alert (default: 3)"
            echo "  --recovery-threshold NUMBER Successes to consider recovered (default: 2)"
            echo "  --help                      Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main