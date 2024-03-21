import Api from "./Api";
import { Service } from "./Service";

export class DocEngagementService extends Service{
constructor(){
    super(Api,'doc-engagement');
}
async getByEngagement(id: string) {
    return this.api.get(`/${this.ressource}/byengagement/${id}`).then(res => res.data);
  }
}