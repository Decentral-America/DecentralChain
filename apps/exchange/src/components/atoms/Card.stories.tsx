/**
 * Card Component Stories
 * Demonstrates Card variants and layouts
 */
import { type Meta, type StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  argTypes: {
    hoverable: {
      control: 'boolean',
      description: 'Enable hover effect',
    },
    onClick: { action: 'clicked' },
  },
  component: Card,
  parameters: {
    docs: {
      description: {
        component: 'Container component for content grouping with optional hover effects.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Atoms/Card',
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Card Title</h3>
        <p style={{ color: '#666', margin: 0 }}>This is a basic card component.</p>
      </div>
    ),
  },
};

export const Hoverable: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Hoverable Card</h3>
        <p style={{ color: '#666', margin: 0 }}>Hover over this card to see the effect.</p>
      </div>
    ),
    hoverable: true,
  },
};

export const Clickable: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Clickable Card</h3>
        <p style={{ color: '#666', margin: 0 }}>Click this card to trigger an action.</p>
      </div>
    ),
    hoverable: true,
    onClick: () => alert('Card clicked!'),
  },
};

export const WithImage: Story = {
  args: {
    children: (
      <div>
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px 12px 0 0',
            height: '160px',
          }}
        />
        <div style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Card with Image</h3>
          <p style={{ color: '#666', margin: 0 }}>This card has an image header.</p>
        </div>
      </div>
    ),
    hoverable: true,
  },
};

export const TransactionCard: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: 600 }}>Send Transaction</span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>+12.50 DCC</span>
        </div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          <div>To: 3P9KR...7x4M</div>
          <div>2024-01-15 14:32:11</div>
        </div>
      </div>
    ),
    hoverable: true,
  },
};

export const AssetCard: Story = {
  args: {
    children: (
      <div style={{ padding: '16px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              alignItems: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              color: 'white',
              display: 'flex',
              fontWeight: 'bold',
              height: '40px',
              justifyContent: 'center',
              width: '40px',
            }}
          >
            DCC
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>DecentralChain</div>
            <div style={{ color: '#666', fontSize: '14px' }}>DCC</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Balance</div>
            <div style={{ fontWeight: 600 }}>1,234.56 DCC</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#666', fontSize: '12px' }}>Value</div>
            <div style={{ fontWeight: 600 }}>$12,345.67</div>
          </div>
        </div>
      </div>
    ),
    hoverable: true,
  },
};

export const Grid: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Cards in a responsive grid layout.',
      },
    },
    layout: 'padded',
  },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(3, 1fr)',
        width: '800px',
      }}
    >
      {Array.from({ length: 6 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static story placeholder
        <Card key={i} hoverable>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Card {i + 1}</h4>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Sample content</p>
          </div>
        </Card>
      ))}
    </div>
  ),
};
