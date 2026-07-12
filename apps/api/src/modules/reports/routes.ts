import { Router } from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { requireProjectAccess } from "../../middleware/rbac";
import { notFound } from "../../middleware/errors";

const router = Router();
router.use(requireAuth);

async function loadProjectReportData(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      leadArchitect: true,
      phases: { orderBy: { order: "asc" } },
      milestones: { orderBy: { dueDate: "asc" } },
      statutoryItems: true,
      consultantContracts: { include: { consultant: true, paymentMilestones: true } },
      tasks: { include: { assignee: true } },
      invoices: true,
    },
  });
}

function money(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

router.get(
  "/project/:projectId/pdf",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res, next) => {
    const project = await loadProjectReportData(req.params.projectId);
    if (!project) return next(notFound("Project not found"));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name.replace(/\s+/g, "_")}_report.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text(project.name, { continued: false });
    doc.fontSize(11).fillColor("#666").text(`${project.typology} · ${project.client.name}`);
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Project Summary");
    doc.fontSize(10).fillColor("#333");
    doc.text(`Status: ${project.status}`);
    doc.text(`Fee: ${money(project.fee ?? 0)}`);
    doc.text(`Lead Architect: ${project.leadArchitect?.name ?? "Unassigned"}`);
    doc.text(`Site: ${project.siteAddress ?? "—"}`);
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Phases");
    doc.fontSize(10).fillColor("#333");
    project.phases.forEach((p) => doc.text(`${p.name}: ${p.status}`));
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Milestones");
    doc.fontSize(10).fillColor("#333");
    project.milestones.forEach((m) =>
      doc.text(`${m.title} — due ${m.dueDate.toDateString()} — ${m.status}`)
    );
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Statutory Approvals");
    doc.fontSize(10).fillColor("#333");
    project.statutoryItems.forEach((s) => doc.text(`${s.name}: ${s.status}`));
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Consultants");
    doc.fontSize(10).fillColor("#333");
    project.consultantContracts.forEach((c) =>
      doc.text(`${c.consultant.name} (${c.consultant.category}) — Fee ${money(c.fee)} — ${c.status}`)
    );
    doc.moveDown();

    doc.fontSize(14).fillColor("#000").text("Financials");
    doc.fontSize(10).fillColor("#333");
    const clientInvoiced = project.invoices.filter((i) => i.type === "CLIENT").reduce((s, i) => s + i.amount, 0);
    const clientCollected = project.invoices.filter((i) => i.type === "CLIENT").reduce((s, i) => s + i.amountPaid, 0);
    doc.text(`Client invoiced: ${money(clientInvoiced)}`);
    doc.text(`Client collected: ${money(clientCollected)}`);

    doc.end();
  })
);

router.get(
  "/project/:projectId/excel",
  requireProjectAccess("projectId"),
  asyncHandler(async (req, res, next) => {
    const project = await loadProjectReportData(req.params.projectId);
    if (!project) return next(notFound("Project not found"));

    const workbook = new ExcelJS.Workbook();

    const overview = workbook.addWorksheet("Overview");
    overview.columns = [
      { header: "Field", key: "field", width: 24 },
      { header: "Value", key: "value", width: 50 },
    ];
    overview.addRows([
      { field: "Project", value: project.name },
      { field: "Client", value: project.client.name },
      { field: "Typology", value: project.typology },
      { field: "Status", value: project.status },
      { field: "Fee", value: project.fee ?? 0 },
      { field: "Lead Architect", value: project.leadArchitect?.name ?? "" },
      { field: "Site Address", value: project.siteAddress ?? "" },
    ]);

    const milestones = workbook.addWorksheet("Milestones");
    milestones.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];
    project.milestones.forEach((m) =>
      milestones.addRow({ title: m.title, dueDate: m.dueDate.toDateString(), status: m.status })
    );

    const consultants = workbook.addWorksheet("Consultants");
    consultants.columns = [
      { header: "Consultant", key: "name", width: 30 },
      { header: "Category", key: "category", width: 20 },
      { header: "Fee", key: "fee", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];
    project.consultantContracts.forEach((c) =>
      consultants.addRow({ name: c.consultant.name, category: c.consultant.category, fee: c.fee, status: c.status })
    );

    const tasks = workbook.addWorksheet("Tasks");
    tasks.columns = [
      { header: "Task", key: "title", width: 35 },
      { header: "Assignee", key: "assignee", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
    ];
    project.tasks.forEach((t) =>
      tasks.addRow({
        title: t.title,
        assignee: t.assignee?.name ?? "",
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toDateString() : "",
      })
    );

    const invoices = workbook.addWorksheet("Invoices");
    invoices.columns = [
      { header: "Type", key: "type", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Paid", key: "paid", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];
    project.invoices.forEach((i) =>
      invoices.addRow({ type: i.type, amount: i.amount, paid: i.amountPaid, status: i.status })
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${project.name.replace(/\s+/g, "_")}_report.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  })
);

export default router;
