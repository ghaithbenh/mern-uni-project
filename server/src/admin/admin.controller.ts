import type { Request, Response } from 'express';
import type { AdminService, DashboardPeriod } from './admin.service.js';
import { DASHBOARD_PERIODS } from './admin.service.js';

const DEFAULT_PERIOD: DashboardPeriod = 14;

const parsePeriod = (value: unknown): DashboardPeriod => {
  if (typeof value !== 'string') return DEFAULT_PERIOD;

  const parsed = Number(value);
  return DASHBOARD_PERIODS.find((period) => period === parsed) ?? DEFAULT_PERIOD;
};

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  getStats = async (req: Request, res: Response): Promise<void> => {
    const period = parsePeriod(req.query.days);
    const stats = await this.adminService.getStats(period);
    res.json(stats);
  };
}
