#!/bin/bash

# Health Check Script for Quiz Platform
# Used for monitoring deployment health and uptime

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
TIMEOUT="${TIMEOUT:-10}"
RETRIES="${RETRIES:-3}"
WAIT_BETWEEN_RETRIES="${WAIT_BETWEEN_RETRIES:-5}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to make HTTP request with retries
make_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local retry_count=0
    
    while [ $retry_count -lt $RETRIES ]; do
        log "Checking $url (attempt $((retry_count + 1))/$RETRIES)"
        
        # Make request and capture both status and response
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo -e "\n000")
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" = "$expected_status" ]; then
            success "$url responded with status $status_code"
            echo "$body"
            return 0
        else
            warning "$url responded with status $status_code (expected $expected_status)"
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $RETRIES ]; then
            log "Waiting $WAIT_BETWEEN_RETRIES seconds before retry..."
            sleep $WAIT_BETWEEN_RETRIES
        fi
    done
    
    error "$url failed after $RETRIES attempts"
    return 1
}

# Check API health endpoint
check_api_health() {
    log "Checking API health..."
    
    local health_url="$API_URL/api/v1/health"
    local response
    
    if response=$(make_request "$health_url" 200); then
        # Parse JSON response if possible
        if command -v jq >/dev/null 2>&1; then
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            echo "$response"
        fi
        
        # Check if response contains expected health indicators
        if echo "$response" | grep -q "healthy\|ok\|success"; then
            success "API health check passed"
            return 0
        else
            warning "API responded but health status unclear"
            return 1
        fi
    else
        error "API health check failed"
        return 1
    fi
}

# Check API endpoints
check_api_endpoints() {
    log "Checking critical API endpoints..."
    
    local endpoints=(
        "/api/v1/health:200"
        "/api/v1/auth/status:200"
    )
    
    local failed_endpoints=0
    
    for endpoint_config in "${endpoints[@]}"; do
        local endpoint=$(echo "$endpoint_config" | cut -d':' -f1)
        local expected_status=$(echo "$endpoint_config" | cut -d':' -f2)
        local url="$API_URL$endpoint"
        
        if make_request "$url" "$expected_status" >/dev/null; then
            success "Endpoint $endpoint is healthy"
        else
            error "Endpoint $endpoint failed"
            failed_endpoints=$((failed_endpoints + 1))
        fi
    done
    
    if [ $failed_endpoints -eq 0 ]; then
        success "All API endpoints are healthy"
        return 0
    else
        error "$failed_endpoints API endpoint(s) failed"
        return 1
    fi
}

# Check frontend
check_frontend() {
    log "Checking frontend..."
    
    if make_request "$FRONTEND_URL" 200 >/dev/null; then
        success "Frontend is accessible"
        return 0
    else
        error "Frontend check failed"
        return 1
    fi
}

# Check database connectivity (through API)
check_database() {
    log "Checking database connectivity..."
    
    local db_check_url="$API_URL/api/v1/health/db"
    
    if make_request "$db_check_url" 200 >/dev/null; then
        success "Database connectivity check passed"
        return 0
    else
        warning "Database connectivity check failed or not implemented"
        return 1
    fi
}

# Check external dependencies
check_external_dependencies() {
    log "Checking external dependencies..."
    
    local dependencies=(
        "https://api.supabase.com:200"
    )
    
    local failed_deps=0
    
    for dep_config in "${dependencies[@]}"; do
        local dep_url=$(echo "$dep_config" | cut -d':' -f1-2)
        local expected_status=$(echo "$dep_config" | cut -d':' -f3)
        
        if make_request "$dep_url" "$expected_status" >/dev/null; then
            success "External dependency $dep_url is reachable"
        else
            warning "External dependency $dep_url failed"
            failed_deps=$((failed_deps + 1))
        fi
    done
    
    if [ $failed_deps -eq 0 ]; then
        success "All external dependencies are reachable"
        return 0
    else
        warning "$failed_deps external dependencies failed"
        return 1
    fi
}

