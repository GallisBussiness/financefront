import { LoginInterface } from "../interfaces/login.interface";
import Api from "./Api";

export const login = (data: LoginInterface) => Api.post('/user/login', data).then(res => res.data.data);

export const getAuth = (id: string) => Api.get('/user/' + id).then(res => res.data);


export const updatePassword = (id: string,data: any) => Api.patch('/user/updatepassword/'+id,data).then(res=> res.data);