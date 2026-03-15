/**
 * Button Component Stories
 * Demonstrates all Button variants, sizes, and states
 */
import { type Meta, type StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    onClick: { action: 'clicked' },
    size: {
      control: 'select',
      description: 'Button size',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      description: 'Visual style variant',
      options: ['primary', 'secondary', 'text', 'danger', 'success'],
    },
  },
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Versatile button component with multiple variants, sizes, and states. Supports loading states, icons, and full-width layouts.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Atoms/Button',
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Text: Story = {
  args: {
    children: 'Text Button',
    variant: 'text',
  },
};

export const Success: Story = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <span style={{ marginRight: '8px' }}>→</span>
        Button with Icon
      </>
    ),
  },
};

export const AllVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for comparison.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="text">Text</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together for comparison.',
      },
    },
  },
  render: () => (
    <div
      style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};

export const AllStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All button states displayed together for comparison.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <Button>Normal</Button>
      <Button isLoading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};
