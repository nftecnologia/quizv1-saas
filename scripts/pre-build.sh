#!/bin/bash

# Pre-build Script - Quiz Platform
# Executa verificações e preparações antes do build

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[PRE-BUILD]${NC} $1"
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

# Check system dependencies
check_dependencies() {
    log "Checking system dependencies..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    # Git (for versioning)
    if ! command -v git &> /dev/null; then
        warning "Git is not installed - version info will be limited"
    fi
    
    success "System dependencies check passed"
}

# Verify package.json files
verify_package_files() {
    log "Verifying package.json files..."
    
    if [ ! -f "backend/package.json" ]; then
        error "Backend package.json not found"
        exit 1
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        error "Frontend package.json not found"
        exit 1
    fi
    
    # Check for required scripts
    if ! grep -q '"build"' backend/package.json; then
        error "Backend package.json missing build script"
        exit 1
    fi
    
    if ! grep -q '"build"' frontend/package.json; then
        error "Frontend package.json missing build script"
        exit 1
    fi
    
    success "Package files verification passed"
}

# Check environment configuration
check_environment() {
    log "Checking environment configuration..."
    
    # Check for environment files
    if [ -f ".env" ]; then
        log "Found .env file"
    fi
    
    if [ -f ".env.production" ]; then
        log "Found .env.production file"
        # Source production environment
        set -a
        source .env.production
        set +a
    fi
    
    # Validate critical environment variables
    critical_vars=(
        "NODE_ENV"
    )
    
    for var in "${critical_vars[@]}"; do
        if [ -z "${!var}" ]; then
            warning "Environment variable $var is not set"
        fi
    done
    
    success "Environment check completed"
}

# Clean temporary files
clean_temp_files() {
    log "Cleaning temporary files..."
    
    # Remove common temporary files
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    
    # Clean npm cache if needed
    if [ "$CLEAN_NPM_CACHE" = "true" ]; then
        npm cache clean --force 2>/dev/null || true
        log "NPM cache cleaned"
    fi
    
    success "Temporary files cleaned"
}

# Generate build metadata
generate_metadata() {
    log "Generating build metadata..."
    
    # Get Git information if available
    if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
        GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
        GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
    else
        GIT_COMMIT="unknown"
        GIT_BRANCH="unknown"
        GIT_TAG=""
    fi
    
    # Create metadata file
    cat > build-metadata.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "${NODE_ENV:-development}",
  "git": {
    "commit": "$GIT_COMMIT",
    "branch": "$GIT_BRANCH",
    "tag": "$GIT_TAG"
  },
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)",
  "platform": "$(uname -s)",
  "architecture": "$(uname -m)"
}
EOF
    
    success "Build metadata generated"
}

# Validate TypeScript configuration
validate_typescript() {
    log "Validating TypeScript configuration..."
    
    # Backend TypeScript
    if [ -f "backend/tsconfig.json" ]; then
        cd backend
        if command -v npx &> /dev/null; then
            npx tsc --noEmit --skipLibCheck 2>/dev/null || {
                warning "Backend TypeScript validation failed"
            }
        fi
        cd ..
    fi
    
    # Frontend TypeScript
    if [ -f "frontend/tsconfig.json" ]; then
        cd frontend
        if command -v npx &> /dev/null; then
            npx tsc --noEmit --skipLibCheck 2>/dev/null || {
                warning "Frontend TypeScript validation failed"
            }
        fi
        cd ..
    fi
    
    success "TypeScript validation completed"
}

# Check for security vulnerabilities
security_check() {
    log "Running security checks..."
    
    # Backend security check
    if [ -f "backend/package-lock.json" ]; then
        cd backend
        npm audit --audit-level=high 2>/dev/null || {
            warning "Backend security vulnerabilities found"
        }
        cd ..
    fi
    
    # Frontend security check
    if [ -f "frontend/package-lock.json" ]; then
        cd frontend
        npm audit --audit-level=high 2>/dev/null || {
            warning "Frontend security vulnerabilities found"
        }
        cd ..
    fi
    
    success "Security checks completed"
}

# Optimize dependencies
optimize_dependencies() {
    log "Optimizing dependencies..."
    
    # Check for outdated packages
    if [ "$CHECK_OUTDATED" = "true" ]; then
        log "Checking for outdated packages..."
        cd backend && npm outdated 2>/dev/null || true && cd ..
        cd frontend && npm outdated 2>/dev/null || true && cd ..
    fi
    
    success "Dependency optimization completed"
}

# Create backup of current build
backup_previous_build() {
    if [ "$BACKUP_BUILD" = "true" ]; then
        log "Creating backup of previous build..."
        
        backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        if [ -d "backend/dist" ]; then
            cp -r backend/dist "$backup_dir/backend-dist"
        fi
        
        if [ -d "frontend/dist" ]; then
            cp -r frontend/dist "$backup_dir/frontend-dist"
        fi
        
        log "Backup created in $backup_dir"
    fi
}

# Main execution
main() {
    log "=== Starting Pre-Build Process ==="
    
    check_dependencies
    verify_package_files
    check_environment
    clean_temp_files
    generate_metadata
    validate_typescript
    security_check
    optimize_dependencies
    backup_previous_build
    
    success "✅ Pre-build process completed successfully!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean-cache)
            export CLEAN_NPM_CACHE=true
            shift
            ;;
        --check-outdated)
            export CHECK_OUTDATED=true
            shift
            ;;
        --backup)
            export BACKUP_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --clean-cache     Clean npm cache before build"
            echo "  --check-outdated  Check for outdated packages"
            echo "  --backup          Create backup of previous build"
            echo "  --help            Show this help message"
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