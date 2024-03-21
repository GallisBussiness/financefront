import Api from "./Api";
import { Service } from "./Service";

export class CompteDivisionnaireService extends Service{
constructor(){
    super(Api,'compte-divisionnaire');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }
}