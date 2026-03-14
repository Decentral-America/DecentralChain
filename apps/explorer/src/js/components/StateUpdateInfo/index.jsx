import { Line } from '../../pages/SingleBlockPage/TransactionListItem';
import EndpointRef from '../EndpointRef';
import LeaseRef from '../LeaseRef';
import MoneyInfo from '../MoneyInfo';
import TransactionArrow from '../TransactionArrow';

const getDataEntryType = (type) => {
  switch (type) {
    case 'binary':
      return 'BinaryEntry';
    case 'integer':
      return 'IntegerEntry';
    case 'string':
      return 'StringEntry';
    case 'boolean':
      return 'BooleanEntry';
    default:
      return 'DeleteEntry';
  }
};

export const StateUpdateInfo = ({ tx }) => {
  const data = tx.stateUpdate ? tx.stateUpdate : tx.stateChanges;
  let uid = 0;
  return (
    <table className="state-update">
      <tbody>
        {data.transfers?.map(({ address, money, sender }) => {
          const k = `transfer_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line bold>Transfer</Line>
              </td>
              <td>
                <MoneyInfo value={money} />
              </td>
              <td>
                {sender && <TransactionArrow type={4} direction={'incoming'} />}
                {sender && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={sender} appearance="regular" />
                  </Line>
                )}
                {address && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={address} appearance="regular" />
                  </Line>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.payments?.map(({ dApp, sender, payment }) => {
          const k = `payment_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line bold>Transfer (Payment)</Line>
              </td>
              <td>
                <MoneyInfo value={payment.money} />
              </td>
              <td>
                {sender && <TransactionArrow type={4} direction={'incoming'} />}
                {sender && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={sender} appearance="regular" />
                  </Line>
                )}
                {dApp && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={dApp} appearance="regular" />
                  </Line>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.issues?.map((item) => {
          const k = `issue_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line wrap={false} bold>
                  Issue
                </Line>
                {item.address && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={item.address} appearance="regular" />
                  </Line>
                )}
              </td>
              <td>
                <MoneyInfo value={item.money} />
              </td>
              <td>
                <Line wrap={false}>{`Description: ${item.description}`}</Line>
                <Line wrap={false}>{`Reissuable: ${item.isReissuable}`}</Line>
                <Line wrap={false}>{`Script: ${item.compiledScript}`}</Line>
              </td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.reissues?.map((item) => {
          const k = `reissue_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line wrap={false} bold>
                  Reissue
                </Line>
                {item.address && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={item.address} appearance="regular" />
                  </Line>
                )}
              </td>
              <td>
                <MoneyInfo value={item.money} />
              </td>
              <td>
                <Line wrap={false}>{`Reissuable: ${item.isReissuable}`}</Line>
              </td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.burns?.map((item) => {
          const k = `burn_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line wrap={false} bold>
                  Burn
                </Line>
                {item.address && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={item.address} appearance="regular" />
                  </Line>
                )}
              </td>
              <td style={{ verticalAlign: 'middle' }}>
                <MoneyInfo value={item.money} />
              </td>
              <td></td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.sponsorFees?.map((item) => {
          const k = `sponsor_${++uid}`;
          return (
            <tr key={k}>
              <td style={{ width: 100 }}>
                <Line wrap={false} bold>
                  SponsorFee
                </Line>
                {item.address && (
                  <Line wrap={false}>
                    <EndpointRef endpoint={item.address} appearance="regular" />
                  </Line>
                )}
              </td>
              <td style={{ verticalAlign: 'middle' }}>
                <MoneyInfo value={item.money} />
              </td>
              <td></td>
            </tr>
          );
        })}
      </tbody>

      <tbody>
        {data.leases?.map((item) => (
          <tr key={`lease_${item.id}`}>
            <td style={{ width: 100 }}>
              <Line wrap={false} bold>
                Lease
              </Line>
              <Line wrap={false}>
                <LeaseRef leaseId={item.id} />
              </Line>
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <MoneyInfo value={item.money} />
            </td>
            <td>
              {item.sender && <TransactionArrow type={4} direction={'incoming'} />}
              {item.sender && (
                <Line wrap={false}>
                  <EndpointRef endpoint={item.sender} appearance="regular" />
                </Line>
              )}
              {item.recipient && (
                <Line wrap={false}>
                  <EndpointRef endpoint={item.recipient} appearance="regular" />
                </Line>
              )}
            </td>
          </tr>
        ))}
      </tbody>

      <tbody>
        {data.leaseCancels?.map((item) => (
          <tr key={`leasecancel_${item.id}`}>
            <td style={{ width: 100 }}>
              <Line wrap={false} bold>
                LeaseCancel
              </Line>
              <Line wrap={false}>
                <LeaseRef leaseId={item.id} />
              </Line>
            </td>
            <td style={{ verticalAlign: 'middle' }}>{item.amount}</td>
            <td>
              {item.address && (
                <Line wrap={false}>
                  <EndpointRef endpoint={item.address} appearance="regular" />
                </Line>
              )}
              {item.sender && item.recipient && (
                <TransactionArrow type={4} direction={'incoming'} />
              )}
              {item.sender && (
                <Line wrap={false}>
                  <EndpointRef endpoint={item.sender} appearance="regular" />
                </Line>
              )}
              {item.recipient && (
                <Line wrap={false}>
                  <EndpointRef endpoint={item.recipient} appearance="regular" />
                </Line>
              )}
            </td>
          </tr>
        ))}
      </tbody>

      <tbody>
        {data.data?.map((entry) => (
          <tr key={`data_${entry.address}_${entry.key}`}>
            <td style={{ width: 100 }}>
              <Line bold>{getDataEntryType(entry.type) || 'Delete value'}</Line>
              {entry.address && (
                <Line wrap={false}>
                  <EndpointRef endpoint={entry.address} appearance="regular" />
                </Line>
              )}
            </td>
            <td>{`key: ${entry.key}`}</td>
            <td>{`value: ${entry.value}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
