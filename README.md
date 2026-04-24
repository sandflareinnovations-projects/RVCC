# RVCC Monorepo - Industrial Standard Construction Portal

This is the primary repository for the RVCC Construction Company web infrastructure. It is built as a high-performance monorepo using **pnpm workspaces**, **Turborepo**, and **Next.js**.

## 🏗 Project Structure

- `apps/web`: The main Next.js 15+ application (Sanity CMS integrated).
- `packages/eslint-config`: Shared, modular ESLint configurations (The industrial standard for monorepos).
- `packages/ui`: Shared React component library.
- `.husky/`: Git hooks for automated quality enforcement.

## 💎 Industrial Quality Standards

We maintain a "Zero-Technical-Debt" policy through automated enforcement:

### 1. Unified Linting

We use a **Shared Config Package** strategy. Standards are defined once in `packages/eslint-config` and extended by all applications. This ensures absolute consistency in code quality across the entire workspace.

### 2. Automated Code Organization

We use **Prettier** with advanced plugins to automatically handle:

- **Tailwind Class Sorting**: Keeps utility classes organized and readable.
- **Import Sorting**: Automatically categorizes and orders imports (Standard -> Workspace -> Relative).
- **Formatting**: Strict 2-space indentation and 100-character line limits.

### 3. Pre-Commit Hooks (Husky + lint-staged)

You cannot commit "dirty" code. Every commit triggers a validation pipeline that:

- Fixes linting errors automatically.
- Re-organizes and formats code.
- Ensures environment variables are correctly declared.

## 🛠 Development Workflow

### 1. Installation

```bash
pnpm install
```

### 2. Development

Run all apps and packages in parallel with hot-reloading:

```bash
pnpm dev
```

### 3. Quality Check

Run linting across the entire monorepo:

```bash
pnpm lint
```

### 4. Code Formatting

Manually trigger the organization pass:

```bash
pnpm format
```

---

&copy; 2026 RVCC Construction Company. Built for Excellence.
