import Api from "./Api";
import { Service } from "./Service";

export class CategoriesFournisseurService extends Service{
constructor(){
    super(Api,'cat-fournisseur');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }
}