# Performance check
check_performance() {
    log "Running performance checks..."
    
    local start_time=$(date +%s%N)
    make_request "$API_URL/api/v1/health" 200 >/dev/null
    local end_time=$(date +%s%N)
    
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    log "API response time: ${response_time}ms"
    
    if [ $response_time -lt 1000 ]; then
        success "API response time is good (< 1s)"
    elif [ $response_time -lt 3000 ]; then
        warning "API response time is acceptable (1-3s)"
    else
        error "API response time is slow (> 3s)"
        return 1
    fi
    
    return 0
}

# Check SSL certificate (for production)
check_ssl() {
    if [[ "$API_URL" == https* ]]; then
        log "Checking SSL certificate..."
        
        local domain=$(echo "$API_URL" | sed 's/https:\/\///' | cut -d'/' -f1)
        
        if command -v openssl >/dev/null 2>&1; then
            local cert_info=$(openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            
            if [ $? -eq 0 ]; then
                success "SSL certificate is valid"
                echo "$cert_info"
            else
                warning "SSL certificate check failed"
            fi
        else
            warning "OpenSSL not available for SSL check"
        fi
    else
        log "Skipping SSL check (not HTTPS)"
    fi
}

# Generate health report
generate_report() {
    local overall_status="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > health-report.json << EOF
{
  "timestamp": "$timestamp",
  "overall_status": "$overall_status",
  "api_url": "$API_URL",
  "frontend_url": "$FRONTEND_URL",
  "checks": {
    "api_health": $([ $api_health_status -eq 0 ] && echo "true" || echo "false"),
    "api_endpoints": $([ $api_endpoints_status -eq 0 ] && echo "true" || echo "false"),
    "frontend": $([ $frontend_status -eq 0 ] && echo "true" || echo "false"),
    "database": $([ $database_status -eq 0 ] && echo "true" || echo "false"),
    "external_deps": $([ $external_deps_status -eq 0 ] && echo "true" || echo "false"),
    "performance": $([ $performance_status -eq 0 ] && echo "true" || echo "false")
  },
  "environment": "${NODE_ENV:-unknown}"
}
EOF
    
    log "Health report generated: health-report.json"
}

# Main execution
main() {
    log "=== Starting Health Check for Quiz Platform ==="
    log "API URL: $API_URL"
    log "Frontend URL: $FRONTEND_URL"
    log "Timeout: ${TIMEOUT}s"
    log "Retries: $RETRIES"
    echo
    
    # Run all checks
    check_api_health; api_health_status=$?
    check_api_endpoints; api_endpoints_status=$?
    check_frontend; frontend_status=$?
    check_database; database_status=$?
    check_external_dependencies; external_deps_status=$?
    check_performance; performance_status=$?
    check_ssl
    
    # Calculate overall status
    local total_critical_checks=4  # api_health, api_endpoints, frontend, database
    local failed_critical_checks=0
    
    [ $api_health_status -ne 0 ] && failed_critical_checks=$((failed_critical_checks + 1))
    [ $api_endpoints_status -ne 0 ] && failed_critical_checks=$((failed_critical_checks + 1))
    [ $frontend_status -ne 0 ] && failed_critical_checks=$((failed_critical_checks + 1))
    [ $database_status -ne 0 ] && failed_critical_checks=$((failed_critical_checks + 1))
    
    echo
    log "=== Health Check Summary ==="
    
    if [ $failed_critical_checks -eq 0 ]; then
        success "🎉 All critical health checks passed!"
        generate_report "healthy"
        exit 0
    elif [ $failed_critical_checks -lt $total_critical_checks ]; then
        warning "⚠️ Some health checks failed ($failed_critical_checks/$total_critical_checks)"
        generate_report "degraded"
        exit 1
    else
        error "❌ Critical health checks failed ($failed_critical_checks/$total_critical_checks)"
        generate_report "unhealthy"
        exit 2
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --retries)
            RETRIES="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --api-url URL        API base URL"
            echo "  --frontend-url URL   Frontend URL"
            echo "  --timeout SECONDS    Request timeout"
            echo "  --retries NUMBER     Number of retries"
            echo "  --help               Show this help message"
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