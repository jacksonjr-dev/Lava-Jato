import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type { Row } from "write-excel-file/browser";

type MonthlyFinancialReport = {
  periodo: { titulo: string; inicio: string; fim: string; geradoEm: string };
  faturamentoDia: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  veiculosDia: number;
  veiculosMes: number;
  ticketMedio: number;
  emAndamento: number;
  pagosOuEntregues: number;
  porMetodo: Array<{ metodo: string; valor: number }>;
  topServicos: Array<{ nome: string; qtd: number; valor: number }>;
  last7: Array<{ dia: string; valor: number }>;
};

const METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  DINHEIRO: "Dinheiro",
  OUTRO: "Outro",
};

function reportFilename(period: string, extension: "xlsx" | "pdf") {
  const normalized = period
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `balanco-${normalized}.${extension}`;
}

export async function exportMonthlyExcel(data: MonthlyFinancialReport): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const moneyCell = (value: number) => ({
    value,
    type: Number,
    format: "R$ #,##0.00",
    align: "right" as const,
  });
  const section = (title: string): Row => [
    {
      value: title,
      columnSpan: 3,
      fontWeight: "bold",
      textColor: "#09CBD2",
      backgroundColor: "#0D1B2A",
    },
    null,
    null,
  ];
  const header = (values: string[]): Row =>
    values.map((value) => ({ value, fontWeight: "bold", backgroundColor: "#DCE7EC" }));

  const rows: Row[] = [
    [
      {
        value: "BALANÇO MENSAL - LAVAPRO",
        columnSpan: 3,
        fontWeight: "bold",
        fontSize: 16,
        backgroundColor: "#09CBD2",
        textColor: "#061622",
      },
      null,
      null,
    ],
    ["Período", data.periodo.titulo],
    [
      "Gerado em",
      { value: new Date(data.periodo.geradoEm), type: Date, format: "dd/mm/yyyy hh:mm" },
    ],
    [],
    section("RESUMO"),
    ["Faturamento do mês", moneyCell(data.faturamentoMes)],
    ["Ticket médio", moneyCell(data.ticketMedio)],
    ["Veículos atendidos no mês", data.veiculosMes],
    ["Pagamentos recebidos", data.pagosOuEntregues],
    ["Atendimentos em andamento", data.emAndamento],
    [],
    section("FORMAS DE PAGAMENTO"),
    header(["Método", "Valor"]),
    ...(data.porMetodo.length
      ? data.porMetodo.map((item): Row => [
          METHOD_LABEL[item.metodo] ?? item.metodo,
          moneyCell(item.valor),
        ])
      : ([["Nenhum pagamento registrado no período."]] as Row[])),
    [],
    section("SERVIÇOS COM MAIOR SAÍDA"),
    header(["Serviço", "Execuções", "Valor"]),
    ...(data.topServicos.length
      ? data.topServicos.map((service): Row => [
          service.nome,
          service.qtd,
          moneyCell(service.valor),
        ])
      : ([["Nenhum serviço pago no período."]] as Row[])),
  ];

  await writeXlsxFile(rows, {
    sheet: "Balanço mensal",
    columns: [{ width: 36 }, { width: 22 }, { width: 24 }],
    stickyRowsCount: 3,
    showGridLines: false,
  }).toFile(reportFilename(data.periodo.titulo, "xlsx"));
}

export async function exportMonthlyPdf(data: MonthlyFinancialReport): Promise<void> {
  const [pdfMakeModule, pdfFontsModule] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  const pdfMake = pdfMakeModule.default;
  pdfMake.addVirtualFileSystem(pdfFontsModule.default);
  const money = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const tableLayout = {
    fillColor: (rowIndex: number) => (rowIndex === 0 ? "#0D1B2A" : undefined),
    hLineColor: "#D7E0E7",
    vLineColor: "#D7E0E7",
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 6,
    paddingBottom: () => 6,
  };
  const headerCell = (text: string) => ({ text, bold: true, color: "#09CBD2" });

  const documentDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#15212D" },
    content: [
      {
        stack: [
          { text: "BALANÇO MENSAL - LAVAPRO", fontSize: 20, bold: true, color: "#061622" },
          { text: data.periodo.titulo.toUpperCase(), margin: [0, 5, 0, 0], bold: true },
        ],
        background: "#09CBD2",
        margin: [0, 0, 0, 22],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 130],
          body: [
            [headerCell("Resumo"), headerCell("Valor")],
            ["Faturamento do mês", money(data.faturamentoMes)],
            ["Ticket médio", money(data.ticketMedio)],
            ["Veículos atendidos", String(data.veiculosMes)],
            ["Pagamentos recebidos", String(data.pagosOuEntregues)],
            ["Atendimentos em andamento", String(data.emAndamento)],
          ],
        },
        layout: tableLayout,
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 130],
          body: [
            [headerCell("Forma de pagamento"), headerCell("Valor")],
            ...(data.porMetodo.length
              ? data.porMetodo.map((item) => [
                  METHOD_LABEL[item.metodo] ?? item.metodo,
                  money(item.valor),
                ])
              : [["Nenhum pagamento registrado", "-"]]),
          ],
        },
        layout: tableLayout,
        margin: [0, 18, 0, 0],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", 80, 110],
          body: [
            [headerCell("Serviço"), headerCell("Execuções"), headerCell("Valor")],
            ...(data.topServicos.length
              ? data.topServicos.map((item) => [item.nome, String(item.qtd), money(item.valor)])
              : [["Nenhum serviço pago", "-", "-"]]),
          ],
        },
        layout: tableLayout,
        margin: [0, 18, 0, 0],
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        `Gerado em ${new Date(data.periodo.geradoEm).toLocaleString("pt-BR")}`,
        { text: `Página ${currentPage} de ${pageCount}`, alignment: "right" },
      ],
      margin: [40, 0, 40, 0],
      fontSize: 8,
      color: "#65717C",
    }),
  };

  pdfMake.createPdf(documentDefinition).download(reportFilename(data.periodo.titulo, "pdf"));
}
