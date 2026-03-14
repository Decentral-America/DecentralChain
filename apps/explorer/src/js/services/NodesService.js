import { nodeApi } from '../shared/api/NodeApi';
import { ApiClientService } from './ApiClientService';

export class NodesService extends ApiClientService {
  loadNodes = () => {
    const nodes = this.configuration().nodes.slice();

    const promises = nodes.map((node, index) => {
      const api = nodeApi(node.url);
      return Promise.all([
        api.version(),
        api.blocks.height(),
        api.baseTarget(),
        api.transactions.utxSize(),
      ]).then(([version, height, baseTarget, unconfirmedTxCount]) => {
        const newNode = {
          ...node,
          version: version.version,
          height: height.height,
          baseTarget: baseTarget.baseTarget,
          unconfirmedTxCount: unconfirmedTxCount.size,
        };

        return {
          index,
          node: newNode,
        };
      });
    });

    return Promise.all(promises).then((values) => {
      values.forEach((item) => {
        nodes[item.index] = item.node;
      });

      return nodes;
    });
  };
}
