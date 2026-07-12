import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requirePermission, projectScopeWhere } from "../../middleware/rbac";

const router = Router();
router.use(requireAuth);
router.use(requirePermission("VIEW_FINANCIALS"));

// Placeholder blended cost rate (INR/hour) used to estimate team-hours cost
// against fee for a rough profitability read, since the platform doesn't
// yet track individual salary/cost-to-company rates per team member.
const BLENDED_HOURLY_COST_RATE = 800;

router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const scope = await projectScopeWhere(req.user!);
    const projects = await prisma.project.findMany({
      where: scope,
      include: {
        invoices: true,
        consultantContracts: true,
        timesheets: { where: { approvalStatus: "APPROVED" } },
      },
    });

    const breakdown = projects.map((p) => {
      const clientInvoices = p.invoices.filter((i) => i.type === "CLIENT");
      const consultantInvoices = p.invoices.filter((i) => i.type === "CONSULTANT");

      const feeInvoiced = clientInvoices.reduce((sum, i) => sum + i.amount, 0);
      const feeCollected = clientInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
      const consultantBudget = p.consultantContracts.reduce((sum, c) => sum + c.fee, 0);
      const consultantPaid = consultantInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
      const totalHours = p.timesheets.reduce((sum, t) => sum + t.hours, 0);
      const hoursCost = totalHours * BLENDED_HOURLY_COST_RATE;
      const profitability = (p.fee ?? 0) - hoursCost - consultantBudget;

      return {
        projectId: p.id,
        projectName: p.name,
        fee: p.fee ?? 0,
        feeInvoiced,
        feeCollected,
        consultantBudget,
        consultantPaid,
        totalHours,
        hoursCost,
        profitability,
      };
    });

    const totals = breakdown.reduce(
      (acc, b) => ({
        fee: acc.fee + b.fee,
        feeInvoiced: acc.feeInvoiced + b.feeInvoiced,
        feeCollected: acc.feeCollected + b.feeCollected,
        consultantBudget: acc.consultantBudget + b.consultantBudget,
        consultantPaid: acc.consultantPaid + b.consultantPaid,
        profitability: acc.profitability + b.profitability,
      }),
      { fee: 0, feeInvoiced: 0, feeCollected: 0, consultantBudget: 0, consultantPaid: 0, profitability: 0 }
    );

    res.json({ projects: breakdown, totals, assumedHourlyCostRate: BLENDED_HOURLY_COST_RATE });
  })
);

export default router;
