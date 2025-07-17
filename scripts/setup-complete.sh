#!/bin/bash

# Complete Setup Script for Quiz Platform
# Configures everything needed for development and deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[SETUP]${NC} $1"
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

step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Configuration
SETUP_MODE="${1:-development}"  # development, staging, production
SKIP_DEPS="${SKIP_DEPS:-false}"
SKIP_DOCKER="${SKIP_DOCKER:-false}"
SKIP_SSL="${SKIP_SSL:-false}"

# Display banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
  ____        _        ____  _       _    __                     
 / __ \      (_)      |  _ \| |     | |  / _|                    
| |  | |_   _ _ ______ | |_) | | __ _| |_| |_ ___  _ __ _ __ ___   
| |  | | | | | |______||  _ <| |/ _` | __|  _/ _ \| '__| '_ ` _ \  
| |__| | |_| | |       | |_) | | (_| | |_| || (_) | |  | | | | | |
 \___\_\\__,_|_|       |____/|_|\__,_|\__|_| \___/|_|  |_| |_| |_|
                                                                   
EOF
    echo -e "${NC}"
    echo -e "${BLUE}Quiz Platform - Complete Setup${NC}"
    echo -e "${YELLOW}Mode: $SETUP_MODE${NC}"
    echo
}

# Check system requirements
check_system_requirements() {
    step "Checking system requirements..."
    
    local missing_tools=()
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_tools+=("node")
    else
        local node_version=$(node -v | cut -d'v' -f2)
        local required_version="18.0.0"
        if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
            warning "Node.js version $node_version found, but >= $required_version required"
            missing_tools+=("node (update required)")
        else
            success "Node.js $node_version ✓"
        fi
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        missing_tools+=("npm")
    else
        success "npm $(npm -v) ✓"
    fi
    
    # Check Git
    if ! command -v git >/dev/null 2>&1; then
        missing_tools+=("git")
    else
        success "Git $(git --version | cut -d' ' -f3) ✓"
    fi
    
    # Check Docker (optional)
    if [ "$SKIP_DOCKER" != "true" ]; then
        if ! command -v docker >/dev/null 2>&1; then
            warning "Docker not found (optional for development)"
        else
            success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
        fi
        
        if ! command -v docker-compose >/dev/null 2>&1; then
            warning "Docker Compose not found (optional for development)"
        else
            success "Docker Compose $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
        fi
    fi
    
    # Check doctl for deployment
    if [[ "$SETUP_MODE" == "staging" || "$SETUP_MODE" == "production" ]]; then
        if ! command -v doctl >/dev/null 2>&1; then
            missing_tools+=("doctl")
        else
            success "doctl $(doctl version | grep 'doctl version' | cut -d' ' -f3) ✓"
        fi
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo
        echo "Installation instructions:"
        echo "Node.js: https://nodejs.org/en/download/"
        echo "Git: https://git-scm.com/downloads"
        echo "Docker: https://docs.docker.com/get-docker/"
        echo "doctl: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    success "All required tools are available"
}

# Setup environment files
setup_environment_files() {
    step "Setting up environment files..."
    
    # Development environment
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            success "Created .env from .env.example"
        else
            warning ".env.example not found, creating basic .env"
            cat > .env << EOF
NODE_ENV=development
PORT=3000
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
JWT_SECRET=dev_jwt_secret_key_minimum_32_characters
REDIS_URL=redis://localhost:6379
EOF
            success "Created basic .env file"
        fi
    else
        info ".env file already exists"
    fi
    
    # Production environment template
    if [ ! -f ".env.production" ] && [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        success "Created .env.production from example"
        warning "Please configure .env.production with your actual values"
    fi
    
    # Development environment for Docker
    if [ ! -f ".env.docker" ]; then
        cat > .env.docker << EOF
# Docker development environment
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
JWT_SECRET=dev_jwt_secret_key_minimum_32_characters
POSTGRES_DB=quiz_platform_dev
POSTGRES_USER=quiz_user
POSTGRES_PASSWORD=quiz_password
EOF
        success "Created .env.docker for Docker development"
    fi
}

# Install dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = "true" ]; then
        warning "Skipping dependency installation"
        return
    fi
    
    step "Installing dependencies..."
    
    # Backend dependencies
    if [ -f "backend/package.json" ]; then
        log "Installing backend dependencies..."
        cd backend
        npm ci --no-audit --no-fund
        cd ..
        success "Backend dependencies installed"
    fi
    
    # Frontend dependencies
    if [ -f "frontend/package.json" ]; then
        log "Installing frontend dependencies..."
        cd frontend
        npm ci --no-audit --no-fund
        cd ..
        success "Frontend dependencies installed"
    fi
    
    # Root dependencies (if any)
    if [ -f "package.json" ]; then
        log "Installing root dependencies..."
        npm ci --no-audit --no-fund
        success "Root dependencies installed"
    fi
}

