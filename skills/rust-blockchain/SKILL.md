---
name: rust-blockchain
description: Comprehensive guide for building sophisticated blockchain applications using Rust. Covers Substrate framework, Solana development with Anchor, smart contract patterns, security best practices, testing strategies, and production-grade system architecture. Use when building blockchain infrastructure, smart contracts, pallets, Solana programs, implementing consensus mechanisms, designing token economies, or architecting decentralized applications.
source: https://github.com/yinkscss/skills/tree/main/skills/rust-blockchain
license: MIT
---

# Rust Blockchain Development

Comprehensive skill for building production-grade blockchain applications with Rust, covering multiple frameworks, security patterns, and architectural best practices.

## Quick Start

### Project Type Selection

**Substrate (Polkadot Ecosystem)**
- Building custom blockchains or parachains
- Need forkless runtime upgrades
- Require modular, composable architecture

**Solana (High-Performance)**
- Need 50,000+ TPS throughput
- Building DeFi protocols or NFT platforms
- Require sub-second finality
- Cost-sensitive applications ($0.00025/tx)

**NEAR Protocol**
- WebAssembly-based smart contracts
- Focus on developer experience

**CosmWasm (Cosmos Ecosystem)**
- Inter-blockchain communication (IBC)
- Multi-chain smart contracts

## Development Workflow

### 1. Environment Setup

```bash
# Install Rust and tooling
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
```

### 2. Project Initialization

**Substrate Project:**
```bash
git clone https://github.com/substrate-developer-hub/substrate-node-template
cd substrate-node-template
cargo build --release
./target/release/node-template --dev
```

**Solana/Anchor Project:**
```bash
anchor init my-project
cd my-project
solana-test-validator
anchor build && anchor deploy && anchor test
```

### 3. Development Process

#### A. Design Phase
- Define state structures and storage layout
- Design instruction/extrinsic interfaces
- Plan error handling and events
- Consider security implications upfront

#### B. Implementation Phase
- Write core business logic
- Implement state transitions
- Add comprehensive error handling
- Follow security best practices from the start

#### C. Testing Phase
- Write unit tests for all functions
- Create integration tests for workflows
- Perform property-based testing
- Run security audits

#### D. Optimization Phase
- Profile and optimize hot paths
- Minimize storage usage
- Optimize transaction weights/fees

### 4. Security Review

```rust
// Security Checklist:
// ✅ All inputs validated
// ✅ Checked arithmetic everywhere
// ✅ No reentrancy vulnerabilities
// ✅ Access control properly enforced
// ✅ No unbounded loops or storage
// ✅ Events emitted for critical operations
// ✅ Error handling comprehensive
// ✅ Tests cover edge cases and attack vectors
```

```bash
cargo audit              # Check for vulnerable dependencies
cargo clippy -- -D warnings  # Strict linting
cargo test --all-features    # All tests pass
```

### 5. Deployment

**Development → Testnet → Mainnet**

1. **Development network**: Test all functionality locally
2. **Testnet**: Deploy to public testnet, monitor for 1-2 weeks
3. **Mainnet**: Gradual rollout with monitoring

## Core Capabilities

### 1. Substrate Pallet Development

Build modular blockchain components (pallets) for Substrate-based chains.

**Key features:**
- Custom storage structures with bounded collections
- Dispatchable functions (extrinsics)
- Events and errors
- Runtime configuration
- Hooks (on_initialize, on_finalize, offchain_worker)
- Benchmarking for transaction weights

### 2. Solana Program Development

Build high-performance programs for Solana using native Rust or Anchor framework.

**Key features:**
- Account-based architecture
- Program Derived Addresses (PDAs)
- Cross-Program Invocation (CPI)
- Anchor framework abstractions
- SPL token integration

### 3. Smart Contract Security

**Critical security patterns:**
- Input validation and sanitization
- Checked arithmetic to prevent overflow
- Access control and authorization
- Reentrancy protection (checks-effects-interactions)
- Rate limiting and circuit breakers
- Pull payment over push

### 4. Testing & Quality Assurance

**Testing levels:**
- **Unit tests**: Function-level correctness
- **Integration tests**: Cross-module interactions
- **Property-based tests**: Invariant checking with proptest
- **Fuzzing**: Random input testing
- **Load tests**: Performance under stress
- **Security tests**: Vulnerability scanning

### 5. System Architecture

**Architecture patterns:**
- Layered architecture (Application, Business Logic, Data)
- Event-driven microservices
- State management and versioning
- P2P networking with libp2p
- Sharding and Layer 2 solutions
- Cross-chain bridges

## Common Development Tasks

### Creating a Custom Token

**Substrate:**
```rust
// Implement using Balances pallet or create custom token pallet
// Use FRAME's pallet_balances as a reference
```

**Solana:**
```rust
// Use SPL Token or create custom token with Anchor
use anchor_spl::token::{self, Token, TokenAccount, Mint};
```

### Implementing Governance

- Proposal submission and voting
- Timelock for proposal execution
- Quorum requirements
- Vote delegation

### Building a DEX/AMM

- Liquidity pool management
- Swap functionality with slippage protection
- Fee collection and distribution
- Price oracle integration

## Best Practices

### Code Organization

```
my-blockchain-project/
├── pallets/              // Substrate pallets
│   ├── profiles/
│   ├── governance/
│   └── tokens/
├── programs/             // Solana programs
│   ├── marketplace/
│   └── staking/
├── runtime/              // Substrate runtime
├── tests/               // Integration tests
└── scripts/             // Deployment scripts
```

### Performance Optimization

- Use bounded collections (BoundedVec, BoundedBTreeMap)
- Minimize storage reads/writes
- Batch operations when possible
- Profile and benchmark critical paths
- Use zero-copy for large accounts (Solana)

### Documentation

Document thoroughly:
- Public API documentation
- Security considerations
- Deployment procedures
- Upgrade mechanisms
- Emergency procedures

## Troubleshooting

### Common Issues

**Build failures:**
- Check Rust toolchain version
- Ensure WASM target installed
- Verify dependency versions

**Transaction failures:**
- Verify account has sufficient balance
- Check transaction weight/gas limits
- Validate input parameters

## Additional Resources

- [Rust Documentation](https://doc.rust-lang.org/stable/)
- [Substrate Developer Hub](https://substrate.io/developers/)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
