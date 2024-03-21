import { AxiosInstance } from "axios";

export abstract class Service {
  
  constructor(protected readonly api:AxiosInstance,protected readonly ressource: string){}

  async create(data: any) {
    return this.api.post(`/${this.ressource}`, data).then(res => res.data);
  }
  async getAll() {
    return this.api.get(`/${this.ressource}`).then(res => res.data);
  }

  async getOne(id: string) {
    return this.api.get(`/${this.ressource}/${id}`).then(res => res.data);
  }
  async update(id:string , data :any ) {
    return this.api.patch(`/${this.ressource}/${id}`,data).then(res => res.data);
  }

  async delete(id:string ) {
   return  this.api.delete(`/${this.ressource}/${id}`).then(res => res.data);
  }
}