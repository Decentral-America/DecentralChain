/**
 * Input Component Stories
 * Demonstrates all Input variants, types, and states
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { useState } from 'react';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Flexible input component with label, error state, and various input types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Input label text',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'HTML input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Username',
    value: 'johndoe',
    placeholder: 'Enter username',
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    error: 'Password must be at least 8 characters',
    placeholder: 'Enter password',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Account ID',
    value: '1234567890',
    disabled: true,
  },
};

export const NumberInput: Story = {
  args: {
    label: 'Amount',
    type: 'number',
    placeholder: '0.00',
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: 'Search transactions...',
  },
};

export const PasswordInput: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Interactive: Story = {
  render: () => {
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
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Length: {value.length}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive input with validation that updates as you type.',
      },
    },
  },
};

export const AllTypes: Story = {
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
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'All input types displayed together.',
      },
    },
  },
};
