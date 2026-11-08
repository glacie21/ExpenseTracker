import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { formatPercent } from "@/lib/finance";
import { formatRupiah, formatRupiahByType } from "@/lib/formatters";
import { formatDayLabel } from "@/lib/dates";
import {
  filterSummary,
  NO_TRANSACTIONS_TEXT,
  REPORT_COLORS,
  ReportExportData,
  reportTitle,
  summaryRows,
  truncationNote,
} from "@/lib/reportExport";

/*
 * Word version of the report: the PDF's sections, from the same text helpers. Unlike the
 * PDF it can be edited, e.g. to add notes before sharing it.
 */

const BRAND = REPORT_COLORS.brand;
const MUTED = REPORT_COLORS.muted;
const RULE = REPORT_COLORS.rule;

interface Column {
  header: string;
  /** Share of the table width, in percent. */
  width: number;
  align?: "left" | "right";
}

interface Cell {
  text: string;
  color?: string;
  bold?: boolean;
}

const RULE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

function cellParagraph(cell: Cell, align: Column["align"], header = false) {
  return new Paragraph({
    alignment: align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
    children: [
      new TextRun({
        text: cell.text,
        bold: header || cell.bold,
        color: header ? "FFFFFF" : cell.color,
        size: 19,
      }),
    ],
  });
}

/** A full-width table with a teal header row that repeats on every page. */
function table(columns: Column[], rows: Cell[][]) {
  const margins = { top: 70, bottom: 70, left: 100, right: 100 };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: RULE_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideHorizontal: RULE_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: columns.map(
          (c) =>
            new TableCell({
              width: { size: c.width, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: BRAND, color: "auto" },
              margins,
              children: [cellParagraph({ text: c.header }, c.align, true)],
            })
        ),
      }),
      ...rows.map(
        (cells) =>
          new TableRow({
            cantSplit: true,
            children: cells.map(
              (cell, i) =>
                new TableCell({
                  width: { size: columns[i].width, type: WidthType.PERCENTAGE },
                  margins,
                  children: [cellParagraph(cell, columns[i].align)],
                })
            ),
          })
      ),
    ],
  });
}

function heading(text: string) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 } });
}

function muted(text: string) {
  return new Paragraph({ children: [new TextRun({ text, color: MUTED, size: 19 })], spacing: { after: 60 } });
}

export async function buildReportDocx(input: ReportExportData): Promise<Buffer> {
  const { report } = input;

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: "Laporan Keuangan", heading: HeadingLevel.TITLE }),
    muted(input.userName),
    new Paragraph({ children: [new TextRun({ text: `Periode: ${report.period.label}`, size: 21 })] }),
    muted(filterSummary(report)),
    muted(`Dibuat: ${input.generatedAt}`),

    heading("Ringkasan"),
    table(
      [
        { header: "Ringkasan", width: 60 },
        { header: "Nilai", width: 40, align: "right" },
      ],
      summaryRows(report).map((row) => [
        { text: row.label, bold: row.tone !== undefined },
        { text: row.value, bold: row.tone !== undefined, color: row.tone && REPORT_COLORS[row.tone] },
      ])
    ),
  ];

  if (report.breakdown.length > 0) {
    children.push(
      heading("Pengeluaran per kategori"),
      table(
        [
          { header: "Kategori", width: 45 },
          { header: "Transaksi", width: 15, align: "right" },
          { header: "Persentase", width: 15, align: "right" },
          { header: "Nominal", width: 25, align: "right" },
        ],
        report.breakdown.map((b) => [
          { text: b.name },
          { text: String(b.count) },
          { text: formatPercent(b.percent) },
          { text: formatRupiah(b.total) },
        ])
      )
    );
  }

  children.push(heading("Daftar transaksi"));
  if (input.transactions.length === 0) {
    children.push(muted(NO_TRANSACTIONS_TEXT));
  } else {
    const note = truncationNote(input.transactions.length, input.totalTransactions, "versi Excel atau CSV");
    if (note) children.push(muted(note));
    children.push(
      table(
        [
          { header: "Tanggal", width: 16 },
          { header: "Transaksi", width: 34 },
          { header: "Kategori", width: 22 },
          { header: "Nominal", width: 28, align: "right" },
        ],
        input.transactions.map((t) => [
          { text: formatDayLabel(t.date) },
          { text: t.title },
          { text: t.category },
          { text: formatRupiahByType(t.amount, t.type), color: REPORT_COLORS[t.type === "INCOME" ? "income" : "expense"] },
        ])
      )
    );
  }

  const doc = new Document({
    creator: "Expense Tracker",
    title: reportTitle(report),
    styles: {
      default: { document: { run: { font: "Calibri", size: 21, color: REPORT_COLORS.ink } } },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          run: { size: 40, bold: true, color: REPORT_COLORS.ink },
          paragraph: { spacing: { after: 80 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { size: 26, bold: true, color: BRAND },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    color: MUTED,
                    size: 16,
                    children: [`Expense Tracker, ${report.period.label}. Halaman `, PageNumber.CURRENT, " dari ", PageNumber.TOTAL_PAGES],
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
