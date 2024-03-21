import Api from "./Api";
import { Service } from "./Service";

export class UserService extends Service{
constructor(){
    super(Api,'user');
}
}