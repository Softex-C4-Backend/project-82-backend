import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface que define o que tem dentro do nosso Token
interface TokenPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Buscar o token no cabeçalho da requisição
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  // 2. Limpar o token (O formato vem como "Bearer eyJhbGci...")
  // Usamos o split para pegar apenas a parte do hash
  const [, token] = authorization.split(' ');

  try {
    // 3. Validar o token usando a nossa chave secreta
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        throw new Error('Erro interno: JWT_SECRET não configurado');
    }

    // O método verify lança um erro se o token for inválido ou expirado
    const decoded = jwt.verify(token, secret);

    // 4. Recuperar os dados do usuário (userId e role) do token
    const { userId, role } = decoded as TokenPayload;

    // 5. Injetar o usuário na requisição (para os próximos passos usarem)
    // Graças ao arquivo express.d.ts, o TypeScript aceita isso agora.
    req.user = { userId, role };

    // 6. Pode passar! Chama o próximo (Controller ou próximo Middleware)
    return next();

  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}