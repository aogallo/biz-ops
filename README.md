# Multi tenancy SaaS Business to Business

A modern, production-ready template for building full-stack React applications using React Router.

## 🚀 Features

- ⚡ **Vite** - Lightning fast build tool with HMR
- ⚛️ **React 19** - Latest React features with improved performance
- 🎨 **shadcn/ui** - Beautiful, accessible component library built on Radix UI
- 🎭 **Tailwind CSS v4** - Latest Tailwind with modern styling capabilities
- 🔷 **TypeScript** - Full type safety and enhanced developer experience
- 🧭 **React Router v7** - Modern routing with Data Router API
- 🌓 **Theme System** - Light/Dark/System mode with persistence
- ✨ **ESLint & Prettier** - Code quality and consistent formatting
- 🧪 **Vitest & Testing Library** - Fast unit testing with modern tools
- 🪝 **Husky & lint-staged** - Pre-commit hooks for code quality

## 📦 Tech Stack

## 🏗️ Project Structure

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd bizops-web
```

2. Install dependencies

```bash
npm install
```

3. Start development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests in watch mode
- `npm run coverage` - Run tests with coverage report
- `npm prepare` - Setup Husky hooks (runs automatically after install)

## 🔧 Path Aliases

The project uses a single path alias for cleaner imports:

- `@/` - Points to the `src/` directory

### Usage

```tsx
// Instead of relative imports
import { Button } from "../../../components/ui/button";
import { useTheme } from "../../components/theme-provider";

// Use path alias
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
```

### Configuration Files

Path aliases are configured in:

- `tsconfig.json` & `tsconfig.app.json` - TypeScript resolution
- `vite.config.ts` - Vite bundler resolution
- `eslint.config.js` - ESLint import resolution
- `components.json` - shadcn/ui component installation

## 🎨 shadcn/ui Components

This project uses [shadcn/ui](https://ui.shadcn.com/) - a collection of beautifully designed, accessible components built with Radix UI and Tailwind CSS.

### Configuration

The `components.json` file contains the shadcn/ui configuration:

- **Style**: New York
- **Base Color**: Slate
- **CSS Variables**: Enabled
- **Icon Library**: Lucide React

### Adding New Components

Use the shadcn/ui CLI to add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Components will be installed to `src/components/ui/` and can be customized as needed.

### Installed Components

Currently installed shadcn/ui components:

- `button` - Versatile button component
- `dropdown-menu` - Dropdown menu with Radix UI
- `sheet` - Slide-out panel/drawer component

## 🌓 Theme System

The app includes a comprehensive theme system with light, dark, and system modes.

### Theme Provider

The theme system is powered by a custom `ThemeProvider` that:

- Persists theme preference to localStorage
- Supports system theme detection
- Provides a React context for theme access

```tsx
// src/AllProviders.tsx
import { ThemeProvider } from "@/components/theme-provider";
<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
  {children}
</ThemeProvider>;
```

### Using the Theme Hook

```tsx
import { useTheme } from "@/components/theme-provider";

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Dark Mode</button>
      <button onClick={() => setTheme("light")}>Light Mode</button>
      <button onClick={() => setTheme("system")}>System</button>
    </div>
  );
}
```

### Theme Toggle Component

The `ModeToggle` component provides a dropdown menu for theme switching:

```tsx
import { ModeToggle } from "@/components/mode-toggle";

// Use anywhere in your app
<ModeToggle />;
```

### Tailwind CSS v4 Theme Configuration

Theme colors and variables are defined in `src/index.css` using CSS custom properties with OKLCH color space for better color consistency.

## 🧭 React Router v7

The app uses React Router v7 with the Data Router API for modern routing patterns.

### Current Routes

### Adding New Routes

### Layout Component

## 📝 Code Quality

### ESLint

The project uses ESLint 9 with flat config format (`eslint.config.js`):

- TypeScript rules via `@typescript-eslint`
- React hooks rules
- React refresh rules
- Import plugin for path resolution
- TanStack Query rules
- Prettier integration

```bash
npm run lint    # Check for issues
```

### Prettier

Prettier is integrated with ESLint for code formatting. Files are automatically formatted on save if your editor is configured, or via pre-commit hooks.

### Husky & lint-staged

Pre-commit hooks are set up with Husky to:

- Run ESLint on staged files
- Format code with Prettier
- Ensure code quality before commits

Configuration is managed through `package.json` (lint-staged) and `.husky/` directory.

## 📄 Pages Overview

## 🛠️ Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Your Changes

- Follow TypeScript best practices
- Use existing components from shadcn/ui when possible
- Maintain consistent code style
- Add tests for new features

### 3. Commit Your Changes

Pre-commit hooks will automatically:

- Lint your code
- Format with Prettier
- Prevent commits with errors

```bash
git add .
git commit -m "feat: add new feature"
```

### 4. Push and Create Pull Request

```bash
git push origin feature/my-feature
```

## 🎯 Best Practices

### Component Organization

- Keep components small and focused
- Use TypeScript interfaces for props
- Export named functions for better debugging
- Utilize shadcn/ui components as building blocks

### Styling

- Use Tailwind utility classes
- Leverage CSS variables from theme
- Use `cn()` helper for conditional classes
- Follow shadcn/ui patterns for consistency

### State Management

- Use React hooks (useState, useReducer) for UI state
- Context for global UI state (theme, auth)

### Type Safety

- Define interfaces for all data structures
- Use proper TypeScript types (avoid `any`)
- Leverage type inference when possible

## 📚 Additional Resources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router v7 Documentation](https://reactrouter.com/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please ensure all tests pass and code quality checks are satisfied before submitting a pull request.

## Note:

I remove this `"postinstall": "npm run cf-typegen"` command to deploy the app to vercel
