/**
 * Input Component Stories
 * Demonstrates all Input variants, types, and states
 */
import { type Meta, type StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input';

const meta = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    label: {
      control: 'text',
      description: 'Input label text',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    type: {
      control: 'select',
      description: 'HTML input type',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
    },
  },
  component: Input,
  parameters: {
    docs: {
      description: {
        component: 'Flexible input component with label, error state, and various input types.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Atoms/Input',
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    value: 'johndoe',
  },
};

export const WithError: Story = {
  args: {
    error: 'Password must be at least 8 characters',
    label: 'Password',
    placeholder: 'Enter password',
    type: 'password',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Account ID',
    value: '1234567890',
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Amount',
    placeholder: '0.00',
    type: 'number',
  },
};

export const SearchInput: Story = {
  args: {
    placeholder: 'Search transactions...',
    type: 'search',
  },
};

export const PasswordInput: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
  },
};

const InteractiveInput = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.length > 0 && newValue.length < 3) {
      setError('Must be at least 3 characters');
    } else {
      setError('');
    }
  };

  return (
    <div style={{ width: '300px' }}>
      <Input
        label="Username"
        value={value}
        onChange={handleChange}
        error={error}
        placeholder="Enter username (min 3 chars)"
      />
      <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Length: {value.length}</p>
    </div>
  );
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive input with validation that updates as you type.',
      },
    },
  },
  render: () => <InteractiveInput />,
};

export const AllTypes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'All input types displayed together.',
      },
    },
    layout: 'padded',
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <Input label="Text" type="text" placeholder="Text input" />
      <Input label="Email" type="email" placeholder="email@example.com" />
      <Input label="Password" type="password" placeholder="Enter password" />
      <Input label="Number" type="number" placeholder="123" />
      <Input label="Search" type="search" placeholder="Search..." />
      <Input label="Phone" type="tel" placeholder="+1 (555) 123-4567" />
      <Input label="URL" type="url" placeholder="https://example.com" />
    </div>
  ),
};
