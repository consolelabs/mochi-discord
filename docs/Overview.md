# Mochi Discord Bot - Overview

## Introduction

Mochi Discord Bot is a comprehensive cryptocurrency and DeFi management bot built with Node.js and TypeScript. It provides Discord communities with powerful financial tools, portfolio tracking, social features, and gaming elements, making it the primary interface for users to interact with the Mochi ecosystem directly from Discord.

## Core Architecture

### Project structure

.
├── assets
│   ├── fonts
│   └── images
├── docs
│   └── Overview.md
├── examples
│   ├── new-command.md
│   ├── select-menu.md
│   └── unit-test.md
├── scripts
│   ├── destroy-global-commands.js
│   ├── generate-types.js
│   ├── leave-server-ids.json
│   ├── leave-server.js
│   └── sync-commands.js
├── src
│   ├── adapters
│   ├── cache
│   ├── commands
│   ├── errors
│   ├── handlers
│   ├── listeners
│   ├── logger
│   ├── queue
│   ├── types
│   ├── ui
│   ├── utils
│   ├── api.ts
│   ├── env.ts
│   ├── index.ts
│   └── sentry.ts
├── tests
│   ├── assertions
│   └── mocks
├── venv
│   ├── bin
│   ├── include
│   ├── lib
│   └── pyvenv.cfg
├── CHANGELOG.md
├── CONTRIBUTING.md
├── dbconfig.yml
├── docker-compose.yml
├── Dockerfile
├── jest.config.js
├── lefthook.yml
├── LICENSE
├── makefile
├── package.json
├── pnpm-lock.yaml
├── producer.sh
├── README.md
├── tsconfig.json
├── vite.config.js
└── yarn-error.log

26 directories, 30 files


### Technology Stack
- **Runtime**: Node.js 18.x
- **Language**: TypeScript 4.4+
- **Discord Library**: discord.js v13
- **Build System**: Vite with vite-node for development
- **Testing**: Jest with TypeScript support
- **Package Manager**: pnpm
- **Monitoring**: Sentry for error tracking

### Key Dependencies
- **API Integration**: Custom REST clients for Mochi APIs
- **Blockchain**: Solana Web3.js, Ethers.js for multi-chain support
- **Data Visualization**: Chart.js with Canvas for rendering
- **Caching**: ioredis for Redis integration, node-cache for in-memory caching
- **Message Queue**: KafkaJS for event streaming
- **Feature Management**: Unleash for feature toggles

## Bot Architecture

### Command System
The bot uses a hybrid approach supporting both:
- **Slash Commands** (Primary): Modern Discord interactions
- **Text Commands** (Legacy): Traditional prefix-based commands

### Core Components

#### Commands (`src/commands/`)
Organized by functional domains with 50+ command categories:

**Financial Commands**:
- **balance/balances** - Portfolio and wallet balance tracking
- **deposit** - Generate deposit addresses for various chains
- **withdraw** - Process cryptocurrency withdrawals
- **tip/send** - Peer-to-peer token transfers
- **pay** - Payment request and processing
- **swap** - Token exchange functionality
- **convert** - Currency conversion utilities

**Investment & Trading**:
- **vault** - Investment vault management
- **invest** - Investment tracking and management
- **earn** - Yield farming and staking opportunities
- **watchlist** - Token price monitoring
- **alert** - Price alert management

**Portfolio Management**:
- **profile** - User profile and statistics
- **transaction** - Transaction history and details
- **wallet** - Wallet management and linking
- **activity** - Account activity tracking

**Market Data**:
- **ticker** - Real-time token prices
- **token** - Token information and analytics
- **top** - Trending tokens and leaderboards
- **gainer/loser** - Market movers
- **heatmap** - Market visualization

**NFT Features**:
- **nft** - NFT portfolio and management
- **sales** - NFT sales tracking

**Community Features**:
- **gm** - Daily greeting system with streaks
- **quest** - Community challenges and rewards
- **sendxp** - Experience point distribution
- **role/roles** - Automated role management
- **tagme** - User tagging and notifications

**Utility Commands**:
- **gas** - Network gas price tracking
- **info** - General information and help
- **config** - Server configuration
- **setup** - Bot setup and onboarding

#### Event Handlers (`src/listeners/`)
- **Message Events**: Command processing and auto-responses
- **Reaction Events**: Reaction-based interactions
- **Guild Events**: Server join/leave handling
- **User Events**: Member updates and role management
- **Interaction Events**: Button, select menu, and modal handling

#### API Adapters (`src/adapters/`)
- **Mochi API**: Main backend service integration
- **Indexer API**: Blockchain data and analytics
- **Pod Town API**: Character integration features
- **Config Management**: Dynamic configuration handling

#### UI Components (`src/ui/`)
- **Discord Embeds**: Rich message formatting
- **Buttons & Interactions**: Interactive message components
- **Select Menus**: Dropdown selection interfaces
- **Modals**: Form-based user input

## Key Features

