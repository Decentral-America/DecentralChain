/**
 * Network Settings Component
 * Configures network endpoints matching Angular Network tab
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSettings } from '@/contexts/SettingsContext';
import { useClipboard } from '@/hooks/useClipboard';
import networkConfig from '@/config/networkConfig';

const NetworkSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const SettingRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
`;

const Label = styled.div`
  font-size: 12px;
  color: #757575;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Input = styled.input<{ error?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid ${(props) => (props.error ? '#f44336' : '#e0e0e0')};
  border-radius: 4px;
  background: white;
  color: #212121;
  font-family: 'Courier New', monospace;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? '#f44336' : '#2196f3')};
  }
`;

const CopyLink = styled.button`
  background: none;
  border: none;
  color: #2196f3;
  font-size: 11px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
  color: #212121;
  cursor: pointer;
`;

const Button = styled.button`
  padding: 10px 24px;
  font-size: 13px;
  color: #2196f3;
  background: white;
  border: 1px solid #2196f3;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    background-color: #e3f2fd;
  }
`;

export const NetworkSettings: React.FC = () => {
  const { commonSettings, setCommonSetting } = useSettings();
  const { copyToClipboard } = useClipboard();

  const [node, setNode] = useState(commonSettings.network.server);
  const [matcher, setMatcher] = useState(commonSettings.network.matcher);
  const [api, setApi] = useState(commonSettings.network.api);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const updateDS = async () => {
      const ds = await import('data-service');
      await ds.config.setConfig({ node, matcher, api });
    };
    updateDS();
  }, [node, matcher, api]);

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetToDefaults = () => {
    const defaults = {
      server: networkConfig.node,
      matcher: networkConfig.matcher,
      api: networkConfig.api,
    };
    setNode(defaults.server);
    setMatcher(defaults.matcher);
    setApi(defaults.api);
    setCommonSetting('network', {
      ...commonSettings.network,
      server: defaults.server,
      matcher: defaults.matcher,
      api: defaults.api,
    });
  };

  return (
    <NetworkSection>
      <SettingRow>
        <Label>
          Node Address
          <CopyLink onClick={() => handleCopy(node, 'node')}>
            {copiedField === 'node' ? 'Copied!' : 'Copy'}
          </CopyLink>
        </Label>
        <Input
          value={node}
          onChange={(e) => setNode(e.target.value)}
          onBlur={() => setCommonSetting('network', { ...commonSettings.network, server: node })}
        />
      </SettingRow>

      <SettingRow>
        <Label>
          Matcher Address
          <CopyLink onClick={() => handleCopy(matcher, 'matcher')}>
            {copiedField === 'matcher' ? 'Copied!' : 'Copy'}
          </CopyLink>
        </Label>
        <Input
          value={matcher}
          onChange={(e) => setMatcher(e.target.value)}
          onBlur={() => setCommonSetting('network', { ...commonSettings.network, matcher })}
        />
      </SettingRow>

      <SettingRow>
        <Label>
          API Address
          <CopyLink onClick={() => handleCopy(api, 'api')}>
            {copiedField === 'api' ? 'Copied!' : 'Copy'}
          </CopyLink>
        </Label>
        <Input
          value={api}
          onChange={(e) => setApi(e.target.value)}
          onBlur={() => setCommonSetting('network', { ...commonSettings.network, api })}
        />
      </SettingRow>

      <CheckboxRow>
        <Checkbox
          id="dontShowSpam"
          checked={commonSettings.dontShowSpam}
          onChange={(e) => setCommonSetting('dontShowSpam', e.target.checked)}
        />
        <CheckboxLabel htmlFor="dontShowSpam">Hide suspicious assets from the wallet</CheckboxLabel>
      </CheckboxRow>

      <Button onClick={resetToDefaults}>Reset to Default Settings</Button>
    </NetworkSection>
  );
};

export default NetworkSettings;
