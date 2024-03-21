import Api from "./Api";
import { Service } from "./Service";

export class VersementService extends Service{
constructor(){
    super(Api,'versement');
}

  async findActive() {
    return this.api.get(`/${this.ressource}/findactive`).then(res => res.data);
  }
}