### Comprehensive DeFi Integration
- **Multi-Chain Support**: Ethereum, Solana, TON, and other major networks
- **DEX Integration**: Direct trading capabilities
- **Yield Farming**: Automated strategy management
- **Portfolio Analytics**: Performance tracking and insights

### Social Finance Features
- **Tip Economy**: Community reward distribution
- **Leaderboards**: Competitive elements for engagement
- **Social Trading**: Share strategies and follow successful traders
- **Community Vaults**: Group investment mechanisms

### Advanced Portfolio Management
- **Real-Time Tracking**: Live portfolio updates
- **Price Alerts**: Custom notification system
- **Transaction History**: Comprehensive activity logs
- **Multi-Wallet Support**: Track across multiple addresses

### Gaming Elements
- **Daily GM System**: Streak-based engagement rewards
- **Quest System**: Challenges with token rewards
- **XP Distribution**: Community contribution tracking
- **Achievement System**: Milestone recognition

### Enterprise Features
- **Server Configuration**: Per-guild customization
- **Role Automation**: Token-gated access control
- **Analytics Dashboard**: Community insights
- **Moderation Tools**: Admin command suite

## Command Categories

### Core Financial Commands (30+ commands)
- Balance tracking and portfolio management
- Multi-chain deposit and withdrawal
- P2P transfers and payment requests
- Token swaps and conversions

### Investment Tools (15+ commands)
- Vault creation and management
- Investment tracking and analysis
- Yield farming optimization
- Risk management tools

### Market Intelligence (20+ commands)
- Real-time price feeds
- Market trend analysis
- Token research and analytics
- Alert and notification system

### Community Engagement (10+ commands)
- Social interaction features
- Reward distribution systems
- Community challenges
- Reputation management

### Administrative Tools (5+ commands)
- Bot configuration and setup
- User and role management
- Server analytics and reporting
- Moderation capabilities

## API Integration

### Primary APIs
- **Mochi API** (`API_SERVER_HOST`): Core backend services
- **Indexer API** (`INDEXER_API_SERVER_HOST`): Blockchain data and analytics
- **Pod Town API** (`PT_API_SERVER_HOST`): Character and metaverse integration

### External Services
- **Twitter API**: Social media integration and monitoring
- **Unleash**: Feature flag management
- **Sentry**: Error tracking and monitoring
- **Firebase**: Additional data storage (for specific features)

## Configuration

### Environment Variables
- **Discord Configuration**: Bot token, application ID
- **API Endpoints**: Backend service URLs
- **Guild Settings**: Server-specific configurations
- **Feature Flags**: Experimental command access
- **Integration Keys**: External service authentication

### Server Setup
1. Invite bot with appropriate permissions
2. Configure channels for logs and alerts
3. Set up role hierarchies for access control
4. Enable desired features through configuration commands

## Development Workflow

### Development Environment
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Format code
pnpm format

# Sync slash commands
pnpm cmd:sync
```

### Command Development
1. Create command directory in `src/commands/`
2. Implement slash and text command handlers
3. Add proper error handling and validation
4. Include comprehensive help documentation
5. Add unit and integration tests

### Feature Toggles
- Experimental commands can be enabled per-server
- Feature flags control rollout of new functionality
- A/B testing capabilities for user experience optimization

## User Experience

### Command Discovery
- Comprehensive help system with `/help`
- Auto-suggestions and command completion
- Error messages with suggested corrections
- Interactive tutorials for new users

### Response Formatting
- Rich embeds with consistent branding
- Interactive buttons for common actions
- Progress indicators for long-running operations
- Contextual help and documentation links

### Error Handling
- Graceful error recovery
- User-friendly error messages
- Automatic retry mechanisms
- Fallback options for failed operations

## Monitoring and Analytics

### Logging System
- Structured logging with pino
- Request/response tracking
- Performance metrics collection
- Error tracking with full context

### Health Monitoring
- Bot uptime and availability tracking
- Command success/failure rates
- API response time monitoring
- Resource usage analytics

### User Analytics
- Command usage patterns
- Feature adoption metrics
- Community engagement levels
- Performance optimization insights

## Security

### Access Control
- Role-based command restrictions
- Server-specific permission management
- Rate limiting and abuse prevention
- Input validation and sanitization

### Data Protection
- Secure API key management
- User privacy protection
- Audit logging for sensitive operations
- Compliance with Discord's terms of service

## Recent Developments

Based on the codebase structure and version (6.28.1), recent focus areas include:
- Enhanced vault management features
- Improved NFT integration
- Advanced portfolio analytics
- Community engagement tools
- Performance optimizations

## Getting Started

### For Users
1. Invite Mochi bot to your Discord server
2. Use `/setup` to configure basic settings
3. Link your wallet with `/wallet`
4. Explore features with `/help`

### For Developers
1. Set up development environment
2. Configure API access and Discord bot token
3. Run local development server
4. Test commands in development guild
5. Follow contribution guidelines

This bot serves as the primary user interface for the Mochi ecosystem, combining powerful DeFi functionality with engaging social features to create a comprehensive Discord-based financial management experience. 