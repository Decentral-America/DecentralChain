/**
 * Accordion Component
 *
 * Collapsible content sections with:
 * - Single or multiple open items
 * - Smooth expand/collapse animations
 * - Icons and custom styling
 * - Full accessibility (ARIA attributes)
 * - Controlled and uncontrolled modes
 *
 * Migrated to Material-UI
 */

import { AccordionDetails, AccordionSummary, Box, Accordion as MuiAccordion } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { type ReactNode, useCallback, useState } from 'react';
import { FiChevronDown as FiChevronDownBase } from 'react-icons/fi';

// React 19 type compatibility cast
const FiChevronDown = FiChevronDownBase as React.ComponentType<Record<string, unknown>>;

const StyledAccordion = styled(MuiAccordion)(({ theme }) => ({
  '&:before': {
    display: 'none',
  },
  '&:first-of-type': {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
  },
  '&:last-of-type': {
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius,
  },
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  '& .MuiAccordionSummary-content': {
    fontWeight: 600,
    margin: 0,
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: theme.palette.primary.main,
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(180deg)',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-expanded': {
    backgroundColor: `${theme.palette.primary.main}10`,
    color: theme.palette.primary.main,
  },
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: 56,
  padding: theme.spacing(2, 2.5),
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  color: theme.palette.text.primary,
  lineHeight: 1.6,
  padding: theme.spacing(2, 2.5),
}));

// Interfaces
export interface AccordionItemData {
  /** Item title */
  title: string | ReactNode;

  /** Item content */
  content: ReactNode;

  /** Optional key */
  key?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Custom icon */
  icon?: ReactNode;
}

export interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItemData[];

  /** Allow multiple items open */
  allowMultiple?: boolean;

  /** Default open items (uncontrolled) */
  defaultOpen?: number[];

  /** Open items (controlled) */
  openItems?: number[];

  /** Callback when items change (controlled) */
  onChange?: (openItems: number[]) => void;

  /** Custom className */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;

  /** Custom expand/collapse icon */
  expandIcon?: ReactNode;

  /** Collapse all initially */
  collapseAll?: boolean;
}

/**
 * Accordion Component
 *
 * Collapsible content sections with smooth animations using Material-UI
 */
export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  openItems: controlledOpenItems,
  onChange,
  className,
  style,
  expandIcon = <FiChevronDown />,
  collapseAll = false,
}) => {
  const [internalOpenItems, setInternalOpenItems] = useState<number[]>(
    collapseAll ? [] : defaultOpen,
  );

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpenItems !== undefined;
  const openItems = isControlled ? controlledOpenItems : internalOpenItems;

  // Handle item toggle
  const handleChange = useCallback(
    (index: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      if (items[index]?.disabled) return;

      let newOpenItems: number[];

      if (allowMultiple) {
        // Multiple mode: toggle item in array
        if (isExpanded) {
          newOpenItems = [...openItems, index];
        } else {
          newOpenItems = openItems.filter((i) => i !== index);
        }
      } else {
        // Single mode: only one item open
        newOpenItems = isExpanded ? [index] : [];
      }

      if (!isControlled) {
        setInternalOpenItems(newOpenItems);
      }

      onChange?.(newOpenItems);
    },
    [allowMultiple, openItems, isControlled, onChange, items],
  );

  return (
    <Box className={className} style={style}>
      {items.map((item, index) => {
        const isExpanded = openItems.includes(index);

        return (
          <StyledAccordion
            key={item.key || index}
            expanded={isExpanded}
            onChange={handleChange(index)}
            disabled={item.disabled}
            disableGutters
          >
            <StyledAccordionSummary
              expandIcon={item.icon || expandIcon}
              aria-controls={`accordion-content-${index}`}
              id={`accordion-header-${index}`}
            >
              {item.title}
            </StyledAccordionSummary>
            <StyledAccordionDetails>{item.content}</StyledAccordionDetails>
          </StyledAccordion>
        );
      })}
    </Box>
  );
};

// Convenience exports
export const SingleAccordion: React.FC<Omit<AccordionProps, 'allowMultiple'>> = (props) => (
  <Accordion {...props} allowMultiple={false} />
);

export const MultipleAccordion: React.FC<Omit<AccordionProps, 'allowMultiple'>> = (props) => (
  <Accordion {...props} allowMultiple={true} />
);
