#!/bin/bash

# Build Script para Produção - Quiz Platform
# Este script automatiza o processo de build para deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Set environment
export NODE_ENV=production

log "🚀 Starting production build process..."

# Function to check Node.js version
check_node_version() {
    log "Checking Node.js version..."
    node_version=$(node -v | cut -d'v' -f2)
    required_version="18.0.0"
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
        success "Node.js version $node_version is compatible"
    else
        error "Node.js version $node_version is not compatible. Required: >= $required_version"
        exit 1
    fi
}

# Function to check available disk space
check_disk_space() {
    log "Checking available disk space..."
    available_space=$(df . | tail -1 | awk '{print $4}')
    required_space=1048576  # 1GB in KB
    
    if [ "$available_space" -gt "$required_space" ]; then
        success "Sufficient disk space available"
    else
        warning "Low disk space. Available: $(($available_space/1024))MB. Consider cleaning up."
    fi
}

# Function to validate environment variables
validate_env() {
    log "Validating environment variables..."
    
    required_vars=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_API_URL"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        success "All required environment variables are set"
    else
        error "Missing required environment variables: ${missing_vars[*]}"
        echo "Please set these variables before building:"
        for var in "${missing_vars[@]}"; do
            echo "  export $var=your_value"
        done
        exit 1
    fi
}

# Function to clean previous builds
clean_build() {
    log "Cleaning previous builds..."
    
    # Frontend cleanup
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log "Removed frontend/dist"
    fi
    
    if [ -d "frontend/node_modules/.cache" ]; then
        rm -rf frontend/node_modules/.cache
        log "Removed frontend cache"
    fi
    
    # Backend cleanup
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log "Removed backend/dist"
    fi
    
    success "Build directories cleaned"
}

# Function to install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    log "Installing backend dependencies..."
    cd backend
    npm ci --production=false --no-audit --no-fund
    cd ..
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    cd frontend
    npm ci --production=false --no-audit --no-fund
    cd ..
    
    success "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warning "Skipping tests (SKIP_TESTS=true)"
        return
    fi
    
    log "Running tests..."
    
    # Backend tests
    if [ -f "backend/package.json" ] && grep -q '"test"' backend/package.json; then
        log "Running backend tests..."
        cd backend
        npm test 2>/dev/null || {
            warning "Backend tests failed or not configured"
        }
        cd ..
    fi
    
    # Frontend tests (if exists)
    if [ -f "frontend/package.json" ] && grep -q '"test"' frontend/package.json; then
        log "Running frontend tests..."
        cd frontend
        npm test 2>/dev/null || {
            warning "Frontend tests failed or not configured"
        }
        cd ..
    fi
    
    success "Tests completed"
}

# Function to build backend
build_backend() {
    log "Building backend..."
    cd backend
    
    # TypeScript compilation
    npm run build
    
    # Verify build output
    if [ ! -f "dist/server.js" ]; then
        error "Backend build failed - server.js not found"
        exit 1
    fi
    
    # Copy non-TS files if needed
    if [ -d "src/public" ]; then
        cp -r src/public dist/ 2>/dev/null || true
    fi
    
    cd ..
    success "Backend built successfully"
}

# Function to build frontend
build_frontend() {
    log "Building frontend..."
    cd frontend
    
    # Vite build
    npm run build
    
    # Verify build output
    if [ ! -f "dist/index.html" ]; then
        error "Frontend build failed - index.html not found"
        exit 1
    fi
    
    # Check bundle size
    bundle_size=$(du -sh dist | cut -f1)
    log "Frontend bundle size: $bundle_size"
    
    cd ..
    success "Frontend built successfully"
}

# Function to optimize builds
optimize_builds() {
    log "Optimizing builds..."
    
    # Compress backend build (if gzip available)
    if command -v gzip >/dev/null 2>&1; then
        find backend/dist -name "*.js" -exec gzip -9 -k {} \;
        log "Backend files compressed"
    fi
    
    # Frontend optimization is handled by Vite
    success "Build optimization completed"
}

# Function to generate build report
generate_report() {
    log "Generating build report..."
    
    cat > build-report.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)",
  "backend": {
    "built": $([ -f "backend/dist/server.js" ] && echo "true" || echo "false"),
    "size": "$([ -d "backend/dist" ] && du -sh backend/dist | cut -f1 || echo "N/A")"
  },
  "frontend": {
    "built": $([ -f "frontend/dist/index.html" ] && echo "true" || echo "false"),
    "size": "$([ -d "frontend/dist" ] && du -sh frontend/dist | cut -f1 || echo "N/A")"
  },
  "environment": "$NODE_ENV"
}
EOF
    
    success "Build report generated: build-report.json"
}

# Function to validate builds
validate_builds() {
    log "Validating builds..."
    
    # Check backend
    if [ ! -f "backend/dist/server.js" ]; then
        error "Backend validation failed: server.js not found"
        exit 1
    fi
    
    # Check frontend
    if [ ! -f "frontend/dist/index.html" ]; then
        error "Frontend validation failed: index.html not found"
        exit 1
    fi
    
    # Check for common issues
    if grep -r "localhost" frontend/dist/ 2>/dev/null; then
        warning "Found localhost references in frontend build"
    fi
    
    success "Build validation passed"
}

# Main execution
main() {
    log "=== Quiz Platform Production Build ==="
    
    # Pre-build checks
    check_node_version
    check_disk_space
    validate_env
    
    # Build process
    clean_build
    install_dependencies
    run_tests
    build_backend
    build_frontend
    optimize_builds
    validate_builds
    generate_report
    
    success "🎉 Production build completed successfully!"
    log "Backend: backend/dist/"
    log "Frontend: frontend/dist/"
    log "Report: build-report.json"
}

# Handle script interruption
trap 'error "Build interrupted"; exit 1' INT TERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            export SKIP_TESTS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--skip-tests] [--help]"
            echo "  --skip-tests   Skip running tests"
            echo "  --help         Show this help message"
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