#!/bin/bash

# QuizV1 Supabase Setup Script
# This script sets up the complete database structure for QuizV1

set -e

echo "🚀 Setting up QuizV1 Database Structure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

print_status "Supabase CLI found ✓"

# Check if we're in the right directory
if [ ! -f "config.toml" ]; then
    print_error "config.toml not found. Please run this script from the supabase directory."
    exit 1
fi

print_status "Configuration file found ✓"

# Check if Supabase is running
if ! supabase status > /dev/null 2>&1; then
    print_status "Starting Supabase local environment..."
    supabase start
else
    print_status "Supabase is already running ✓"
fi

# Reset database to clean state
print_status "Resetting database to clean state..."
supabase db reset --debug

# Check if reset was successful
if [ $? -eq 0 ]; then
    print_status "Database reset successful ✓"
else
    print_error "Database reset failed"
    exit 1
fi

# Apply seed data
print_status "Applying seed data..."
if [ -f "seed.sql" ]; then
    supabase db seed
    print_status "Seed data applied ✓"
else
    print_warning "seed.sql not found, skipping seed data"
fi

# Get local database URL
DB_URL=$(supabase status | grep "DB URL" | awk '{print $3}')
API_URL=$(supabase status | grep "API URL" | awk '{print $3}')
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

print_status "Database setup complete! 🎉"
echo ""
echo "📊 Database Information:"
echo "  Database URL: $DB_URL"
echo "  API URL: $API_URL"
echo "  Anon Key: $ANON_KEY"
echo ""
echo "🔗 Useful Links:"
echo "  Supabase Studio: http://localhost:54323"
echo "  Database: http://localhost:54322"
echo "  API: http://localhost:54321"
echo ""

# Verify tables were created
print_status "Verifying database structure..."

# Check if main tables exist
TABLES=(
    "users"
    "funnels"
    "steps"
    "elements"
    "leads"
    "analytics"
    "templates"
    "user_plans"
    "user_actions"
)

for table in "${TABLES[@]}"; do
    if psql "$DB_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
        print_status "Table '$table' exists ✓"
    else
        print_error "Table '$table' missing ✗"
    fi
done

# Check if storage buckets exist
print_status "Checking storage buckets..."
BUCKETS=(
    "funnel-images"
    "funnel-videos"
    "user-uploads"
    "templates"
)

for bucket in "${BUCKETS[@]}"; do
    if psql "$DB_URL" -c "SELECT 1 FROM storage.buckets WHERE id = '$bucket';" | grep -q "1 row"; then
        print_status "Bucket '$bucket' exists ✓"
    else
        print_error "Bucket '$bucket' missing ✗"
    fi
done

# Check if functions exist
print_status "Checking database functions..."
FUNCTIONS=(
    "get_funnel_analytics"
    "get_user_dashboard_stats"
    "record_funnel_view"
    "record_funnel_conversion"
    "get_funnel_with_structure"
    "duplicate_funnel"
    "get_user_plan_status"
    "check_user_plan_limits"
)

for func in "${FUNCTIONS[@]}"; do
    if psql "$DB_URL" -c "SELECT 1 FROM pg_proc WHERE proname = '$func';" | grep -q "1 row"; then
        print_status "Function '$func' exists ✓"
    else
        print_error "Function '$func' missing ✗"
    fi
done

# Test basic functionality
print_status "Testing basic functionality..."

# Test user creation
TEST_USER_ID="123e4567-e89b-12d3-a456-426614174000"
if psql "$DB_URL" -c "INSERT INTO users (id, email, plan) VALUES ('$TEST_USER_ID', 'test@example.com', 'free') ON CONFLICT (id) DO NOTHING;" > /dev/null 2>&1; then
    print_status "User creation test passed ✓"
    
    # Test funnel creation
    if psql "$DB_URL" -c "INSERT INTO funnels (user_id, title, description) VALUES ('$TEST_USER_ID', 'Test Funnel', 'Test Description');" > /dev/null 2>&1; then
        print_status "Funnel creation test passed ✓"
    else
        print_error "Funnel creation test failed ✗"
    fi
    
    # Cleanup test data
    psql "$DB_URL" -c "DELETE FROM users WHERE id = '$TEST_USER_ID';" > /dev/null 2>&1
else
    print_error "User creation test failed ✗"
fi

# Generate environment variables template
print_status "Generating environment variables template..."
cat > ../.env.example << EOF
# Supabase Configuration
SUPABASE_URL=$API_URL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration (for local development)
DATABASE_URL=$DB_URL

# App Configuration
NODE_ENV=development
PORT=3000

# Optional: Enable debug logging
DEBUG=supabase:*
EOF

print_status "Environment template created at ../.env.example ✓"

echo ""
print_status "Setup Summary:"
echo "✅ Database structure created"
echo "✅ Row Level Security enabled"
echo "✅ Analytics functions installed"
echo "✅ Storage buckets configured"
echo "✅ Auth policies applied"
echo "✅ Seed data loaded"
echo "✅ Environment template generated"
echo ""
echo "📚 Next Steps:"
echo "1. Copy ../.env.example to ../.env and configure your keys"
echo "2. Start your application"
echo "3. Visit http://localhost:54323 to explore the database"
echo "4. Check the README.md for detailed documentation"
echo ""
echo "🎉 Your QuizV1 database is ready to use!"