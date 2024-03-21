import Api from "./Api";
import { Service } from "./Service";

export class ClasseService extends Service{
constructor(){
    super(Api,'classe');
}
async toggle(id: string,data: any) {
    return this.api.patch(`/${this.ressource}/toggle/${id}`, data).then(res => res.data);
  }
}

export enum CLASSE {
  PRODUIT_INVESTISSEMENT = "PRODUIT_INVESTISSEMENT",
  CHARGE_INVESTISSEMENT = "CHARGE_INVESTISSEMENT",
  PRODUIT_DE_FONCTIONNEMENT = "PRODUIT_DE_FONCTIONNEMENT",
  CHARGE_DE_FONCTIONNEMENT ="CHARGE_DE_FONCTIONNEMENT",
  } 