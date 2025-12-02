import { z } from 'zod';

// Validação para o Login
// Aceita "identifier" que pode ser o E-mail OU a Matrícula (registration)
export const loginSchema = z.object({
  identifier: z.string().min(1, 'E-mail ou Matrícula é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Validação para Cadastro de Funcionário (Gestor cria Funcionário)
export const createEmployeeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Formato de e-mail inválido'),
  // REGRA DE NEGÓCIO: Matrícula (registration) deve ser alfanumérica
  registration: z
    .string()
    .min(3, 'Matrícula deve ter no mínimo 3 caracteres')
    .regex(/^[a-zA-Z0-9-]+$/, 'Matrícula deve conter apenas letras, números e hífens'),
});

// Validação para Troca de Senha (Onboarding)
export const setPasswordSchema = z.object({
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});
