import { config } from '../../config/main';

export class WorkerResource {
  public readonly url: string;

  constructor(url: string) {
    this.url = `${config.apiUrl}${config.codePrefix}${url}`;
  }
}
