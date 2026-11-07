import ExcelJS from "exceljs";
import {
  categoryFilterLabel,
  REPORT_COLORS,
  ReportExportData,
  reportTitle,
  topCategoryText,
  truncationNote,
  typeFilterLabel,
} from "@/lib/reportExport";

/*
 * Excel workbook for a report: a summary sheet, the expense breakdown, the
 * categories that grew, and every transaction. Amounts and dates are written
 * as real numbers and dates (not text), so they can be summed, sorted and
 * filtered in Excel. Text cells are always stored as strings; ExcelJS only
 * writes a formula for an explicit `{ formula }` value, so user text such as
 * "=1+1" cannot turn into a formula.
 */

const argb = (hex: string) => `FF${hex}`;
const BRAND = argb(REPORT_COLORS.brand);
const HEADER_TEXT = "FFFFFFFF";
const INCOME = argb(REPORT_COLORS.income);
const EXPENSE = argb(REPORT_COLORS.expense);
const MUTED = argb(REPORT_COLORS.muted);

const PERCENT = "0.0%";
const DATE = "dd/mm/yyyy";

function rupiahFormat(withSen: boolean) {
  const n = withSen ? "#,##0.00" : "#,##0";
  return `"Rp"${n};-"Rp"${n}`;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: HEADER_TEXT } };
  row.alignment = { vertical: "middle" };
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND } };
  });
}

/** A data sheet with a styled, frozen header row and column widths. */
function tableSheet(workbook: ExcelJS.Workbook, name: string, columns: Partial<ExcelJS.Column>[]) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns;
  styleHeader(sheet.getRow(1));
  return sheet;
}

export async function buildReportXlsx(input: ReportExportData): Promise<Uint8Array> {
  const { report } = input;
  const s = report.summary;
  const withSen = input.transactions.some((t) => Math.round(t.amount * 100) % 100 !== 0);
  const RUPIAH = rupiahFormat(withSen);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Expense Tracker";
  workbook.title = reportTitle(report);
  workbook.created = new Date();

  // Summary
  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [{ width: 34 }, { width: 24 }, { width: 18 }];
  summary.addRow(["Laporan Keuangan"]).font = { bold: true, size: 16 };
  summary.addRow([input.userName]).font = { color: { argb: MUTED } };
  summary.addRow([]);
  const meta: [string, string][] = [
    ["Periode", report.period.label],
    ["Tipe transaksi", typeFilterLabel(report.filters.type)],
    ["Kategori", categoryFilterLabel(report)],
    ["Dibuat", input.generatedAt],
  ];
  for (const [label, value] of meta) {
    summary.addRow([label, value]).getCell(1).font = { color: { argb: MUTED } };
  }

  summary.addRow([]);
  styleHeader(summary.addRow(["Ringkasan", "Nilai"]));
  const totals: [string, number, string][] = [
    ["Total pemasukan", s.totalIncome, RUPIAH],
    ["Total pengeluaran", s.totalExpense, RUPIAH],
    ["Saldo bersih", s.netBalance, RUPIAH],
    ["Tingkat tabungan", s.savingsRate / 100, PERCENT],
    ["Jumlah transaksi", s.transactionCount, "0"],
  ];
  for (const [label, value, numFmt] of totals) {
    const row = summary.addRow([label, value]);
    row.getCell(2).numFmt = numFmt;
  }
  const net = summary.getRow(summary.rowCount - 2);
  net.font = { bold: true };
  net.getCell(2).font = { bold: true, color: { argb: s.netBalance < 0 ? EXPENSE : INCOME } };
  summary.addRow(["Kategori pengeluaran terbesar", topCategoryText(report)]);

  summary.addRow([]);
  styleHeader(summary.addRow([`Dibanding ${report.period.previousLabel}`, "Selisih", "Perubahan"]));
  const trends: [string, { difference: number; percent: number | null }][] = [
    ["Pemasukan", report.trends.income],
    ["Pengeluaran", report.trends.expense],
    ["Saldo bersih", report.trends.netBalance],
  ];
  for (const [label, trend] of trends) {
    const row = summary.addRow([label, trend.difference, trend.percent === null ? "belum ada pembanding" : trend.percent / 100]);
    row.getCell(2).numFmt = RUPIAH;
    if (trend.percent !== null) row.getCell(3).numFmt = PERCENT;
  }

  // Expense breakdown
  const breakdown = tableSheet(workbook, "Per kategori", [
    { header: "Kategori", key: "name", width: 30 },
    { header: "Transaksi", key: "count", width: 12 },
    { header: "Persentase", key: "share", width: 14, style: { numFmt: PERCENT } },
    { header: "Nominal", key: "total", width: 20, style: { numFmt: RUPIAH } },
  ]);
  for (const b of report.breakdown) {
    breakdown.addRow({ name: b.name, count: b.count, share: b.percent / 100, total: b.total });
  }
  if (report.breakdown.length > 0) {
    const last = breakdown.rowCount;
    const total = breakdown.addRow({
      name: "Total",
      count: { formula: `SUM(B2:B${last})`, result: report.breakdown.reduce((n, b) => n + b.count, 0) },
      total: { formula: `SUM(D2:D${last})`, result: s.totalExpense },
    });
    total.font = { bold: true };
  } else {
    breakdown.addRow({ name: "Belum ada pengeluaran pada periode ini." });
  }

  // Categories whose spending grew
  if (report.categoryIncreases.length > 0) {
    const increases = tableSheet(workbook, "Pengeluaran naik", [
      { header: "Kategori", key: "name", width: 30 },
      { header: "Periode ini", key: "current", width: 18, style: { numFmt: RUPIAH } },
      { header: "Pembanding", key: "previous", width: 18, style: { numFmt: RUPIAH } },
      { header: "Selisih", key: "difference", width: 18, style: { numFmt: RUPIAH } },
      { header: "Perubahan", key: "percent", width: 14, style: { numFmt: PERCENT } },
    ]);
    for (const c of report.categoryIncreases) {
      increases.addRow({
        name: c.name,
        current: c.current,
        previous: c.previous,
        difference: c.difference,
        percent: c.percent === null ? "baru" : c.percent / 100,
      });
    }
  }

  // Transactions
  const transactions = tableSheet(workbook, "Transaksi", [
    { header: "Tanggal", key: "date", width: 13, style: { numFmt: DATE } },
    { header: "Judul", key: "title", width: 32 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Tipe", key: "type", width: 14 },
    { header: "Nominal", key: "amount", width: 18, style: { numFmt: RUPIAH } },
    { header: "Arus kas", key: "flow", width: 18, style: { numFmt: RUPIAH } },
    { header: "Deskripsi", key: "description", width: 40 },
  ]);
  for (const t of input.transactions) {
    const row = transactions.addRow({
      date: t.date,
      title: t.title,
      category: t.category,
      type: typeFilterLabel(t.type),
      amount: t.amount,
      flow: t.type === "INCOME" ? t.amount : -t.amount,
      description: t.description ?? "",
    });
    row.getCell("flow").font = { color: { argb: t.type === "INCOME" ? INCOME : EXPENSE } };
  }
  if (input.transactions.length > 0) {
    transactions.autoFilter = { from: "A1", to: { row: transactions.rowCount, column: 7 } };
  }
  const note = truncationNote(input, "CSV");
  if (note) {
    transactions.addRow([]);
    transactions.addRow([note]).font = { italic: true, color: { argb: MUTED } };
  }

  // On Node, writeBuffer returns a Buffer (a Uint8Array): pass it on without copying
  const out = await workbook.xlsx.writeBuffer();
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}
