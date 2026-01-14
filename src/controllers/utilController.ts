import { Request, Response } from 'express';
// @ts-ignore
import { UnitOfMeasure } from '@prisma/client';

export class UtilController {

  // GET /utils/unit-of-measures
  // Retorna todos os valores do Enum UnitOfMeasure
  listUnitOfMeasures(req: Request, res: Response) {
    try {
      // O Prisma Client expõe o Enum. Object.values() extrai os nomes
      const measures = Object.values(UnitOfMeasure);
      
      // Formata para um JSON amigável, retornando Key/Label
      const formattedMeasures = measures.map(measure => ({
        key: measure,
        label: measure // Para simplificar, a chave e o rótulo são os mesmos
      }));

      return res.status(200).json(formattedMeasures);
    } catch (error) {
      // Caso improvável de erro, mas mantemos o tratamento
      return res.status(500).json({ message: 'Erro ao listar unidades de medida.' });
    }
  }
}