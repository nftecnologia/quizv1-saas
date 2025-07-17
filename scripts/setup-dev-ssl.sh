#!/bin/bash

# Setup Development SSL Certificates
# Creates self-signed certificates for local development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[SSL-SETUP]${NC} $1"
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

# Configuration
SSL_DIR="./docker/nginx/ssl"
DOMAIN="quiz.local"
DAYS_VALID=365

# Create SSL directory
create_ssl_directory() {
    log "Creating SSL directory..."
    mkdir -p "$SSL_DIR"
    success "SSL directory created: $SSL_DIR"
}

# Check if OpenSSL is available
check_openssl() {
    if ! command -v openssl >/dev/null 2>&1; then
        error "OpenSSL is not installed"
        echo "Please install OpenSSL:"
        echo "  macOS: brew install openssl"
        echo "  Ubuntu: sudo apt-get install openssl"
        echo "  CentOS: sudo yum install openssl"
        exit 1
    fi
    
    success "OpenSSL is available"
}

# Generate private key
generate_private_key() {
    log "Generating private key..."
    
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    if [ $? -eq 0 ]; then
        success "Private key generated: $SSL_DIR/key.pem"
    else
        error "Failed to generate private key"
        exit 1
    fi
}

# Generate certificate signing request
generate_csr() {
    log "Generating certificate signing request..."
    
    # Create config file for CSR
    cat > "$SSL_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=Development
L=Local
O=Quiz Platform
OU=Development
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.quiz.local
DNS.4 = 127.0.0.1
DNS.5 = ::1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" -config "$SSL_DIR/cert.conf"
    
    if [ $? -eq 0 ]; then
        success "CSR generated: $SSL_DIR/cert.csr"
    else
        error "Failed to generate CSR"
        exit 1
    fi
}

# Generate self-signed certificate
generate_certificate() {
    log "Generating self-signed certificate..."
    
    openssl x509 -req -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days $DAYS_VALID -extensions v3_req -extfile "$SSL_DIR/cert.conf"
    
    if [ $? -eq 0 ]; then
        success "Certificate generated: $SSL_DIR/cert.pem"
    else
        error "Failed to generate certificate"
        exit 1
    fi
}

# Set proper permissions
set_permissions() {
    log "Setting file permissions..."
    
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 644 "$SSL_DIR/cert.csr"
    chmod 644 "$SSL_DIR/cert.conf"
    
    success "Permissions set correctly"
}

# Verify certificate
verify_certificate() {
    log "Verifying certificate..."
    
    # Check certificate details
    echo "Certificate details:"
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|DNS:|IP Address:|Not Before|Not After)"
    
    # Verify certificate against private key
    cert_hash=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    key_hash=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [ "$cert_hash" = "$key_hash" ]; then
        success "Certificate and private key match"
    else
        error "Certificate and private key do not match"
        exit 1
    fi
    
    success "Certificate verification completed"
}

# Add to system keychain (macOS)
add_to_keychain_macos() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log "Adding certificate to macOS keychain..."
        
        # Add to keychain
        sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$SSL_DIR/cert.pem"
        
        if [ $? -eq 0 ]; then
            success "Certificate added to macOS keychain"
        else
            warning "Failed to add certificate to keychain (this is optional)"
        fi
    fi
}

# Add hosts entry
add_hosts_entry() {
    log "Checking hosts file..."
    
    if ! grep -q "$DOMAIN" /etc/hosts; then
        warning "Adding $DOMAIN to hosts file..."
        echo "127.0.0.1 $DOMAIN" | sudo tee -a /etc/hosts
        success "Added $DOMAIN to hosts file"
    else
        success "$DOMAIN already exists in hosts file"
    fi
}

# Generate browser instructions
generate_instructions() {
    cat > "$SSL_DIR/README.md" << EOF
# Development SSL Certificates

## Generated Files

- \`cert.pem\`: SSL certificate
- \`key.pem\`: Private key
- \`cert.csr\`: Certificate signing request
- \`cert.conf\`: OpenSSL configuration

## Usage

These certificates are automatically used by the nginx container in docker-compose.

## Browser Setup

### Chrome/Edge
1. Go to \`chrome://settings/certificates\`
2. Click "Manage certificates"
3. Go to "Trusted Root Certification Authorities"
4. Click "Import" and select \`cert.pem\`

### Firefox
1. Go to \`about:preferences#privacy\`
2. Scroll to "Certificates"
3. Click "View Certificates"
4. Go to "Authorities" tab
5. Click "Import" and select \`cert.pem\`

### Safari (macOS)
The certificate should be automatically trusted if added to keychain.

## Access URLs

- HTTP: http://quiz.local
- HTTPS: https://quiz.local

## Security Note

These are self-signed certificates for development only.
Never use these certificates in production!

## Regenerating

To regenerate certificates, run:
\`\`\`bash
./scripts/setup-dev-ssl.sh --force
\`\`\`
EOF

    success "Instructions generated: $SSL_DIR/README.md"
}

# Clean up temporary files
cleanup() {
    log "Cleaning up temporary files..."
    rm -f "$SSL_DIR/cert.csr"
    success "Cleanup completed"
}

# Main function
main() {
    log "=== Setting up Development SSL Certificates ==="
    log "Domain: $DOMAIN"
    log "Valid for: $DAYS_VALID days"
    echo
    
    # Check if certificates already exist
    if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
        if [ "$1" != "--force" ]; then
            warning "SSL certificates already exist!"
            echo "Use --force to regenerate"
            echo "Existing certificates:"
            ls -la "$SSL_DIR/"*.pem 2>/dev/null || true
            exit 0
        else
            log "Forcing regeneration of certificates..."
        fi
    fi
    
    # Generate certificates
    check_openssl
    create_ssl_directory
    generate_private_key
    generate_csr
    generate_certificate
    set_permissions
    verify_certificate
    add_to_keychain_macos
    add_hosts_entry
    generate_instructions
    cleanup
    
    success "🎉 SSL certificates generated successfully!"
    echo
    log "Next steps:"
    echo "1. Start docker-compose: docker-compose up -d"
    echo "2. Access https://quiz.local (accept security warning)"
    echo "3. Import certificate to browser (see $SSL_DIR/README.md)"
    echo
    warning "Note: You may need to accept security warnings on first visit"
}

# Parse arguments
case "${1:-}" in
    --force)
        main --force
        ;;
    --help)
        echo "Usage: $0 [--force] [--help]"
        echo "  --force  Regenerate certificates even if they exist"
        echo "  --help   Show this help message"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac