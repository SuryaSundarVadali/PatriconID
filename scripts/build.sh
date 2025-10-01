#!/bin/bash

# PatriconID P2P Build Script
# Builds the complete P2P decentralized identity verification system

set -e

echo "🚀 Building PatriconID P2P System..."
echo "====================================="

# Parse command line arguments
P2P_MODE=false
SKIP_TESTS=false
PRODUCTION=false

for arg in "$@"; do
    case $arg in
        --p2p)
            P2P_MODE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --p2p          Build P2P-specific components"
            echo "  --skip-tests   Skip running tests"
            echo "  --production   Build for production deployment"
            echo "  --help         Show this help message"
            exit 0
            ;;
    esac
done

# Helper functions
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
    echo "✅ $1 found"
}

# Check dependencies
echo "📋 Checking dependencies..."
check_dependency "nargo"
check_dependency "cargo"
check_dependency "npm"
check_dependency "forge"

# Build Noir circuits (P2P selective disclosure)
echo ""
echo "🔧 Building Noir circuits..."
cd circuits
nargo compile
if [ $? -eq 0 ]; then
    echo "✅ Circuits compiled successfully"
else
    echo "❌ Circuit compilation failed"
    exit 1
fi

# Generate verifier contracts for P2P proofs
if [ "$P2P_MODE" = true ]; then
    echo "🔐 Generating P2P verifier contracts..."
    # Generate verification key
    bb write_vk --bytecode target/p2p_selective_disclosure.json --output verification_key
    # Generate Solidity verifier
    bb contract --vk verification_key --output ../contracts/src/generated/
    echo "✅ P2P verifier contracts generated"
fi

cd ..

# Build Rust core library with P2P features
echo ""
echo "🦀 Building Rust core library..."
cd core
if [ "$P2P_MODE" = true ]; then
    echo "Building with P2P features..."
    cargo build --release --features="wasm,ffi,secure-storage,e2e-encryption,multi-chain"
    
    # Build WASM for web integration
    echo "🌐 Building WASM bindings..."
    wasm-pack build --target web --out-dir ../web/src/wasm --features="wasm,secure-storage,e2e-encryption"
    
    # Build mobile FFI
    echo "📱 Building mobile FFI..."
    cargo build --release --target aarch64-linux-android --features="ffi,secure-storage"
    cargo build --release --target aarch64-apple-ios --features="ffi,secure-storage"
else
    cargo build --release --features="wasm,ffi"
    wasm-pack build --target web --out-dir ../web/src/wasm
fi

if [ $? -eq 0 ]; then
    echo "✅ Rust core built successfully"
else
    echo "❌ Rust core build failed"
    exit 1
fi

cd ..

# Build TypeScript SDK
echo ""
echo "📦 Building TypeScript SDK..."
cd js
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ TypeScript SDK built successfully"
else
    echo "❌ TypeScript SDK build failed"
    exit 1
fi

cd ..

# Build React web application with P2P components
echo ""
echo "⚛️ Building React web application..."
cd web
npm install

if [ "$P2P_MODE" = true ]; then
    echo "Installing P2P-specific dependencies..."
    npm install qrcode.react lucide-react @types/webauthn
fi

if [ "$PRODUCTION" = true ]; then
    npm run build:production
else
    npm run build
fi

if [ $? -eq 0 ]; then
    echo "✅ Web application built successfully"
else
    echo "❌ Web application build failed"
    exit 1
fi

cd ..

# Build and test smart contracts
echo ""
echo "⛓️ Building smart contracts..."
cd contracts
forge install
forge build

if [ $? -eq 0 ]; then
    echo "✅ Smart contracts built successfully"
else
    echo "❌ Smart contract build failed"
    exit 1
fi

# Run tests unless skipped
if [ "$SKIP_TESTS" = false ]; then
    echo ""
    echo "🧪 Running tests..."
    
    # Test circuits
    echo "Testing Noir circuits..."
    cd ../circuits
    nargo test
    
    # Test Rust core
    echo "Testing Rust core..."
    cd ../core
    if [ "$P2P_MODE" = true ]; then
        cargo test --features="wasm,ffi,secure-storage,e2e-encryption"
    else
        cargo test --features="wasm,ffi"
    fi
    
    # Test TypeScript SDK
    echo "Testing TypeScript SDK..."
    cd ../js
    npm test
    
    # Test smart contracts
    echo "Testing smart contracts..."
    cd ../contracts
    forge test
    
    # Test web application
    echo "Testing web application..."
    cd ../web
    npm test
    
    echo "✅ All tests passed"
fi

cd ..

# Create deployment artifacts
echo ""
echo "📦 Creating deployment artifacts..."
mkdir -p dist

# Copy build outputs
cp -r web/dist dist/web
cp -r contracts/out dist/contracts
cp circuits/target/*.json dist/circuits/
cp core/target/wasm32-unknown-unknown/release/*.wasm dist/wasm/ 2>/dev/null || true

# Create P2P-specific package
if [ "$P2P_MODE" = true ]; then
    echo "📱 Creating P2P deployment package..."
    mkdir -p dist/p2p
    
    # Copy P2P components
    cp web/src/components/P2PProofGenerator.tsx dist/p2p/
    cp web/src/components/P2PProofVerifier.tsx dist/p2p/
    cp web/src/lib/p2p-proof-service.ts dist/p2p/
    cp contracts/src/P2PIdentityRegistry.sol dist/p2p/
    cp circuits/src/p2p_selective_disclosure.nr dist/p2p/
    cp core/src/p2p_service.rs dist/p2p/
    
    # Create P2P integration guide
    cp docs/P2P_IMPLEMENTATION_GUIDE.md dist/p2p/
    
    echo "✅ P2P package created in dist/p2p/"
fi

# Performance metrics
echo ""
echo "📊 Performance metrics:"
echo "Circuit constraints: $(jq '.num_opcodes' circuits/target/p2p_selective_disclosure.json 2>/dev/null || echo 'Unknown')"
echo "WASM bundle size: $(du -h core/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null | awk '{print $1}' || echo 'Unknown')"
echo "Web bundle size: $(du -h web/dist/*.js 2>/dev/null | head -1 | awk '{print $1}' || echo 'Unknown')"

# Generate build summary
echo ""
echo "📋 Build Summary"
echo "================"
echo "✅ Noir circuits compiled"
echo "✅ Rust core library built"
echo "✅ TypeScript SDK built"
echo "✅ React web app built"
echo "✅ Smart contracts built"

if [ "$P2P_MODE" = true ]; then
    echo "✅ P2P components integrated"
    echo "✅ WASM bindings generated"
    echo "✅ Mobile FFI libraries built"
fi

if [ "$SKIP_TESTS" = false ]; then
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 PatriconID P2P build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy contracts: cd contracts && forge script script/Deploy.s.sol --broadcast"
echo "2. Start web app: cd web && npm run dev"
echo "3. Test P2P flow: Open browser and test proof generation/verification"

if [ "$P2P_MODE" = true ]; then
    echo "4. P2P integration guide: dist/p2p/P2P_IMPLEMENTATION_GUIDE.md"
fi

echo ""
echo "🔗 P2P Native • 🔒 Privacy-First • ⚡ Client-Only • 🚀 Production-Ready"