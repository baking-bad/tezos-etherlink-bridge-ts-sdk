import { TokenBridgeError } from '../../common';

export class DipDupAutoUpdateIsDisabledError extends TokenBridgeError {
  constructor() {
    super('AutoUpdate is disabled for the DipDupBridgeDataProvider');
  }
}
