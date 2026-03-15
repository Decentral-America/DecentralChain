/**
 * Breadcrumbs Component
 * Shows current route path and allows navigation back to parent routes
 */
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const BreadcrumbNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0;
  font-size: 0.875rem;
`;

const BreadcrumbLink = styled(
  Link as React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>,
)`
  color: ${(props) => props.theme.colors.text};
  text-decoration: none;
  text-transform: capitalize;
  transition: color 0.2s ease;

  &:hover {
    color: ${(props) => props.theme.colors.primary};
  }
`;

const BreadcrumbSeparator = styled.span`
  color: ${(props) => props.theme.colors.text}60;
  user-select: none;
`;

const CurrentPage = styled.span`
  color: ${(props) => props.theme.colors.primary};
  font-weight: 500;
  text-transform: capitalize;
`;

export const Breadcrumbs = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on root path
  if (paths.length === 0) {
    return null;
  }

  return (
    <BreadcrumbNav aria-label="Breadcrumb">
      <BreadcrumbLink to="/">Home</BreadcrumbLink>
      {paths.map((path, index) => {
        const to = `/${paths.slice(0, index + 1).join('/')}`;
        const isLast = index === paths.length - 1;

        // Format path name (e.g., 'my-wallet' -> 'My Wallet')
        const displayName = path
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return (
          <span key={to}>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            {isLast ? (
              <CurrentPage>{displayName}</CurrentPage>
            ) : (
              <BreadcrumbLink to={to}>{displayName}</BreadcrumbLink>
            )}
          </span>
        );
      })}
    </BreadcrumbNav>
  );
};
