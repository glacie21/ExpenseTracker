import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { formatPercent } from "@/lib/finance";
import { formatRupiah } from "@/lib/formatters";
import { formatDayLabel } from "@/lib/dates";
import { Report } from "@/lib/reports";

export interface PdfTransactionRow {
  date: Date;
  title: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
}

interface PdfReportInput {
  report: Report;
  userName: string;
  generatedAt: string;
  transactions: PdfTransactionRow[];
  totalTransactions: number;
}

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait
const MARGIN = 40;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const COLORS = {
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.39, 0.45, 0.55),
  rule: rgb(0.89, 0.91, 0.94),
  headerFill: rgb(0.95, 0.96, 0.98),
  income: rgb(0.05, 0.58, 0.53),
  expense: rgb(0.88, 0.11, 0.28),
};

interface Column {
  header: string;
  width: number;
  align?: "left" | "right";
}

/** Builds a multi-page A4 PDF report with repeated table headers. */
class ReportWriter {
  private page!: PDFPage;
  private y = 0;
  private pages: PDFPage[] = [];
  private charset: Set<number>;

  constructor(
    private doc: PDFDocument,
    private font: PDFFont,
    private bold: PDFFont
  ) {
    this.charset = new Set(font.getCharacterSet());
    this.newPage();
  }

  /** Standard fonts only cover WinAnsi; replace anything else (emoji, CJK, ...). */
  clean(text: string): string {
    return Array.from(text.replace(/[\r\n\t]+/g, " "))
      .map((ch) => (this.charset.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");
  }

  fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
    let value = this.clean(text);
    if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
    while (value.length > 1 && font.widthOfTextAtSize(`${value}…`, size) > maxWidth) {
      value = value.slice(0, -1);
    }
    return `${value.trimEnd()}…`;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.y = PAGE.height - MARGIN;
  }

  ensureSpace(height: number, onNewPage?: () => void) {
    if (this.y - height < MARGIN + 20) {
      this.newPage();
      onNewPage?.();
    }
  }

  text(value: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; x?: number } = {}) {
    const size = options.size ?? 10;
    this.ensureSpace(size + 4);
    this.y -= size;
    this.page.drawText(this.fit(value, options.font ?? this.font, size, CONTENT_WIDTH), {
      x: options.x ?? MARGIN,
      y: this.y,
      size,
      font: options.font ?? this.font,
      color: options.color ?? COLORS.ink,
    });
    this.y -= 4;
  }

  gap(height: number) {
    this.y -= height;
  }

  rule() {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.width - MARGIN, y: this.y },
      thickness: 0.5,
      color: COLORS.rule,
    });
  }

  section(title: string) {
    this.ensureSpace(40);
    this.gap(12);
    this.text(title, { size: 12, font: this.bold });
    this.gap(2);
  }

  keyValueRows(rows: [string, string][]) {
    for (const [label, value] of rows) {
      this.ensureSpace(18);
      this.y -= 14;
      this.page.drawText(this.clean(label), { x: MARGIN, y: this.y, size: 10, font: this.font, color: COLORS.muted });
      const v = this.fit(value, this.bold, 10, CONTENT_WIDTH / 2);
      this.page.drawText(v, {
        x: PAGE.width - MARGIN - this.bold.widthOfTextAtSize(v, 10),
        y: this.y,
        size: 10,
        font: this.bold,
        color: COLORS.ink,
      });
      this.y -= 4;
      this.rule();
    }
  }

  table(columns: Column[], rows: { cells: string[]; color?: ReturnType<typeof rgb> }[]) {
    const rowHeight = 16;
    const size = 9;
    const drawHeader = () => {
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: COLORS.headerFill,
      });
      this.drawRow(columns, columns.map((c) => c.header), this.bold, size, COLORS.muted);
    };

    this.ensureSpace(rowHeight * 2);
    drawHeader();
    for (const row of rows) {
      this.ensureSpace(rowHeight, drawHeader);
      this.drawRow(columns, row.cells, this.font, size, COLORS.ink, row.color);
      this.rule();
    }
  }

  private drawRow(
    columns: Column[],
    cells: string[],
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
    lastColor?: ReturnType<typeof rgb>
  ) {
    this.y -= 16;
    let x = MARGIN;
    columns.forEach((col, i) => {
      const value = this.fit(cells[i] ?? "", font, size, col.width - 8);
      const textX =
        col.align === "right" ? x + col.width - 4 - font.widthOfTextAtSize(value, size) : x + 4;
      this.page.drawText(value, {
        x: textX,
        y: this.y + 5,
        size,
        font,
        color: i === columns.length - 1 && lastColor ? lastColor : color,
      });
      x += col.width;
    });
  }

  footer(note: string) {
    const total = this.pages.length;
    this.pages.forEach((page, i) => {
      const label = this.clean(`${note} · Halaman ${i + 1} dari ${total}`);
      page.drawText(label, {
        x: MARGIN,
        y: MARGIN - 16,
        size: 8,
        font: this.font,
        color: COLORS.muted,
      });
    });
  }
}