# Setup SSL certificates for development
setup_ssl_certificates() {
    if [ "$SKIP_SSL" = "true" ]; then
        warning "Skipping SSL setup"
        return
    fi
    
    step "Setting up SSL certificates for development..."
    
    local ssl_script="./scripts/setup-dev-ssl.sh"
    if [ -f "$ssl_script" ]; then
        "$ssl_script"
        success "SSL certificates configured"
    else
        warning "SSL setup script not found, skipping SSL configuration"
    fi
}

# Initialize Git hooks
setup_git_hooks() {
    step "Setting up Git hooks..."
    
    # Create pre-commit hook
    mkdir -p .git/hooks
    
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for Quiz Platform

echo "Running pre-commit checks..."

# Run linting
echo "Checking code style..."
cd backend && npm run lint || exit 1
cd ../frontend && npm run lint || exit 1

# Run tests
echo "Running tests..."
cd ../backend && npm test || exit 1

echo "Pre-commit checks passed!"
EOF
    
    chmod +x .git/hooks/pre-commit
    success "Git pre-commit hook installed"
    
    # Create commit message template
    cat > .gitmessage << 'EOF'
# feat: add new feature
# fix: bug fix
# docs: documentation changes
# style: formatting, missing semi colons, etc
# refactor: code restructure without behavior change
# perf: performance improvements
# test: adding tests
# chore: maintenance tasks

# Body: Explain what and why (not how)

# Footer: Reference issues and breaking changes
EOF
    
    git config commit.template .gitmessage 2>/dev/null || true
    success "Git commit template configured"
}

# Setup development database
setup_development_database() {
    step "Setting up development database..."
    
    if [ -d "supabase/migrations" ]; then
        info "Supabase migrations found"
        info "Please run migrations manually using Supabase CLI or dashboard"
        info "Migration files located in: supabase/migrations/"
    else
        warning "No database migrations found"
    fi
    
    # Check if using local PostgreSQL
    if docker-compose ps postgres >/dev/null 2>&1; then
        info "Local PostgreSQL container detected"
        log "Waiting for database to be ready..."
        sleep 5
        
        # Run migrations if available
        if [ -f "scripts/run-migrations.sh" ]; then
            ./scripts/run-migrations.sh
            success "Database migrations completed"
        fi
    fi
}

# Configure deployment settings
configure_deployment() {
    if [[ "$SETUP_MODE" == "development" ]]; then
        return
    fi
    
    step "Configuring deployment settings..."
    
    # Check DigitalOcean authentication
    if ! doctl account get >/dev/null 2>&1; then
        warning "DigitalOcean CLI not authenticated"
        echo "Please run: doctl auth init"
        echo "You'll need your DigitalOcean API token"
    else
        success "DigitalOcean CLI authenticated"
    fi
    
    # Validate app spec
    if [ -f ".do/app.yaml" ]; then
        if doctl apps spec validate .do/app.yaml >/dev/null 2>&1; then
            success "DigitalOcean app spec is valid"
        else
            warning "DigitalOcean app spec validation failed"
            echo "Please check .do/app.yaml for errors"
        fi
    else
        error ".do/app.yaml not found"
        echo "This file is required for DigitalOcean deployment"
    fi
}

# Run health checks
run_health_checks() {
    step "Running health checks..."
    
    # Check if services are running (if Docker)
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose ps >/dev/null 2>&1; then
            local running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
            if [ "$running_services" -gt 0 ]; then
                success "$running_services Docker services are running"
            fi
        fi
    fi
    
    # Check port availability
    local ports_to_check=(3000 5173 6379)
    for port in "${ports_to_check[@]}"; do
        if lsof -i ":$port" >/dev/null 2>&1; then
            warning "Port $port is already in use"
        else
            success "Port $port is available"
        fi
    done
    
    # Run application health check if available
    if [ -f "scripts/health-check.sh" ]; then
        log "Running application health check..."
        if ./scripts/health-check.sh --api-url http://localhost:3000 --frontend-url http://localhost:5173 2>/dev/null; then
            success "Application health check passed"
        else
            info "Application health check failed (services may not be running yet)"
        fi
    fi
}

