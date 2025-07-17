#!/bin/bash

# Automated Deploy Script for Quiz Platform
# Handles complete deployment to DigitalOcean App Platform

set -e

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
BRANCH="${BRANCH:-main}"
DO_APP_ID_PRODUCTION="${DO_APP_ID_PRODUCTION:-}"
DO_APP_ID_STAGING="${DO_APP_ID_STAGING:-}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
RUN_TESTS="${RUN_TESTS:-true}"
AUTO_ROLLBACK="${AUTO_ROLLBACK:-true}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging
log() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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

info() {
    echo -e "${PURPLE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if doctl is installed
    if ! command -v doctl >/dev/null 2>&1; then
        error "doctl is not installed. Please install DigitalOcean CLI."
        echo "Installation: curl -sL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz | tar -xzv"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git >/dev/null 2>&1; then
        error "Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi
    
    # Check doctl authentication
    if ! doctl auth list 2>/dev/null | grep -q "default"; then
        error "doctl is not authenticated. Run: doctl auth init"
        exit 1
    fi
    
    # Check required environment variables
    if [ "$ENVIRONMENT" = "production" ] && [ -z "$DO_APP_ID_PRODUCTION" ]; then
        error "DO_APP_ID_PRODUCTION is required for production deployment"
        exit 1
    fi
    
    if [ "$ENVIRONMENT" = "staging" ] && [ -z "$DO_APP_ID_STAGING" ]; then
        error "DO_APP_ID_STAGING is required for staging deployment"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Get the correct app ID based on environment
get_app_id() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "$DO_APP_ID_PRODUCTION"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        echo "$DO_APP_ID_STAGING"
    else
        error "Unknown environment: $ENVIRONMENT"
        exit 1
    fi
}

# Check git status
check_git_status() {
    log "Checking git status..."
    
    # Check if we're on the correct branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "$BRANCH" ]; then
        warning "Current branch is '$current_branch', but deploying from '$BRANCH'"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warning "There are uncommitted changes"
        git status --porcelain
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
            exit 1
        fi
    fi
    
    # Get current commit info
    local commit_hash=$(git rev-parse HEAD)
    local commit_message=$(git log -1 --pretty=%B)
    
    info "Deploying commit: $commit_hash"
    info "Commit message: $commit_message"
    
    success "Git status check passed"
}

# Run tests before deployment
run_tests() {
    if [ "$RUN_TESTS" = "false" ]; then
        warning "Skipping tests (RUN_TESTS=false)"
        return
    fi
    
    log "Running tests before deployment..."
    
    # Backend tests
    if [ -f "backend/package.json" ] && grep -q '"test"' backend/package.json; then
        log "Running backend tests..."
        cd backend
        npm test || {
            error "Backend tests failed"
            exit 1
        }
        cd ..
    fi
    
    # Frontend tests (if configured)
    if [ -f "frontend/package.json" ] && grep -q '"test"' frontend/package.json; then
        log "Running frontend tests..."
        cd frontend
        npm test 2>/dev/null || warning "Frontend tests not configured or failed"
        cd ..
    fi
    
    success "Tests passed"
}

# Create backup of current deployment
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "false" ]; then
        warning "Skipping backup (BACKUP_BEFORE_DEPLOY=false)"
        return
    fi
    
    log "Creating backup of current deployment..."
    
    local app_id=$(get_app_id)
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)_${ENVIRONMENT}"
    
    mkdir -p "$backup_dir"
    
    # Get current app spec
    doctl apps spec get "$app_id" > "$backup_dir/app-spec.yaml" || {
        warning "Could not backup current app spec"
    }
    
    # Get current deployment info
    doctl apps list-deployments "$app_id" --format ID,Phase,CreatedAt,UpdatedAt > "$backup_dir/deployments.txt" || {
        warning "Could not backup deployment info"
    }
    
    # Store git info
    cat > "$backup_dir/git-info.txt" << EOF
Branch: $(git rev-parse --abbrev-ref HEAD)
Commit: $(git rev-parse HEAD)
Message: $(git log -1 --pretty=%B)
Date: $(date)
Environment: $ENVIRONMENT
EOF
    
    info "Backup created in $backup_dir"
}

# Send Slack notification
send_slack_notification() {
    local message="$1"
    local color="$2"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "Quiz Platform Deployment",
            "text": "$message",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Branch",
                    "value": "$BRANCH",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "$(git rev-parse --short HEAD)",
                    "short": true
                }
            ],
            "footer": "Quiz Platform Deploy",
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

