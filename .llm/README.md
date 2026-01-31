# .llm - AI/LLM Context Directory

This directory contains context files for AI-assisted development tools (Cursor, GitHub Copilot, Claude, etc.).

## Purpose

These files help AI coding assistants understand Aurora App's:
- Product requirements and user stories
- Technical architecture decisions
- Brand identity and design guidelines
- Development patterns and conventions

## Structure

```
.llm/
├── specs/              # Feature specifications
│   ├── aurora-app/     # Core platform specs
│   ├── aurora-ai-search-engine/  # Search features
│   ├── aurora-community-truth/   # Debates/voting
│   └── ...
├── steering/           # AI behavior guidelines
│   ├── aurora-brand-identity.md  # Colors, tone, UX
│   ├── safety-first.md           # Safety principles
│   ├── mobile-first.md           # Mobile guidelines
│   └── technical-architecture.md # Code patterns
├── hooks/              # Automation triggers
└── mcp/                # Model Context Protocol servers
```

## Specs Directory

Each spec follows the structure:
- `requirements.md` - User stories with acceptance criteria
- `design.md` - Technical architecture and decisions
- `tasks.md` - Implementation checklist

## Steering Directory

These files are injected into AI context to ensure:
- Consistent code style
- Brand-compliant UI generation
- Safety-first feature development
- Mobile-responsive components

## Usage with AI Tools

### Cursor/Claude
Reference steering docs in prompts:
```
Following the guidelines in .llm/steering/safety-first.md,
implement the panic button component...
```

### GitHub Copilot
Steering docs are automatically indexed when repository is analyzed.

## Maintenance

- Update specs when requirements change
- Keep steering docs current with design system
- Archive outdated specs rather than deleting

---

*These files improve AI code generation quality for Aurora App development.*
