import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { formatPercent } from "@/lib/finance";
import { formatRupiah, formatRupiahByType } from "@/lib/formatters";
import { formatDayLabel } from "@/lib/dates";
import {
  filterSummary,
  NO_TRANSACTIONS_TEXT,
  REPORT_COLORS,
  ReportExportData,
  SummaryRow,
  reportTitle,
  summaryRows,
  truncationNote,
  typeFilterLabel,
} from "@/lib/reportExport";

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait
const MARGIN = 40;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

function hexColor(hex: string) {
  const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16) / 255;
  return rgb(channel(0), channel(2), channel(4));
}

const COLORS = {
  ink: hexColor(REPORT_COLORS.ink),
  muted: hexColor(REPORT_COLORS.muted),
  rule: hexColor(REPORT_COLORS.rule),
  headerFill: hexColor(REPORT_COLORS.brand),
  headerText: rgb(1, 1, 1),
  income: hexColor(REPORT_COLORS.income),
  expense: hexColor(REPORT_COLORS.expense),
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
    const flat = text.replace(/[\r\n\t]+/g, " ");
    // Printable ASCII is always in WinAnsi: skip the per-character check
    if (/^[\x20-\x7E]*$/.test(flat)) return flat;
    return Array.from(flat)
      .map((ch) => (this.charset.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");
  }

  fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
    const value = this.clean(text);
    if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
    // Longest prefix (at least 1 char) that fits with the ellipsis; width grows with length
    let lo = 1;
    let hi = value.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (font.widthOfTextAtSize(`${value.slice(0, mid)}…`, size) <= maxWidth) lo = mid;
      else hi = mid - 1;
    }
    return `${value.slice(0, lo).trimEnd()}…`;
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

  keyValueRows(rows: SummaryRow[]) {
    for (const { label, value, tone } of rows) {
      this.ensureSpace(18);
      this.y -= 14;
      this.page.drawText(this.clean(label), { x: MARGIN, y: this.y, size: 10, font: this.font, color: COLORS.muted });
      const v = this.fit(value, this.bold, 10, CONTENT_WIDTH / 2);
      this.page.drawText(v, {
        x: PAGE.width - MARGIN - this.bold.widthOfTextAtSize(v, 10),
        y: this.y,
        size: 10,
        font: this.bold,
        color: tone ? COLORS[tone] : COLORS.ink,
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
      this.drawRow(columns, columns.map((c) => c.header), this.bold, size, COLORS.headerText);
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

export async function buildReportPdf(input: ReportExportData): Promise<Uint8Array> {
  const { report } = input;
  const doc = await PDFDocument.create();
  doc.setTitle(reportTitle(report));
  doc.setCreator("Expense Tracker");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = new ReportWriter(doc, font, bold);

  // Title & metadata
  w.text("Laporan Keuangan", { size: 20, font: bold });
  w.gap(4);
  w.text(input.userName, { size: 11, color: COLORS.muted });
  w.text(`Periode: ${report.period.label}`, { size: 10 });
  w.text(filterSummary(report), { size: 10 });
  w.text(`Dibuat: ${input.generatedAt}`, { size: 10, color: COLORS.muted });

  // Summary
  w.section("Ringkasan");
  w.keyValueRows(summaryRows(report));

  // Category breakdown
  if (report.breakdown.length > 0) {
    w.section("Pengeluaran per kategori");
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
  w.section("Daftar transaksi");
  if (input.transactions.length === 0) {
    w.text(NO_TRANSACTIONS_TEXT, { color: COLORS.muted });
  } else {
    const note = truncationNote(input.transactions.length, input.totalTransactions, "versi Excel atau CSV");
    if (note) w.text(note, { size: 9, color: COLORS.muted });
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
          typeFilterLabel(t.type),
          // Standard PDF fonts have no Unicode minus
          formatRupiahByType(t.amount, t.type, "-"),
        ],
        color: t.type === "INCOME" ? COLORS.income : COLORS.expense,
      }))
    );
  }

  w.footer(`Expense Tracker · ${report.period.label}`);
  return doc.save();
}