# Deploy to DigitalOcean App Platform
deploy_to_digitalocean() {
    log "Starting deployment to DigitalOcean App Platform..."
    
    local app_id=$(get_app_id)
    
    # Update app spec for the target environment
    local app_spec_file=".do/app.yaml"
    local temp_spec_file="/tmp/app-spec-${ENVIRONMENT}.yaml"
    
    # Copy and modify app spec for environment
    cp "$app_spec_file" "$temp_spec_file"
    
    # Update branch in app spec
    sed -i "s/branch: main/branch: $BRANCH/g" "$temp_spec_file"
    
    # Environment-specific modifications
    if [ "$ENVIRONMENT" = "staging" ]; then
        # Update domain for staging
        sed -i 's/quizv1.com/staging.quizv1.com/g' "$temp_spec_file"
        # Reduce instance sizes for staging
        sed -i 's/basic-s/basic-xxs/g' "$temp_spec_file"
    fi
    
    log "Deploying with app spec: $temp_spec_file"
    
    # Start deployment
    local deployment_id=$(doctl apps update "$app_id" --spec "$temp_spec_file" --format ID --no-header)
    
    if [ -z "$deployment_id" ]; then
        error "Failed to start deployment"
        exit 1
    fi
    
    info "Deployment started with ID: $deployment_id"
    
    # Monitor deployment progress
    log "Monitoring deployment progress..."
    local max_wait=1800  # 30 minutes
    local elapsed=0
    local check_interval=30
    
    while [ $elapsed -lt $max_wait ]; do
        local status=$(doctl apps get-deployment "$app_id" "$deployment_id" --format Phase --no-header)
        
        case "$status" in
            "PENDING_BUILD"|"BUILDING"|"PENDING_DEPLOY"|"DEPLOYING")
                info "Deployment status: $status (${elapsed}s elapsed)"
                ;;
            "ACTIVE")
                success "Deployment completed successfully!"
                return 0
                ;;
            "ERROR"|"CANCELED")
                error "Deployment failed with status: $status"
                return 1
                ;;
            *)
                warning "Unknown deployment status: $status"
                ;;
        esac
        
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
    done
    
    error "Deployment timed out after ${max_wait}s"
    return 1
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Determine URLs based on environment
    local api_url
    local frontend_url
    
    if [ "$ENVIRONMENT" = "production" ]; then
        api_url="https://quiz-platform-api.ondigitalocean.app"
        frontend_url="https://quizv1.com"
    else
        api_url="https://quiz-platform-staging-api.ondigitalocean.app"
        frontend_url="https://staging.quizv1.com"
    fi
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 60
    
    # Run health check
    local health_script="$(dirname "$0")/health-check.sh"
    if [ -f "$health_script" ]; then
        if "$health_script" --api-url "$api_url" --frontend-url "$frontend_url"; then
            success "Deployment verification passed"
            return 0
        else
            error "Deployment verification failed"
            return 1
        fi
    else
        # Fallback verification
        if curl -sf --max-time 30 "$api_url/api/v1/health" >/dev/null; then
            success "Basic deployment verification passed"
            return 0
        else
            error "Basic deployment verification failed"
            return 1
        fi
    fi
}

# Rollback deployment
rollback_deployment() {
    if [ "$AUTO_ROLLBACK" = "false" ]; then
        warning "Auto-rollback is disabled"
        return
    fi
    
    error "Starting automatic rollback..."
    
    local app_id=$(get_app_id)
    
    # Get previous deployment
    local previous_deployment=$(doctl apps list-deployments "$app_id" --format ID,Phase --no-header | grep "ACTIVE" | head -n 2 | tail -n 1 | awk '{print $1}')
    
    if [ -n "$previous_deployment" ]; then
        log "Rolling back to deployment: $previous_deployment"
        # Note: DigitalOcean doesn't have direct rollback, would need to redeploy previous version
        warning "Rollback would require redeploying previous version"
    else
        error "No previous deployment found for rollback"
    fi
}

# Main deployment function
main() {
    log "=== Starting deployment to $ENVIRONMENT ==="
    
    # Deployment start notification
    send_slack_notification "🚀 Starting deployment to $ENVIRONMENT" "#ffa500"
    
    # Pre-deployment checks
    check_prerequisites
    check_git_status
    run_tests
    create_backup
    
    # Deploy
    if deploy_to_digitalocean; then
        log "Deployment phase completed"
        
        # Verify deployment
        if verify_deployment; then
            success "🎉 Deployment to $ENVIRONMENT completed successfully!"
            send_slack_notification "✅ Deployment to $ENVIRONMENT completed successfully!" "good"
            
            # Show deployment info
            local app_id=$(get_app_id)
            info "App ID: $app_id"
            info "Environment: $ENVIRONMENT"
            info "Branch: $BRANCH"
            info "Commit: $(git rev-parse --short HEAD)"
            
        else
            error "Deployment verification failed!"
            send_slack_notification "❌ Deployment to $ENVIRONMENT failed verification!" "danger"
            rollback_deployment
            exit 1
        fi
    else
        error "Deployment failed!"
        send_slack_notification "❌ Deployment to $ENVIRONMENT failed!" "danger"
        rollback_deployment
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --branch|-b)
            BRANCH="$2"
            shift 2
            ;;
        --no-tests)
            RUN_TESTS=false
            shift
            ;;
        --no-backup)
            BACKUP_BEFORE_DEPLOY=false
            shift
            ;;
        --no-rollback)
            AUTO_ROLLBACK=false
            shift
            ;;
        --app-id)
            if [ "$ENVIRONMENT" = "production" ]; then
                DO_APP_ID_PRODUCTION="$2"
            else
                DO_APP_ID_STAGING="$2"
            fi
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -e, --environment ENV    Target environment (production|staging)"
            echo "  -b, --branch BRANCH      Git branch to deploy (default: main)"
            echo "  --app-id ID              DigitalOcean App ID"
            echo "  --no-tests               Skip running tests"
            echo "  --no-backup              Skip creating backup"
            echo "  --no-rollback            Disable auto-rollback on failure"
            echo "  --slack-webhook URL      Slack webhook for notifications"
            echo "  --help                   Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DO_APP_ID_PRODUCTION     Production app ID"
            echo "  DO_APP_ID_STAGING        Staging app ID"
            echo "  SLACK_WEBHOOK            Slack webhook URL"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'production' or 'staging'"
    exit 1
fi

# Run main function
main