# Generate startup scripts
generate_startup_scripts() {
    step "Generating startup scripts..."
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash
# Start development environment

echo "Starting Quiz Platform development environment..."

# Start backend
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "URLs:"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF
    
    chmod +x start-dev.sh
    success "Created start-dev.sh"
    
    # Docker startup script
    cat > start-docker.sh << 'EOF'
#!/bin/bash
# Start Docker development environment

echo "Starting Quiz Platform with Docker..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
docker-compose up -d

echo "Services started!"
echo ""
echo "URLs:"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo "Nginx: http://localhost:80"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
EOF
    
    chmod +x start-docker.sh
    success "Created start-docker.sh"
}

# Display final instructions
show_final_instructions() {
    success "🎉 Setup completed successfully!"
    echo
    echo -e "${CYAN}=== Next Steps ===${NC}"
    echo
    
    case "$SETUP_MODE" in
        "development")
            echo -e "${YELLOW}Development Setup:${NC}"
            echo "1. Configure your environment variables in .env"
            echo "2. Set up your Supabase project and update .env"
            echo "3. Start development servers:"
            echo "   • Native: ./start-dev.sh"
            echo "   • Docker: ./start-docker.sh"
            echo
            echo -e "${YELLOW}URLs:${NC}"
            echo "• Frontend: http://localhost:5173"
            echo "• Backend: http://localhost:3000"
            echo "• HTTPS (with SSL): https://quiz.local"
            ;;
        "staging")
            echo -e "${YELLOW}Staging Setup:${NC}"
            echo "1. Configure .env.production with staging values"
            echo "2. Create staging app on DigitalOcean"
            echo "3. Deploy to staging:"
            echo "   ./scripts/deploy.sh --environment staging"
            ;;
        "production")
            echo -e "${YELLOW}Production Setup:${NC}"
            echo "1. Configure .env.production with production values"
            echo "2. Set up production app on DigitalOcean"
            echo "3. Configure GitHub secrets for CI/CD"
            echo "4. Deploy to production:"
            echo "   ./scripts/deploy.sh --environment production"
            ;;
    esac
    
    echo
    echo -e "${CYAN}=== Useful Commands ===${NC}"
    echo "• Health check: ./scripts/health-check.sh"
    echo "• Monitor: ./scripts/monitor.sh"
    echo "• Build: ./scripts/build.sh"
    echo "• Deploy: ./scripts/deploy.sh"
    echo
    echo -e "${CYAN}=== Documentation ===${NC}"
    echo "• Complete guide: ./DEPLOY_GUIDE.md"
    echo "• Environment setup: ./.env.production.example"
    echo "• SSL setup: ./docker/nginx/ssl/README.md"
    echo
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    show_banner
    
    log "Starting complete setup for $SETUP_MODE environment..."
    echo
    
    check_system_requirements
    setup_environment_files
    install_dependencies
    setup_ssl_certificates
    setup_git_hooks
    setup_development_database
    configure_deployment
    run_health_checks
    generate_startup_scripts
    
    echo
    show_final_instructions
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            SETUP_MODE="$2"
            shift 2
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options] [mode]"
            echo ""
            echo "Modes:"
            echo "  development  Setup for local development (default)"
            echo "  staging      Setup for staging deployment"
            echo "  production   Setup for production deployment"
            echo ""
            echo "Options:"
            echo "  --skip-deps   Skip dependency installation"
            echo "  --skip-docker Skip Docker-related setup"
            echo "  --skip-ssl    Skip SSL certificate generation"
            echo "  --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                # Development setup"
            echo "  $0 --mode production             # Production setup"
            echo "  $0 --skip-deps --skip-docker     # Minimal setup"
            exit 0
            ;;
        development|staging|production)
            SETUP_MODE="$1"
            shift
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate setup mode
if [[ ! "$SETUP_MODE" =~ ^(development|staging|production)$ ]]; then
    error "Invalid setup mode: $SETUP_MODE"
    echo "Valid modes: development, staging, production"
    exit 1
fi

# Run main function
main