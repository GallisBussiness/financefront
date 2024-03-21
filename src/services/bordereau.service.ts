import Api from "./Api";
import { Service } from "./Service";

export class BordereauService extends Service{
constructor(){
    super(Api,'bordereau');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }
}