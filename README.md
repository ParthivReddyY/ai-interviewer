# AI Interviewer - shadcn/ui Component Showcase

This is a Next.js project showcasing all the latest shadcn/ui components. The project includes a comprehensive component library with the latest updates from shadcn/ui.

## 🚀 Features

- **Complete shadcn/ui Integration**: All essential components installed and configured
- **Interactive Component Showcase**: Live examples of every component in action
- **Latest Updates**: Using the most recent versions of shadcn/ui components
- **TypeScript Ready**: Full TypeScript support for all components
- **Dark Mode Support**: Built-in theme switching capabilities
- **Responsive Design**: Mobile-first responsive layout

## 📦 Installed shadcn/ui Components

The following components are installed and showcased:

### Form Components
- **Button** - Various button styles and sizes
- **Input** - Text input fields
- **Textarea** - Multi-line text input
- **Label** - Form labels
- **Checkbox** - Checkbox input
- **Switch** - Toggle switch
- **Select** - Dropdown selection
- **Form** - Form handling utilities

### Layout Components
- **Card** - Content containers
- **Separator** - Visual dividers
- **Aspect Ratio** - Maintain aspect ratios
- **Scroll Area** - Custom scrollable areas
- **Resizable** - Resizable panels
- **Sidebar** - Navigation sidebar

### Navigation Components
- **Tabs** - Tabbed interfaces
- **Accordion** - Collapsible content
- **Breadcrumb** - Navigation breadcrumbs
- **Navigation Menu** - Complex navigation
- **Menubar** - Menu bar component

### Display Components
- **Avatar** - User profile images
- **Badge** - Status indicators
- **Progress** - Progress bars
- **Skeleton** - Loading placeholders
- **Table** - Data tables
- **Calendar** - Date picker

### Interactive Components
- **Dialog** - Modal dialogs
- **Alert Dialog** - Confirmation dialogs
- **Dropdown Menu** - Context menus
- **Popover** - Floating content
- **Hover Card** - Hover information
- **Tooltip** - Contextual hints
- **Command** - Command palette
- **Context Menu** - Right-click menus
- **Sheet** - Slide-out panels
- **Drawer** - Mobile-friendly drawers

### Feedback Components
- **Alert** - Important messages
- **Sonner** - Modern toast notifications

### Media Components
- **Carousel** - Image/content carousel
- **Chart** - Data visualization

### Control Components
- **Toggle** - Toggle buttons
- **Toggle Group** - Toggle button groups
- **Collapsible** - Collapsible sections
- **Input OTP** - One-time password input

## 🛠️ Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Customization

The project is configured with:
- **Style**: New York style (modern and clean)
- **Base Color**: Zinc color palette
- **CSS Variables**: Enabled for easy theming
- **Icon Library**: Lucide React icons
- **TypeScript**: Full TypeScript support

You can customize the configuration by editing `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

## 📱 Adding New Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

## 🌙 Theme Support

The project includes built-in dark mode support. The theme system uses CSS variables for easy customization. You can modify the theme colors in `src/app/globals.css`.

## 📚 Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev)

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
