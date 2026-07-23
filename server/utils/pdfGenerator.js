const PDFDocument = require('pdfkit');

const bufferFromDoc = (doc) => new Promise((resolve, reject) => {
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  doc.end();
});

// @desc  MoU PDF for a college subscribing to a paid campus plan (spec 8.7)
const generateMouPdf = async (college, plan) => {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });

  doc.fontSize(20).font('Helvetica-Bold').text('MEMORANDUM OF UNDERSTANDING', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica').fillColor('#475569').text('Velaivaaipu Campus Placement Partnership', { align: 'center' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(11).font('Helvetica');
  doc.text(`This Memorandum of Understanding ("MoU") is entered into on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} between:`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('Velaivaaipu Job Portal ("Platform")');
  doc.font('Helvetica').text('and');
  doc.font('Helvetica-Bold').text(`${college.name}${college.code ? ` (${college.code})` : ''} ("Institution")`);
  if (college.university) doc.font('Helvetica').text(`Affiliated to: ${college.university}`);
  if (college.location) doc.font('Helvetica').text(`Location: ${college.location}`);
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(13).text('Subscription Plan Details');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(11);
  doc.text(`Plan: ${plan.name}`);
  doc.text(`Price: Rs ${plan.price.toLocaleString('en-IN')} / ${plan.duration}`);
  doc.text(`Student Capacity: ${(() => {
    const f = plan.features?.find(x => x.name === 'Student Capacity');
    return f && f.value > 0 ? f.value : 'Unlimited';
  })()}`);
  doc.text(`Scheduled Placement Reports: ${plan.features?.find(x => x.name === 'Scheduled Placement Reports')?.value || 'Monthly'}`);
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(13).text('Terms');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10.5).list([
    'The Institution will onboard its students onto the Platform for placement assistance and skill assessment.',
    'The Platform will provide the features and reporting cadence entitled under the selected subscription plan.',
    'Subscription auto-renews annually via the registered payment mandate unless disabled by the Institution.',
    'Either party may terminate this arrangement at the end of the current subscription period with written notice.'
  ]);
  doc.moveDown(2);

  doc.fontSize(10).fillColor('#475569').text(`Principal: ${college.principalName || '_______________________'}`);
  doc.text(`Email: ${college.principalEmail || '_______________________'}`);
  doc.moveDown(2);
  doc.text('_______________________', { continued: true }).text('                    ', { continued: true }).text('_______________________');
  doc.text('Authorized Signatory (Institution)', { continued: true }).text('                    ', { continued: true }).text('Authorized Signatory (Velaivaaipu)');

  return bufferFromDoc(doc);
};

