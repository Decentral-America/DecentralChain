import { nodeApi } from '../shared/api/NodeApi';
import { ConfigurableService } from './ConfigurableService';

export class ApiClientService extends ConfigurableService {
  getApi() {
    return nodeApi(this.configuration().apiBaseUrl, this.configuration().useCustomRequestConfig);
  }
}
