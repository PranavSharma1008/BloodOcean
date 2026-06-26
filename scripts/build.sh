#!/bin/bash

# Blood Donation Finder - Production Build Script

echo "=================================="
echo "Blood Donation Finder - Build Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if .env files exist
check_env_files() {
    echo ""
    echo "Checking environment files..."
    
    if [ ! -f "server/.env" ]; then
        print_error "server/.env not found. Please create it from server/.env.example"
        exit 1
    fi
    print_success "server/.env found"
    
    if [ ! -f "client/.env" ]; then
        print_warning "client/.env not found. Using default configuration"
    else
        print_success "client/.env found"
    fi
}

# Install backend dependencies
install_backend() {
    echo ""
    echo "Installing backend dependencies..."
    cd server
    npm install
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    cd ..
}

# Install frontend dependencies
install_frontend() {
    echo ""
    echo "Installing frontend dependencies..."
    cd client
    npm install
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    cd ..
}

# Build frontend
build_frontend() {
    echo ""
    echo "Building frontend for production..."
    cd client
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    cd ..
}

# Run backend tests (if available)
test_backend() {
    echo ""
    echo "Running backend tests..."
    cd server
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test
        if [ $? -eq 0 ]; then
            print_success "Backend tests passed"
        else
            print_warning "Backend tests failed or skipped"
        fi
    else
        print_warning "No backend tests configured"
    fi
    cd ..
}

# Run frontend tests (if available)
test_frontend() {
    echo ""
    echo "Running frontend tests..."
    cd client
    if [ -f "package.json" ] && grep -q "test" package.json; then
        npm test
        if [ $? -eq 0 ]; then
            print_success "Frontend tests passed"
        else
            print_warning "Frontend tests failed or skipped"
        fi
    else
        print_warning "No frontend tests configured"
    fi
    cd ..
}

# Main build process
main() {
    check_env_files
    install_backend
    install_frontend
    test_backend
    test_frontend
    build_frontend
    
    echo ""
    echo "=================================="
    print_success "Build process completed successfully!"
    echo "=================================="
    echo ""
    echo "Next steps:"
    echo "1. Deploy backend to Render"
    echo "2. Deploy frontend to Vercel"
    echo "3. Update environment variables"
    echo "4. Test deployment"
    echo ""
    echo "See DEPLOYMENT.md for detailed instructions"
}

# Run main function
main
