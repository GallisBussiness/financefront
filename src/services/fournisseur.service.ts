import Api from "./Api";
import { Service } from "./Service";

export class FournisseurService extends Service{
constructor(){
    super(Api,'fournisseur');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }
}