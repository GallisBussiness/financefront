import Api from "./Api";
import { Service } from "./Service";

export class EngagementStateService extends Service{
constructor(){
    super(Api,'engagement-state');
}
async getByEngagement(id: string) {
    return this.api.get(`/${this.ressource}/byengagement/${id}`).then(res => res.data);
  }
}