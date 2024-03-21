export interface LoginInterface {
    username: string;
    password: string;
}

export interface PasswordUpdateInterface {
    oldPass?: string;
    newPass: string;
}