// @desc  Skill/campus-drive assessment certificate, co-branded with the college when Campus Pro+ (spec 8.5)
const generateCertificatePdf = ({ studentName, skill, score, total, certCode, college, hasCoBranding }) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#10b981');
  doc.moveDown(2);

  doc.fontSize(28).font('Helvetica-Bold').fillColor('#0f172a').text('CERTIFICATE OF ACHIEVEMENT', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor('#475569').text('Velaivaaipu Job Portal', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor('#334155').text('This certifies that', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#065f46').text(studentName || 'Candidate', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(13).font('Helvetica').fillColor('#334155').text(
    `has successfully passed the "${skill}" skill assessment with a score of ${score}/${total}`,
    { align: 'center' }
  );

  if (hasCoBranding && college?.name) {
    doc.moveDown(0.8);
    doc.fontSize(12).font('Helvetica-Oblique').fillColor('#0f172a').text(`In partnership with ${college.name}`, { align: 'center' });
  }

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#64748b').text(`Certificate Code: ${certCode}`, { align: 'center' });
  doc.text(`Issued: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });

  return bufferFromDoc(doc);
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#ec4899', '#64748b'];

// Hand-drawn pie chart — pdfkit has no charting API, so slices are approximated with short line
// segments around the arc and filled as a closed path.
const drawPieChart = (doc, { x, y, radius, data }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total <= 0) return;
  let angle = -Math.PI / 2;
  data.forEach((d, i) => {
    if (d.value <= 0) return;
    const slice = (d.value / total) * Math.PI * 2;
    const end = angle + slice;
    const steps = Math.max(2, Math.ceil((slice / (Math.PI * 2)) * 80));
    doc.moveTo(x, y);
    for (let s = 0; s <= steps; s++) {
      const a = angle + (slice * s) / steps;
      doc.lineTo(x + radius * Math.cos(a), y + radius * Math.sin(a));
    }
    doc.closePath().fill(CHART_COLORS[i % CHART_COLORS.length]);
    angle = end;
  });
};

const drawLegend = (doc, x, y, data) => {
  data.filter(d => d.value > 0).forEach((d, i) => {
    const rowY = y + i * 15;
    doc.rect(x, rowY, 9, 9).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(`${d.label}: ${d.value}`, x + 14, rowY - 1);
  });
};

// Hand-drawn vertical bar chart, bars scaled to the tallest value.
const drawBarChart = (doc, { x, y, width, height, data }) => {
  const max = Math.max(1, ...data.map(d => d.value));
  const barWidth = width / Math.max(1, data.length);
  data.forEach((d, i) => {
    const barHeight = (d.value / max) * height;
    const barX = x + i * barWidth + barWidth * 0.15;
    const barY = y + height - barHeight;
    doc.rect(barX, barY, barWidth * 0.7, Math.max(barHeight, 1)).fill(CHART_COLORS[i % CHART_COLORS.length]);
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5).text(String(d.value), barX - 5, barY - 11, { width: barWidth * 0.7 + 10, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label, barX - 8, y + height + 4, { width: barWidth * 0.7 + 16, align: 'center' });
  });
};

// Simple paginated table: header row repeats on every new page.
const drawTable = (doc, { startY, columns, rows, title }) => {
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const rowHeight = 18;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  let y = startY;

  const drawHeaderRow = () => {
    doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#0f172a');
    let colX = doc.page.margins.left;
    columns.forEach(col => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text(col.label, colX + 4, y + 5, { width: col.width - 6, ellipsis: true });
      colX += col.width;
    });
    y += rowHeight;
  };

  if (title) {
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13).text(title, doc.page.margins.left, y);
    y = doc.y + 8;
  }
  drawHeaderRow();

  rows.forEach((row, i) => {
    if (y + rowHeight > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeaderRow();
    }
    if (i % 2 === 1) doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#f8fafc');
    let colX = doc.page.margins.left;
    columns.forEach(col => {
      doc.fillColor('#1e293b').font('Helvetica').fontSize(8).text(String(row[col.key] ?? '—'), colX + 4, y + 5, { width: col.width - 6, height: rowHeight - 4, ellipsis: true });
      colX += col.width;
    });
    y += rowHeight;
  });

  return y;
};

// @desc  Comprehensive placement summary PDF — full student roster, drive-wise hiring, and
//        department/status charts. This is the on-demand "Download Summary Report" export,
//        distinct from the lighter auto-generated periodic report above.
const generateSummaryReportPdf = (college, { stats, departments, drives, students }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // ── Cover / summary ──────────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text('Placement Summary Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#475569').text(college.name, { align: 'center' });
  doc.fontSize(9).text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(10).fillColor('#1e293b');
  doc.text(`Total Students: ${stats.totalStudents}   |   Total Campus Drives: ${drives.length}`);
  doc.text(`Registered: ${stats.registered}   Active: ${stats.active}   Applied: ${stats.applied}   Shortlisted: ${stats.shortlisted}`);
  doc.text(`Interviewing: ${stats.interviewing}   Placed: ${stats.placed}   Opted Out: ${stats.opted_out}`);
  doc.text(`Success Rate: ${stats.successRate}%   Average Placement Package: Rs ${stats.averageLPA || 0} LPA`);
  doc.moveDown(1.5);

  // ── Pie chart: placement status distribution ────────────────────────────
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Placement Status Distribution');
  const pieData = [
    { label: 'Placed', value: stats.placed },
    { label: 'Interviewing', value: stats.interviewing },
    { label: 'Shortlisted', value: stats.shortlisted },
    { label: 'Applied', value: stats.applied },
    { label: 'Active', value: stats.active },
    { label: 'Registered', value: stats.registered },
    { label: 'Opted Out', value: stats.opted_out }
  ];
  const pieCenterY = doc.y + 75;
  if (pieData.some(d => d.value > 0)) {
    drawPieChart(doc, { x: doc.page.margins.left + 75, y: pieCenterY, radius: 65, data: pieData });
    drawLegend(doc, doc.page.margins.left + 175, pieCenterY - 60, pieData);
  } else {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No student records yet.');
  }
  doc.y = pieCenterY + 90;

  // ── Bar chart: department-wise student counts ───────────────────────────
  if (doc.y > 620) doc.addPage();
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text('Department-wise Student Count', doc.page.margins.left, doc.y);
  const barY = doc.y + 15;
  if (departments.length > 0) {
    drawBarChart(doc, { x: doc.page.margins.left, y: barY, width: 480, height: 110, data: departments.map(d => ({ label: d.name, value: d.count })) });
    doc.y = barY + 140;
  } else {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No department records yet.');
  }

  // ── Campus drives & hiring summary ───────────────────────────────────────
  doc.addPage();
  drawTable(doc, {
    startY: doc.page.margins.top,
    title: 'Campus Drives & Hiring Summary',
    columns: [
      { key: 'title', label: 'Drive', width: 150 },
      { key: 'batchYear', label: 'Batch', width: 45 },
      { key: 'companies', label: 'Companies', width: 145 },
      { key: 'registered', label: 'Registered', width: 65 },
      { key: 'hired', label: 'Hired', width: 65 }
    ],
    rows: drives.length > 0 ? drives : []
  });
  if (drives.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No campus drives created yet.', doc.page.margins.left, doc.y + 8);
  }

  // ── Full student roster ──────────────────────────────────────────────────
  doc.addPage();
  drawTable(doc, {
    startY: doc.page.margins.top,
    title: `Student Details (${students.length})`,
    columns: [
      { key: 'name', label: 'Name', width: 100 },
      { key: 'email', label: 'Email', width: 130 },
      { key: 'department', label: 'Dept', width: 45 },
      { key: 'batchYear', label: 'Batch', width: 40 },
      { key: 'rollNumber', label: 'Roll No.', width: 55 },
      { key: 'status', label: 'Status', width: 55 },
      { key: 'phone', label: 'Phone', width: 65 }
    ],
    rows: students
  });
  if (students.length === 0) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9).text('No students registered yet.', doc.page.margins.left, doc.y + 8);
  }

  return bufferFromDoc(doc);
};

// @desc  Auto-generated placement report PDF (spec 8.6)
const generatePlacementReportPdf = (college, stats, periodLabel) => {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });

  doc.fontSize(20).font('Helvetica-Bold').text('Placement Report', { align: 'center' });
  doc.fontSize(12).font('Helvetica').fillColor('#475569').text(college.name, { align: 'center' });
  doc.text(periodLabel, { align: 'center' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Summary');
  doc.font('Helvetica').fontSize(11);
  doc.text(`Total Students: ${stats.totalStudents}`);
  doc.text(`Registered: ${stats.registered}  |  Active: ${stats.active}  |  Applied: ${stats.applied}`);
  doc.text(`Interviewing: ${stats.interviewing}  |  Placed: ${stats.placed}  |  Opted Out: ${stats.opted_out}`);
  doc.text(`Success Rate: ${stats.successRate}%`);
  doc.text(`Average Placement Salary: Rs ${stats.averageLPA || 0} LPA`);
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(12).text('Department Breakdown');
  doc.font('Helvetica').fontSize(11);
  (stats.departments || []).forEach(d => doc.text(`${d.name}: ${d.count} students`));

  return bufferFromDoc(doc);
};

module.exports = { generateMouPdf, generateCertificatePdf, generatePlacementReportPdf, generateSummaryReportPdf };
