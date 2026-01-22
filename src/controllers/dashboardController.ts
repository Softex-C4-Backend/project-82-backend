import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  // GET /dashboard/low-stock
  async getLowStock(req: Request, res: Response) {
    try {
      const result = await dashboardService.getLowStockProducts();
      
      // Retorna a lista para o front-end
      return res.status(200).json(result);
    } catch (error) {
      // Tratamento de erro simplificado para o dashboard
      const message = error instanceof Error ? error.message : 'Erro ao processar dados do dashboard';
      return res.status(500).json({ message });
    }
  }

  // GET /dashboard/inventory-value
  async getInventoryValue(req: Request, res: Response) {
    try {
      const result = await dashboardService.getInventoryValue();
      
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao calcular valor do estoque';
      return res.status(500).json({ message });
    }
  }

  // GET /dashboard/out-of-stock
  async getOutOfStock(req: Request, res: Response) {
    try {
      const result = await dashboardService.getOutOfStockProducts();
      
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar produtos em falta';
      return res.status(500).json({ message });
    }
  }
}