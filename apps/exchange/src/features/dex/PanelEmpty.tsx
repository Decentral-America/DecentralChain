/**
 * Plain empty state for the Trade screen's data panels (chart, order book,
 * recent trades): a title line and one secondary line, centred, no icons.
 *
 * The fanned-icon EmptyState teaches a next step, and on this screen only
 * "Your orders" has one to teach. Repeated across four panels it became
 * decoration, so the other panels state their condition and step back.
 */
import styled from 'styled-components';

const Root = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  min-height: 120px;
  padding: 24px 16px;
  text-align: center;
`;

const Title = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
`;

const Description = styled.p`
  margin: 0;
  max-width: 40ch;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export function PanelEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <Root role="status">
      <Title>{title}</Title>
      {description ? <Description>{description}</Description> : null}
    </Root>
  );
}
