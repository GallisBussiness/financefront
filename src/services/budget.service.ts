import Api from "./Api";
import { Service } from "./Service";

export class BudgetService extends Service{
constructor(){
    super(Api,'budget');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }

  async findActive() {
    return this.api.get(`/${this.ressource}/findactive`).then(res => res.data);
  }
  async findAll() {
    return this.api.get(`/${this.ressource}/all`).then(res => res.data);
  }
}