import Api from "./Api";
import { Service } from "./Service";

export class DocVersementService extends Service{
constructor(){
    super(Api,'doc-versement');
}
async getByVersement(id: string) {
    return this.api.get(`/${this.ressource}/byversement/${id}`).then(res => res.data);
  }
}