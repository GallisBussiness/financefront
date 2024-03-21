import Api from "./Api";
import { Service } from "./Service";

export class EngagementService extends Service{
constructor(){
    super(Api,'engagement');
}
async changeState(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/updatestate/${id}`, data).then(res => res.data);
  }

  async byBordereau(id: string) {
    return this.api.get(`/${this.ressource}/bybordereau/${id}`).then(res => res.data);
  }

  async byCredit(id: string) {
    return this.api.get(`/${this.ressource}/bycredit/${id}`).then(res => res.data);
  }
}