export async function buildReportPdf(input: PdfReportInput): Promise<Uint8Array> {
  const { report } = input;
  const doc = await PDFDocument.create();
  doc.setTitle(`Laporan Keuangan ${report.period.label}`);
  doc.setCreator("Expense Tracker");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new ReportWriter(doc, font, bold);

  // Title & metadata
  w.text("Laporan Keuangan", { size: 20, font: bold });
  w.gap(4);
  w.text(input.userName, { size: 11, color: COLORS.muted });
  w.text(`Periode: ${report.period.label}`, { size: 10 });
  const typeLabel =
    report.filters.type === "INCOME" ? "Pemasukan" : report.filters.type === "EXPENSE" ? "Pengeluaran" : "Semua";
  w.text(`Filter: tipe ${typeLabel}; kategori ${report.filters.category?.name ?? "Semua"}`, { size: 10 });
  w.text(`Dibuat: ${input.generatedAt}`, { size: 10, color: COLORS.muted });

  // Summary
  w.section("Ringkasan");
  const s = report.summary;
  w.keyValueRows([
    ["Total Pemasukan", formatRupiah(s.totalIncome)],
    ["Total Pengeluaran", formatRupiah(s.totalExpense)],
    ["Saldo Bersih", formatRupiah(s.netBalance)],
    ["Savings Rate", formatPercent(s.savingsRate)],
    ["Jumlah Transaksi", String(s.transactionCount)],
    [
      "Kategori Pengeluaran Terbesar",
      report.topExpenseCategory
        ? `${report.topExpenseCategory.name} (${formatRupiah(report.topExpenseCategory.total)})`
        : "-",
    ],
  ]);

  // Category breakdown
  if (report.breakdown.length > 0) {
    w.section("Pengeluaran per Kategori");
    w.table(
      [
        { header: "Kategori", width: CONTENT_WIDTH * 0.45 },
        { header: "Transaksi", width: CONTENT_WIDTH * 0.15, align: "right" },
        { header: "Persentase", width: CONTENT_WIDTH * 0.15, align: "right" },
        { header: "Nominal", width: CONTENT_WIDTH * 0.25, align: "right" },
      ],
      report.breakdown.map((b) => ({
        cells: [b.name, String(b.count), formatPercent(b.percent), formatRupiah(b.total)],
      }))
    );
  }

  // Transactions
  w.section("Daftar Transaksi");
  if (input.transactions.length === 0) {
    w.text("Tidak ada transaksi yang sesuai dengan filter pada periode ini.", { color: COLORS.muted });
  } else {
    if (input.totalTransactions > input.transactions.length) {
      w.text(
        `Menampilkan ${input.transactions.length} dari ${input.totalTransactions} transaksi. Gunakan Export CSV untuk data lengkap.`,
        { size: 9, color: COLORS.muted }
      );
    }
    w.table(
      [
        { header: "Tanggal", width: CONTENT_WIDTH * 0.15 },
        { header: "Transaksi", width: CONTENT_WIDTH * 0.33 },
        { header: "Kategori", width: CONTENT_WIDTH * 0.2 },
        { header: "Tipe", width: CONTENT_WIDTH * 0.12 },
        { header: "Nominal", width: CONTENT_WIDTH * 0.2, align: "right" },
      ],
      input.transactions.map((t) => ({
        cells: [
          formatDayLabel(t.date),
          t.title,
          t.category,
          t.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
          `${t.type === "INCOME" ? "+" : "-"}${formatRupiah(t.amount)}`,
        ],
        color: t.type === "INCOME" ? COLORS.income : COLORS.expense,
      }))
    );
  }

  w.footer(`Expense Tracker · ${report.period.label}`);
  return doc.save();
}
