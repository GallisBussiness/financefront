import Api from "./Api";
import { Service } from "./Service";

export class CommentaireService extends Service{
constructor(){
    super(Api,'commentaire');
}
async getByEngagement(id: string) {
    return this.api.get(`/${this.ressource}/byengagement/${id}`).then(res => res.data);
  }
}