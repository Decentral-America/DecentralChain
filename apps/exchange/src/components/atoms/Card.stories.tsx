/**
 * Card Component Stories
 * Demonstrates Card variants and layouts
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'Atoms/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Container component for content grouping with optional hover effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    hoverable: {
      control: 'boolean',
      description: 'Enable hover effect',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Card Title</h3>
        <p style={{ margin: 0, color: '#666' }}>This is a basic card component.</p>
      </div>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Hoverable Card</h3>
        <p style={{ margin: 0, color: '#666' }}>Hover over this card to see the effect.</p>
      </div>
    ),
  },
};

export const Clickable: Story = {
  args: {
    hoverable: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Clickable Card</h3>
        <p style={{ margin: 0, color: '#666' }}>Click this card to trigger an action.</p>
      </div>
    ),
  },
};

export const WithImage: Story = {
  args: {
    hoverable: true,
    children: (
      <div>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            height: '160px',
            borderRadius: '12px 12px 0 0',
          }}
        />
        <div style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Card with Image</h3>
          <p style={{ margin: 0, color: '#666' }}>This card has an image header.</p>
        </div>
      </div>
    ),
  },
};

export const TransactionCard: Story = {
  args: {
    hoverable: true,
    children: (
      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: 600 }}>Send Transaction</span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>+12.50 DCC</span>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div>To: 3P9KR...7x4M</div>
          <div>2024-01-15 14:32:11</div>
        </div>
      </div>
    ),
  },
};

export const AssetCard: Story = {
  args: {
    hoverable: true,
    children: (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            DCC
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>DecentralChain</div>
            <div style={{ fontSize: '14px', color: '#666' }}>DCC</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Balance</div>
            <div style={{ fontWeight: 600 }}>1,234.56 DCC</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>Value</div>
            <div style={{ fontWeight: 600 }}>$12,345.67</div>
          </div>
        </div>
      </div>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        width: '800px',
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} hoverable>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Card {i + 1}</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Sample content</p>
          </div>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Cards in a responsive grid layout.',
      },
    },
  },
};
