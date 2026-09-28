/**
 * Network Settings Component
 * Configures network endpoints matching Angular Network tab
 */

import { Switch } from '@mui/material';
import * as ds from 'data-service';
import { ChevronRight } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { SettingsGroup, SettingsRow } from '@/components/premium/SettingsList';
import { NetworkConfig as networkConfig } from '@/config/networkConfig';
import { useSettings } from '@/contexts/SettingsContext';
import { useClipboard } from '@/hooks/useClipboard';
import { noTouchZoom } from '@/styles/mixins';
import { Pane } from './Pane';
import { CopyButton, FieldInput } from './SettingsControls';

const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

const FieldLine = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
`;

/*
 * The kit's field material on an opaque fill: the group surface in light mode
 * and the hover shade in dark, which is what the kit's translucent grey
 * composites to over the group. Opaque so the ink can be held to AA against
 * the field's own background (see NetworkSettings.contrast.test.tsx).
 */
const EndpointInput = styled(FieldInput)`
  background: ${({ theme }) =>
    theme.mode === 'dark' ? theme.colors.surfaceHover : theme.colors.surface};

  /* iOS Safari zooms the page on focus below 16px; touch only. */
  ${noTouchZoom}
`;

/*
 * A whole-row action in the accent, drawn like the kit's button rows but on the
 * group's own opaque surface instead of a transparent fill, so the ink can be
 * held to AA against the button's own background (see
 * NetworkSettings.contrast.test.tsx).
 */
const ActionRow = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 52px;
  padding: 10px 16px;
  box-sizing: border-box;
  border: 0;
  font: inherit;
  font-size: 15px;
  line-height: 1.33;
  letter-spacing: -0.15px;
  text-align: left;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  transition: background-color 160ms ${EASE};

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }

  span {
    flex: 1;
  }

  svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

/** An endpoint row: the field takes the row's width with its copy button beside it. */
function EndpointRow({
  id,
  label,
  value,
  onChange,
  onCommit,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <SettingsRow
      label={label}
      htmlFor={id}
      stack
      control={
        <FieldLine>
          <EndpointInput
            id={id}
            value={value}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
          />
          <CopyButton copied={copied} onCopy={onCopy} what={label} />
        </FieldLine>
      }
    />
  );
}

export const NetworkSettings: React.FC = () => {
  const { commonSettings, setCommonSetting } = useSettings();
  const { copyToClipboard } = useClipboard();

  const [node, setNode] = useState(commonSettings.network.server);
  const [matcher, setMatcher] = useState(commonSettings.network.matcher);
  const [api, setApi] = useState(commonSettings.network.api);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const updateDS = async () => {
      await ds.config.setConfig({ api, matcher, node });
    };
    void updateDS();
  }, [node, matcher, api]);

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetToDefaults = () => {
    const defaults = {
      api: networkConfig.api,
      matcher: networkConfig.matcher,
      server: networkConfig.node,
    };
    setNode(defaults.server);
    setMatcher(defaults.matcher);
    setApi(defaults.api);
    setCommonSetting('network', {
      ...commonSettings.network,
      api: defaults.api,
      matcher: defaults.matcher,
      server: defaults.server,
    });
  };

  return (
    <Pane>
      <SettingsGroup
        title="Endpoints"
        footer="Saved when you leave a field. Only point these at servers you trust."
      >
        <EndpointRow
          id="settings-node"
          label="Node address"
          value={node}
          onChange={setNode}
          onCommit={() => setCommonSetting('network', { ...commonSettings.network, server: node })}
          copied={copiedField === 'node'}
          onCopy={() => handleCopy(node, 'node')}
        />
        <EndpointRow
          id="settings-matcher"
          label="Matcher address"
          value={matcher}
          onChange={setMatcher}
          onCommit={() => setCommonSetting('network', { ...commonSettings.network, matcher })}
          copied={copiedField === 'matcher'}
          onCopy={() => handleCopy(matcher, 'matcher')}
        />
        <EndpointRow
          id="settings-api"
          label="API address"
          value={api}
          onChange={setApi}
          onCommit={() => setCommonSetting('network', { ...commonSettings.network, api })}
          copied={copiedField === 'api'}
          onCopy={() => handleCopy(api, 'api')}
        />
      </SettingsGroup>

      <SettingsGroup title="Wallet">
        <SettingsRow
          label="Hide suspicious assets"
          description="Assets flagged as suspicious stay out of your wallet."
          htmlFor="dontShowSpam"
          control={
            <Switch
              id="dontShowSpam"
              checked={commonSettings.dontShowSpam}
              onChange={(e) => setCommonSetting('dontShowSpam', e.target.checked)}
            />
          }
        />
      </SettingsGroup>

      <SettingsGroup>
        <ActionRow type="button" onClick={resetToDefaults}>
          <span>Reset to default settings</span>
          <ChevronRight size={16} strokeWidth={2} aria-hidden />
        </ActionRow>
      </SettingsGroup>
    </Pane>
  );
};
