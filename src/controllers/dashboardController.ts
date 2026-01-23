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

  // GET /dashboard/sales-evolution
  async getSalesEvolution(req: Request, res: Response) {
    try {
      // Pega a quantidade de dias da URL (ex: ?days=30) ou usa 7 como padrão
      const days = req.query.days ? Number(req.query.days) : 7;
      
      const result = await dashboardService.getSalesEvolution(days);
      
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar evolução de vendas';
      return res.status(500).json({ message });
    }
  }

  // GET /dashboard/losses-by-category
  async getLossesByCategory(req: Request, res: Response) {
    try {
      // Pega a quantidade de dias da URL (ex: ?days=30) ou usa 30 como padrão
      const days = req.query.days ? Number(req.query.days) : 30;
      
      const result = await dashboardService.getLossesByCategory(days);
      
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar perdas por categoria';
      return res.status(500).json({ message });
    }
  }
}