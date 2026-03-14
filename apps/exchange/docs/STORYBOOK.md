# Storybook Documentation

## Overview

This project uses [Storybook](https://storybook.js.org/) for component development, documentation, and testing. Storybook provides an isolated environment to build and test UI components independently from the main application.

## Quick Start

### Run Storybook

```bash
npm run storybook
```

This will start Storybook on [http://localhost:6006](http://localhost:6006).

### Build Static Storybook

```bash
npm run build-storybook
```

Generates a static website in `storybook-static/` that can be deployed.

## Project Structure

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx        # Button component stories
│   │   ├── Input.tsx
│   │   ├── Input.stories.tsx         # Input component stories
│   │   └── ...
│   ├── molecules/
│   │   └── ...
│   └── organisms/
│       ├── WalletCard.tsx
│       ├── WalletCard.stories.tsx    # WalletCard component stories
│       └── ...
└── .storybook/
    ├── main.ts                        # Storybook configuration
    └── preview.ts                     # Global decorators and parameters
```

## Writing Stories

### Basic Story Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'Category/MyComponent',  // Location in sidebar
  component: MyComponent,
  parameters: {
    layout: 'centered',           // Layout mode
  },
  tags: ['autodocs'],             // Auto-generate docs
  argTypes: {
    // Control types for interactive props
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story
export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

// Story with custom render
export const CustomRender: Story = {
  render: () => <MyComponent>Custom Content</MyComponent>,
};
```

### Story Categories

Stories are organized by atomic design principles:

- **Atoms**: Basic building blocks (Button, Input, Icon, etc.)
- **Molecules**: Simple component groups (FormField, SearchBar, etc.)
- **Organisms**: Complex components (WalletCard, TransactionList, etc.)
- **Templates**: Page layouts
- **Pages**: Full page compositions

### Control Types

Storybook provides interactive controls for props:

```typescript
argTypes: {
  // Text input
  label: { control: 'text' },
  
  // Number input
  age: { control: 'number' },
  
  // Boolean toggle
  disabled: { control: 'boolean' },
  
  // Select dropdown
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'outline'],
  },
  
  // Radio buttons
  size: {
    control: 'radio',
    options: ['small', 'medium', 'large'],
  },
  
  // Color picker
  backgroundColor: { control: 'color' },
  
  // Date picker
  createdAt: { control: 'date' },
  
  // Range slider
  opacity: {
    control: { type: 'range', min: 0, max: 1, step: 0.1 },
  },
  
  // Action logger (for callbacks)
  onClick: { action: 'clicked' },
}
```

## Best Practices

### 1. **Create Multiple Variants**

Show all possible states:

```typescript
export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};
```

### 2. **Use Descriptive Names**

```typescript
// ✅ Good
export const WithErrorMessage: Story = { ... };
export const LoadingState: Story = { ... };

// ❌ Avoid
export const Story1: Story = { ... };
export const Test: Story = { ... };
```

### 3. **Add Documentation**

```typescript
const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component supporting multiple variants and sizes.',
      },
    },
  },
} satisfies Meta<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary' },
  parameters: {
    docs: {
      description: {
        story: 'The primary button used for main actions.',
      },
    },
  },
};
```

### 4. **Group Related Stories**

```typescript
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};
```

### 5. **Use Args for Interactive Controls**

Prefer `args` over hardcoded props for better interactivity:

```typescript
// ✅ Interactive (can change in Controls panel)
export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
  },
};

// ❌ Static (cannot change in Controls panel)
export const Default: Story = {
  render: () => <Input label="Username" placeholder="Enter username" />,
};
```

## Advanced Features

### Decorators

Wrap stories with common layout or context:

```typescript
// Global decorator (.storybook/preview.ts)
export const decorators = [
  (Story) => (
    <ThemeProvider theme={lightTheme}>
      <Story />
    </ThemeProvider>
  ),
];

// Component-specific decorator
const meta = {
  title: 'Organisms/WalletCard',
  component: WalletCard,
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', background: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WalletCard>;
```

### Parameters

Configure story behavior:

```typescript
export const Centered: Story = {
  parameters: {
    layout: 'centered',     // Center in viewport
    viewport: {
      defaultViewport: 'mobile1',  // Mobile viewport
    },
    backgrounds: {
      default: 'dark',      // Dark background
    },
  },
};
```

### Actions

Log user interactions:

```typescript
const meta = {
  argTypes: {
    onClick: { action: 'clicked' },
    onSubmit: { action: 'submitted' },
  },
} satisfies Meta<typeof MyComponent>;
```

### Play Functions

Automate interactions for testing:

```typescript
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const ClickButton: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    await expect(button).toHaveTextContent('Clicked!');
  },
};
```

## Accessibility Testing

Storybook includes built-in a11y addon:

1. Run story
2. Open "Accessibility" panel
3. Review violations and recommendations

Fix issues to ensure WCAG compliance.

## Visual Regression Testing

### With Chromatic

```bash
# Install Chromatic
npm install --save-dev chromatic

# Run visual tests
npx chromatic --project-token=<your-token>
```

### With Percy

```bash
# Install Percy
npm install --save-dev @percy/storybook

# Build Storybook
npm run build-storybook

# Run visual tests
npx percy storybook ./storybook-static
```

## Component Testing

### Interaction Tests

```typescript
import { userEvent, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Type in input
    const input = canvas.getByLabelText('Username');
    await userEvent.type(input, 'testuser');
    
    // Click button
    const button = canvas.getByRole('button', { name: 'Submit' });
    await userEvent.click(button);
    
    // Assert result
    await expect(canvas.getByText('Success!')).toBeInTheDocument();
  },
};
```

## Deployment

### Deploy to Chromatic

```bash
npm run build-storybook
npx chromatic --project-token=<token>
```

### Deploy to Netlify/Vercel

1. Build static Storybook:
   ```bash
   npm run build-storybook
   ```

2. Deploy `storybook-static/` directory

3. Set up continuous deployment with GitHub Actions:

```yaml
# .github/workflows/storybook.yml
name: Build and Deploy Storybook

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build-storybook
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./storybook-static
```

## Troubleshooting

### Storybook Won't Start

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart Storybook
npm run storybook
```

### Stories Not Appearing

Check that:
1. File ends with `.stories.tsx` or `.stories.ts`
2. Default export exists
3. At least one named export (story) exists

### TypeScript Errors

Ensure `@storybook/react` types are installed:

```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
```

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Storybook Best Practices](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Component Story Format (CSF)](https://storybook.js.org/docs/react/api/csf)
- [Storybook Addons](https://storybook.js.org/addons)

## Examples

See the following stories for examples:

- `src/components/atoms/Button.stories.tsx` - Basic button variants
- `src/components/atoms/Input.stories.tsx` - Form input with validation
- `src/components/atoms/Card.stories.tsx` - Card layouts
- `src/components/organisms/WalletCard.stories.tsx` - Complex wallet component

## Next Steps

1. **Create Stories**: Add `.stories.tsx` files for all components
2. **Document Components**: Add descriptions and usage examples
3. **Test Interactions**: Add play functions for common user flows
4. **Deploy**: Set up continuous deployment for Storybook
5. **Visual Testing**: Integrate Chromatic or Percy for regression tests
