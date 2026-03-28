import clsx from 'clsx';
import type { PermissionValue } from '#permissions/types';
import { Button } from '#ui/components/ui/buttons';

import * as styles from './list.module.styl';

export const ListItem: React.FunctionComponent<IParams> = ({
  className,
  originName,
  permissions,
  showSettings,
  toggleApprove,
  permissionsText,
}) => (
  <div
    className={clsx(
      className,
      styles.permissionItem,
      permissions.includes('approved') && styles.approved,
    )}
  >
    <div>{originName}</div>
    <div className={styles.statusColor}>{permissionsText}</div>
    <div>
      <ItemButton
        permissions={permissions}
        onClick={(enable) => toggleApprove(originName, enable)}
      />
      <SettingsButton onClick={() => showSettings(originName)} />
    </div>
  </div>
);

const ItemButton: React.FunctionComponent<{
  permissions: PermissionValue[];
  onClick: (enable: boolean) => void;
}> = ({ permissions, onClick }) => {
  if (permissions.includes('whiteList')) {
    return <Icon />;
  }
  const isApproved = permissions.includes('approved');
  const status = isApproved ? 'enable' : 'disable';
  const statusStyle = status === 'enable' ? styles.enable : styles.disable;
  const className = clsx(styles.button, statusStyle);
  return (
    <Button
      type="button"
      view="transparent"
      onClick={() => onClick(!isApproved)}
      className={className}
    />
  );
};

const Icon = () => <div className={clsx(styles.icon, styles.button)} />;

const SettingsButton: React.FunctionComponent<{
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}> = (props) => {
  return (
    <Button
      type="button"
      view="transparent"
      onClick={props.onClick}
      className={clsx(styles.button, styles.settings)}
    />
  );
};

interface IParams extends React.ComponentProps<'div'> {
  originName: string;
  permissions: PermissionValue[];
  permissionsText: React.ReactElement;
  showSettings: (origin: string) => void;
  toggleApprove: (origin: string, enable: boolean) => void;
}
