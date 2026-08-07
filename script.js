const $ = (id) => document.getElementById(id);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const percent = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

let analysis = {};

function numericValue(id) {
  const value = Number($(id).value);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function calculateAnalysis() {
  const purchasePrice = numericValue("purchasePrice");
  const downPayment = numericValue("downPayment");
  const monthlyIncome = numericValue("monthlyIncome");
  const monthlyExpenses = numericValue("monthlyExpenses");
  const monthlyDebtService = numericValue("monthlyDebtService");

  const annualIncome = monthlyIncome * 12;
  const annualExpenses = monthlyExpenses * 12;
  const noi = annualIncome - annualExpenses;
  const annualDebtService = monthlyDebtService * 12;
  const annualCashFlow = noi - annualDebtService;
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const roi = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
  const downPaymentPercent = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 0;

  analysis = {
    propertyType: $("propertyType").value,
    purchasePrice,
    downPayment,
    downPaymentPercent,
    monthlyIncome,
    monthlyExpenses,
    monthlyDebtService,
    annualIncome,
    annualExpenses,
    noi,
    annualDebtService,
    annualCashFlow,
    capRate,
    roi
  };

  renderAnalysis();
}

function renderAnalysis() {
  $("downPaymentPercent").textContent = `${percent.format(analysis.downPaymentPercent)}%`;
  $("noiValue").textContent = currency.format(analysis.noi);
  $("capRateValue").textContent = `${percent.format(analysis.capRate)}%`;
  $("cashFlowValue").textContent = currency.format(analysis.annualCashFlow);
  $("roiValue").textContent = `${percent.format(analysis.roi)}%`;
  $("gaugeValue").textContent = `${percent.format(analysis.roi)}%`;

  $("summaryPurchasePrice").textContent = currency.format(analysis.purchasePrice);
  $("summaryDownPayment").textContent = currency.format(analysis.downPayment);
  $("summaryInvestment").textContent = currency.format(analysis.downPayment);
  $("summaryIncome").textContent = currency.format(analysis.annualIncome);
  $("summaryExpenses").textContent = currency.format(analysis.annualExpenses);
  $("summaryDebtService").textContent = currency.format(analysis.annualDebtService);
  $("summaryNoi").textContent = currency.format(analysis.noi);
  $("analysisSummary").value = JSON.stringify(analysis);
}

$("analysisForm").addEventListener("submit", (event) => {
  event.preventDefault();
  calculateAnalysis();
  $("resultsPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});

["propertyType", "purchasePrice", "downPayment", "monthlyIncome", "monthlyExpenses", "monthlyDebtService"].forEach((id) => {
  $(id).addEventListener("input", calculateAnalysis);
});

$("saveAnalysis").addEventListener("click", () => {
  calculateAnalysis();

  localStorage.setItem("commercialAnalyzerAnalysis", JSON.stringify({
    ...analysis,
    savedAt: new Date().toISOString()
  }));

  $("saveStatus").textContent = "Analysis saved on this device.";
  window.setTimeout(() => $("saveStatus").textContent = "", 3500);
});

const downloadDialog = $("downloadDialog");

$("downloadAnalysis").addEventListener("click", () => {
  calculateAnalysis();
  downloadDialog.showModal();
});

$("closeDownloadDialog").addEventListener("click", () => downloadDialog.close());

const scheduleDialog = $("scheduleDialog");

$("scheduleSession").addEventListener("click", () => scheduleDialog.showModal());
$("closeScheduleDialog").addEventListener("click", () => scheduleDialog.close());
$("openConsultationForm").addEventListener("click", () => scheduleDialog.close());

function escapePdf(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createPdf(lead) {
  const rows = [
    ["Prepared for", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "Not provided"],
    ["Company", lead.company || "Not provided"],
    ["Property Type", analysis.propertyType],
    ["Purchase Price", currency.format(analysis.purchasePrice)],
    ["Down Payment", `${currency.format(analysis.downPayment)} (${percent.format(analysis.downPaymentPercent)}%)`],
    ["Annual Rental Income", currency.format(analysis.annualIncome)],
    ["Annual Operating Expenses", currency.format(analysis.annualExpenses)],
    ["Annual Debt Service", currency.format(analysis.annualDebtService)],
    ["Estimated NOI", currency.format(analysis.noi)],
    ["Estimated Cap Rate", `${percent.format(analysis.capRate)}%`],
    ["Estimated Annual Cash Flow", currency.format(analysis.annualCashFlow)],
    ["Estimated ROI", `${percent.format(analysis.roi)}%`]
  ];

  let stream = "BT\n/F1 19 Tf\n50 744 Td\n";
  stream += `(${escapePdf("COMMERCIAL INVESTMENT ANALYSIS REPORT")}) Tj\n0 -24 Td\n`;
  stream += "/F1 10 Tf\n";
  stream += `(${escapePdf("HUT REALTY + SPARTAN CAPITAL GROUP")}) Tj\n0 -28 Td\n`;

  rows.forEach(([label, value]) => {
    stream += `/F1 10 Tf (${escapePdf(label + ": " + value)}) Tj\n0 -22 Td\n`;
  });

  stream += "0 -12 Td\n/F1 11 Tf\n";
  stream += `(${escapePdf("IMPORTANT")}) Tj\n0 -18 Td\n/F1 8 Tf\n`;

  [
    "This report is educational and based solely on the information entered.",
    "Actual performance may vary because of financing, vacancy, taxes, insurance,",
    "maintenance, market conditions, property operations, and other factors.",
    "Complete appropriate due diligence before making an investment decision.",
    "",
    "HUT Realty: www.hutteam.com",
    "Spartan Capital Group: www.spartanenterprises.com"
  ].forEach((line) => {
    stream += `(${escapePdf(line)}) Tj\n0 -15 Td\n`;
  });

  stream += "ET";

  const objects = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>";
  objects[4] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefPosition = pdf.length;

  pdf += "xref\n0 6\n0000000000 65535 f \n";

  for (let i = 1; i <= 5; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Commercial Investment Analysis Report.pdf";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

$("leadForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!event.currentTarget.reportValidity()) return;

  calculateAnalysis();

  const lead = {
    name: $("leadName").value.trim(),
    email: $("leadEmail").value.trim(),
    phone: $("leadPhone").value.trim(),
    company: $("leadCompany").value.trim()
  };

  const formData = new URLSearchParams();
  formData.set("form-name", "investment-report");
  formData.set("fullName", lead.name);
  formData.set("email", lead.email);
  formData.set("phone", lead.phone);
  formData.set("company", lead.company);
  formData.set("analysisSummary", JSON.stringify(analysis));

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
  } catch (error) {
    console.warn("Netlify Forms becomes active after deployment.", error);
  }

  createPdf(lead);
  downloadDialog.close();

  $("saveStatus").textContent = "Commercial Investment Analysis Report.pdf was downloaded.";
  window.setTimeout(() => $("saveStatus").textContent = "", 5000);
});

try {
  const saved = JSON.parse(localStorage.getItem("commercialAnalyzerAnalysis") || "null");

  if (saved) {
    $("propertyType").value = saved.propertyType || "Retail";
    $("purchasePrice").value = saved.purchasePrice ?? 1250000;
    $("downPayment").value = saved.downPayment ?? 250000;
    $("monthlyIncome").value = saved.monthlyIncome ?? 12500;
    $("monthlyExpenses").value = saved.monthlyExpenses ?? 3400;
    $("monthlyDebtService").value = saved.monthlyDebtService ?? 0;
  }
} catch (error) {
  console.warn("Saved analysis could not be restored.", error);
}

$("currentYear").textContent = new Date().getFullYear();
calculateAnalysis();