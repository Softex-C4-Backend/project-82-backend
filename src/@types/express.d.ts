// Estamos dizendo ao TypeScript: "O objeto Request do Express agora tem uma propriedade user opcional"
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}