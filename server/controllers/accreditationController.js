const ExcelJS = require('exceljs');
const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const AccreditationExportLog = require('../models/AccreditationExportLog');
const Company = require('../models/Company');
const { parse } = require('csv-parse/sync');

const OUTCOMES = ['Placed', 'Higher Studies', 'Qualified Competitive Exam', 'Not Placed'];
const csvEscape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
const academicYearToPassingYear = value => {
  const match = String(value || '').match(/(\d{2,4})\s*[-–]\s*(\d{2,4})/);
  if (!match) return Number(value) || null;
  return Number(match[2].length === 2 ? `20${match[2]}` : match[2]);
};
const median = values => {
  const list = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!list.length) return 0;
  const middle = Math.floor(list.length / 2);
  return list.length % 2 ? list[middle] : Number(((list[middle - 1] + list[middle]) / 2).toFixed(2));
};
const getCollege = async userId => {
  const college = await College.findOne({ tpoUser: userId });
  if (!college) throw Object.assign(new Error('No college linked'), { status: 404 });
  return college;
};
const deriveOutcome = student => student.accreditation?.outcome || (student.placementStatus === 'placed' ? 'Placed' : 'Not Placed');
const buildRecords = students => students.map(student => {
  const fallbackPlacement = student.placedDetails?.[student.placedDetails.length - 1] || {};
  const placement = student.accreditation?.placement || {};
  const outcome = deriveOutcome(student);
  return {
    academic_year: `${Number(student.batchYear) - 1}-${String(student.batchYear).slice(-2)}`,
    register_number: student.rollNumber,
    student_name: student.user?.name || '',
    gender: student.accreditation?.gender || '',
    programme: student.accreditation?.programme || student.user?.profile?.qualification?.[0]?.degree || '',
    department: student.department,
    year_of_passing: student.batchYear,
    outcome,
    employer_name: outcome === 'Placed' ? (placement.employerName || fallbackPlacement.companyName || '') : '',
    employer_city: outcome === 'Placed' ? placement.employerCity || '' : '',
    designation: outcome === 'Placed' ? placement.designation || '' : '',
    package_lpa: outcome === 'Placed' ? Number(placement.packageLPA || fallbackPlacement.packageLPA || 0) : '',
    offer_date: outcome === 'Placed' ? (placement.offerDate || fallbackPlacement.placedAt || '') : '',
    offer_source: outcome === 'Placed' ? placement.offerSource || '' : '',
    drive_reference: outcome === 'Placed' ? placement.driveReference || '' : '',
    evidence_ref: outcome === 'Placed' ? placement.evidenceUrl || '' : '',
    verified_by: outcome === 'Placed' ? placement.verifiedBy?.name || '' : '',
    verified_on: outcome === 'Placed' ? placement.verifiedOn || '' : '',
  };
});
const buildProgression = students => students.filter(s => ['Higher Studies', 'Qualified Competitive Exam'].includes(deriveOutcome(s))).map(student => ({
  academic_year: `${Number(student.batchYear) - 1}-${String(student.batchYear).slice(-2)}`,
  register_number: student.rollNumber,
  student_name: student.user?.name || '',
  programme: student.accreditation?.programme || student.user?.profile?.qualification?.[0]?.degree || '',
  department: student.department,
  progression_type: student.accreditation?.progression?.type || deriveOutcome(student),
  institution_joined: student.accreditation?.progression?.institutionJoined || '',
  programme_joined: student.accreditation?.progression?.programmeJoined || '',
  evidence_ref: student.accreditation?.progression?.evidenceUrl || '',
}));
const computeMetrics = (records, progression) => {
  const departments = [...new Set(records.map(r => r.department).filter(Boolean))].sort();
  const rows = departments.map(department => {
    const departmentRecords = records.filter(r => r.department === department);
    const placed = departmentRecords.filter(r => r.outcome === 'Placed');
    const higher = progression.filter(r => r.department === department && r.progression_type === 'Higher Studies').length;
    const exams = progression.filter(r => r.department === department && r.progression_type === 'Qualified Competitive Exam').length;
    const packages = placed.map(r => Number(r.package_lpa)).filter(value => value > 0);
    return { department, graduated: departmentRecords.length, placed: placed.length, placementPct: departmentRecords.length ? placed.length / departmentRecords.length : 0, higherStudies: higher, qualifiedExams: exams, progression: placed.length + higher + exams, progressionPct: departmentRecords.length ? (placed.length + higher + exams) / departmentRecords.length : 0, averagePackage: packages.length ? packages.reduce((a, b) => a + b, 0) / packages.length : 0, highestPackage: packages.length ? Math.max(...packages) : 0, medianPackage: median(packages) };
  });
  const allPackages = records.filter(r => r.outcome === 'Placed').map(r => Number(r.package_lpa)).filter(v => v > 0);
  const total = rows.reduce((acc, row) => ({ graduated: acc.graduated + row.graduated, placed: acc.placed + row.placed, higherStudies: acc.higherStudies + row.higherStudies, qualifiedExams: acc.qualifiedExams + row.qualifiedExams }), { graduated: 0, placed: 0, higherStudies: 0, qualifiedExams: 0 });
  total.progression = total.placed + total.higherStudies + total.qualifiedExams;
  total.placementPct = total.graduated ? total.placed / total.graduated : 0;
  total.progressionPct = total.graduated ? total.progression / total.graduated : 0;
  total.averagePackage = allPackages.length ? allPackages.reduce((a, b) => a + b, 0) / allPackages.length : 0;
  total.highestPackage = allPackages.length ? Math.max(...allPackages) : 0;
  total.medianPackage = median(allPackages);
  return { departments: rows, total };
};
const loadData = async (req) => {
  const college = await getCollege(req.user.id);
  const academicYear = req.query.academic_year || `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
  const passingYear = academicYearToPassingYear(academicYear);
  const departments = String(req.query.departments || '').split(',').map(v => v.trim()).filter(Boolean);
  const query = { college: college._id, ...(passingYear ? { batchYear: passingYear } : {}), ...(departments.length ? { department: { $in: departments } } : {}) };
  const students = await CollegeStudent.find(query).populate('user', 'name profile.qualification').populate('accreditation.placement.verifiedBy', 'name').sort({ department: 1, rollNumber: 1 });
  const records = buildRecords(students);
  const progression = buildProgression(students);
  return { college, academicYear, departments, records, progression, metrics: computeMetrics(records, progression) };
};

const getOverview = async (req, res) => {
  try {
    const data = await loadData(req);
    const claims = [...data.records.filter(r => r.outcome === 'Placed'), ...data.progression];
    res.json({ academicYear: data.academicYear, metrics: data.metrics, missingEvidence: claims.filter(r => !r.evidence_ref).length, claimCount: claims.length, recordCount: data.records.length });
  } catch (error) { res.status(error.status || 500).json({ msg: error.message }); }
};

const updateAccreditationRecord = async (req, res) => {
  try {
    const college = await getCollege(req.user.id);
    const student = await CollegeStudent.findOne({ _id: req.params.studentId, college: college._id });
    if (!student) return res.status(404).json({ msg: 'Student not found' });
    const body = req.body;
    if (!OUTCOMES.includes(body.outcome)) return res.status(400).json({ msg: 'Select a valid accreditation outcome' });
    const existing = student.accreditation?.toObject?.() || student.accreditation || {};
    const isProgression = ['Higher Studies', 'Qualified Competitive Exam'].includes(body.outcome);
    const uploadedUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const evidenceUrl = (!isProgression && uploadedUrl) || body.evidenceUrl || existing.placement?.evidenceUrl || '';
    const progressionEvidence = (isProgression && uploadedUrl) || body.progressionEvidenceUrl || existing.progression?.evidenceUrl || '';
    if (!student.rollNumber || !student.department || !student.batchYear || !body.gender || !body.programme) return res.status(400).json({ msg: 'Register number, department, passing year, gender and full programme name are required' });
    if (body.outcome === 'Placed' && (!body.employerName || !body.designation || !Number(body.packageLPA) || !body.offerDate || !body.offerSource || !evidenceUrl)) return res.status(400).json({ msg: 'Employer, designation, package, offer date, source and offer-letter evidence are required for a placed student' });
    if (body.outcome === 'Placed') {
      const canonicalEmployer = await Company.findOne({ name: { $regex: `^${String(body.employerName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }).select('name');
      if (!canonicalEmployer) return res.status(400).json({ msg: 'Select an employer from the canonical company list. Ask an administrator to add a missing employer.' });
      body.employerName = canonicalEmployer.name;
    }
    if (['Higher Studies', 'Qualified Competitive Exam'].includes(body.outcome) && (!body.institutionJoined || !body.programmeJoined || !progressionEvidence)) return res.status(400).json({ msg: 'Institution/exam, programme/result and evidence are required for progression claims' });
    student.accreditation = {
      gender: body.gender || '', programme: body.programme || '', outcome: body.outcome,
      placement: { employerName: body.employerName || '', employerCity: body.employerCity || '', designation: body.designation || '', packageLPA: Number(body.packageLPA) || 0, offerDate: body.offerDate || null, offerSource: body.offerSource || '', driveReference: body.driveReference || '', evidenceUrl, verifiedBy: body.outcome === 'Placed' ? req.user.id : null, verifiedOn: body.outcome === 'Placed' ? new Date() : null },
      progression: { type: ['Higher Studies', 'Qualified Competitive Exam'].includes(body.outcome) ? body.outcome : '', institutionJoined: body.institutionJoined || '', programmeJoined: body.programmeJoined || '', evidenceUrl: progressionEvidence }
    };
    student.placementStatus = body.outcome === 'Placed' ? 'placed' : (student.placementStatus === 'placed' ? 'unplaced' : student.placementStatus);
    await student.save();
    res.json({ msg: 'Accreditation record saved', accreditation: student.accreditation });
  } catch (error) { res.status(error.status || 500).json({ msg: error.message }); }
};

const searchEmployers = async (req, res) => {
  try {
    await getCollege(req.user.id);
    const search = String(req.query.search || '').trim();
    const companies = await Company.find(search ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {}).select('name location').sort({ name: 1 }).limit(30);
    res.json(companies);
  } catch (error) { res.status(error.status || 500).json({ msg: error.message }); }
};

const styleTitle = (sheet, title, subtitle, columns) => { sheet.mergeCells(1, 1, 1, columns); sheet.getCell('A1').value = title; sheet.getCell('A1').font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF131F38' } }; sheet.mergeCells(2, 1, 2, columns); sheet.getCell('A2').value = subtitle; sheet.getCell('A2').font = { name: 'Arial', size: 9, color: { argb: 'FF4A5674' } }; for (let i = 1; i <= columns; i++) sheet.getCell(3, i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9A63B' } }; };
const addTableHeader = (sheet, headers) => { const row = sheet.getRow(5); row.values = headers; row.height = 30; row.eachCell(cell => { cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF131F38' } }; cell.alignment = { vertical: 'middle', wrapText: true }; }); };

const buildWorkbook = async data => {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Velaivaaipu'; workbook.created = new Date();
  const legend = workbook.addWorksheet('Legend'); styleTitle(legend, 'Accreditation Export — how to read this file', `${data.college.name} · Academic year ${data.academicYear} · Generated by Velaivaaipu`, 2); legend.columns = [{ width: 30 }, { width: 96 }]; addTableHeader(legend,['Topic','Guidance']); [['Summary','Department-wise graduating strength, placement and progression metrics.'],['Placement Register','One row per graduating student, placed or not.'],['Progression','Higher studies and competitive examination records.'],['Employer Summary','Recruiting companies, offers and package range.'],['DVV Evidence Log','Every claim with evidence status; work missing evidence to zero.'],['Framework caveat','NAAC metric numbering is in transition. This export supplies stable underlying placement data; map it to the current SSR, AQAR, SAR or AICTE template.'],['Evidence','A placement or progression claim without supporting evidence should not be counted.'],['Median package','Calculated by the platform; regenerate after changing register data.']].forEach((values,index)=>{legend.getRow(index+6).values=values;});
  const summary = workbook.addWorksheet('Summary', { properties: { tabColor: { argb: 'FFE9A63B' } } });
  const registerHeaders = ['Sl. No.','Academic Year','Register Number','Name of the Student','Gender','Programme Graduated From','Department','Year of Passing','Outcome','Name of the Employer','Employer Location','Designation / Role','Package (Rs. lakh per annum)','Date of Offer','Source of Offer','Drive / Requisition Reference','Offer Letter on Record','Verified By','Verified On'];
  const evidenceLink = value => value ? { text: 'Open evidence', hyperlink: value.startsWith('http') ? value : `${process.env.API_PUBLIC_URL || 'http://localhost:5000'}${value}` } : '';
  const register = workbook.addWorksheet('Placement Register'); styleTitle(register,'Placement Register',`${data.college.name} · Academic year ${data.academicYear} · One row per graduating student`,19); addTableHeader(register,registerHeaders); data.records.forEach((r,i)=>register.addRow([i+1,r.academic_year,r.register_number,r.student_name,r.gender,r.programme,r.department,r.year_of_passing,r.outcome,r.employer_name,r.employer_city,r.designation,r.package_lpa,r.offer_date,r.offer_source,r.drive_reference,evidenceLink(r.evidence_ref),r.verified_by,r.verified_on])); register.autoFilter={from:'A5',to:`S${Math.max(5,data.records.length+5)}`}; register.views=[{state:'frozen',xSplit:3,ySplit:5}]; register.columns.forEach((c,i)=>c.width=[7,13,16,26,9,28,14,12,18,26,18,24,18,14,22,24,28,18,14][i]);
  const progression = workbook.addWorksheet('Progression'); styleTitle(progression,'Higher Studies and Competitive Examinations',`${data.college.name} · Academic year ${data.academicYear}`,10); addTableHeader(progression,['Sl. No.','Academic Year','Register Number','Name of the Student','Programme Graduated From','Department','Progression Type','Institution / Examination','Programme Joined / Result','Evidence on Record']); data.progression.forEach((r,i)=>progression.addRow([i+1,r.academic_year,r.register_number,r.student_name,r.programme,r.department,r.progression_type,r.institution_joined,r.programme_joined,evidenceLink(r.evidence_ref)])); progression.autoFilter={from:'A5',to:`J${Math.max(5,data.progression.length+5)}`}; progression.views=[{state:'frozen',xSplit:3,ySplit:5}]; progression.columns.forEach((c,i)=>c.width=[7,13,16,26,28,14,26,30,28,28][i]);
  styleTitle(summary,'Student Progression and Placement — Summary',`${data.college.name} · Academic year ${data.academicYear} · Live formulas over the register sheets`,11); addTableHeader(summary,['Department','Graduated','Placed','Placement %','Higher Studies','Qualified Exams','Total Progression','Progression %','Average Package (Rs. LPA)','Highest Package (Rs. LPA)','Median Package (Rs. LPA)']);
  const regLast=Math.max(6,data.records.length+5),progLast=Math.max(6,data.progression.length+5);
  data.metrics.departments.forEach((metric,index)=>{const rowNo=index+6;summary.addRow([metric.department,{formula:`COUNTIF('Placement Register'!$G$6:$G$${regLast},A${rowNo})`,result:metric.graduated},{formula:`COUNTIFS('Placement Register'!$G$6:$G$${regLast},A${rowNo},'Placement Register'!$I$6:$I$${regLast},"Placed")`,result:metric.placed},{formula:`IFERROR(C${rowNo}/B${rowNo},0)`,result:metric.placementPct},{formula:`COUNTIFS(Progression!$F$6:$F$${progLast},A${rowNo},Progression!$G$6:$G$${progLast},"Higher Studies")`,result:metric.higherStudies},{formula:`COUNTIFS(Progression!$F$6:$F$${progLast},A${rowNo},Progression!$G$6:$G$${progLast},"Qualified Competitive Exam")`,result:metric.qualifiedExams},{formula:`C${rowNo}+E${rowNo}+F${rowNo}`,result:metric.progression},{formula:`IFERROR(G${rowNo}/B${rowNo},0)`,result:metric.progressionPct},{formula:`IFERROR(AVERAGEIFS('Placement Register'!$M$6:$M$${regLast},'Placement Register'!$G$6:$G$${regLast},A${rowNo},'Placement Register'!$I$6:$I$${regLast},"Placed"),0)`,result:metric.averagePackage},{formula:`IFERROR(MAXIFS('Placement Register'!$M$6:$M$${regLast},'Placement Register'!$G$6:$G$${regLast},A${rowNo},'Placement Register'!$I$6:$I$${regLast},"Placed"),0)`,result:metric.highestPackage},metric.medianPackage]);});
  const totalRow=summary.rowCount+1,firstRow=6,lastDept=totalRow-1,t=data.metrics.total;summary.addRow(['INSTITUTION TOTAL',{formula:`SUM(B${firstRow}:B${lastDept})`,result:t.graduated},{formula:`SUM(C${firstRow}:C${lastDept})`,result:t.placed},{formula:`IFERROR(C${totalRow}/B${totalRow},0)`,result:t.placementPct},{formula:`SUM(E${firstRow}:E${lastDept})`,result:t.higherStudies},{formula:`SUM(F${firstRow}:F${lastDept})`,result:t.qualifiedExams},{formula:`SUM(G${firstRow}:G${lastDept})`,result:t.progression},{formula:`IFERROR(G${totalRow}/B${totalRow},0)`,result:t.progressionPct},{formula:`IFERROR(AVERAGEIF('Placement Register'!$I$6:$I$${regLast},"Placed",'Placement Register'!$M$6:$M$${regLast}),0)`,result:t.averagePackage},{formula:`IFERROR(MAXIFS('Placement Register'!$M$6:$M$${regLast},'Placement Register'!$I$6:$I$${regLast},"Placed"),0)`,result:t.highestPackage},t.medianPackage]); summary.columns.forEach((c,i)=>c.width=[26,12,10,14,16,16,18,15,22,22,22][i]); for(let r=6;r<=summary.rowCount;r++){summary.getCell(r,4).numFmt='0.0%';summary.getCell(r,8).numFmt='0.0%';for(const c of [9,10,11])summary.getCell(r,c).numFmt='0.00';summary.getCell(r,11).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF7E6'}};}
  const employers = workbook.addWorksheet('Employer Summary'); styleTitle(employers,'Recruiting Employers',`${data.college.name} · Academic year ${data.academicYear}`,6); addTableHeader(employers,['Employer','Offers Made','Departments Recruited From','Average Package (Rs. LPA)','Highest Package (Rs. LPA)','Source of Offers']); const employerMap={}; data.records.filter(r=>r.outcome==='Placed').forEach(r=>{const e=employerMap[r.employer_name] ||= {rows:[],departments:new Set(),sources:new Set()};e.rows.push(r);e.departments.add(r.department);e.sources.add(r.offer_source)}); Object.entries(employerMap).sort().forEach(([name,e])=>{const p=e.rows.map(r=>Number(r.package_lpa)).filter(Boolean);employers.addRow([name,e.rows.length,[...e.departments].join(', '),p.length?p.reduce((a,b)=>a+b,0)/p.length:0,p.length?Math.max(...p):0,[...e.sources].filter(Boolean).join(', ')])}); employers.columns.forEach((c,i)=>c.width=[34,14,42,22,22,28][i]);
  const dvv = workbook.addWorksheet('DVV Evidence Log'); styleTitle(dvv,'Evidence Log',`${data.college.name} · Academic year ${data.academicYear} · Work the missing list to zero`,6); addTableHeader(dvv,['Register Number','Name','Department','Claim Made','Evidence on Record','Status']); [...data.records.filter(r=>r.outcome==='Placed').map(r=>({...r,claim:`Placed — ${r.employer_name}`})),...data.progression.map(r=>({...r,claim:r.progression_type}))].forEach(r=>{const row=dvv.addRow([r.register_number,r.student_name,r.department,r.claim,r.evidence_ref||'NOT ON FILE',r.evidence_ref?'Complete':'MISSING']);if(!r.evidence_ref){row.getCell(6).font={bold:true,color:{argb:'FFB04A32'}};row.getCell(6).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFE4E1'}}}}); dvv.columns.forEach((c,i)=>c.width=[18,28,16,32,44,16][i]); dvv.autoFilter={from:'A5',to:`F${Math.max(5,dvv.rowCount)}`};
  workbook.eachSheet(sheet=>{sheet.pageSetup={orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};sheet.eachRow((row,rowNo)=>{if(rowNo>5)row.eachCell(cell=>{cell.font=cell.font?.bold?cell.font:{name:'Arial',size:9,color:{argb:cell.value?.formula?'FF000000':'FF0000FF'}};cell.alignment={vertical:'middle',wrapText:true};cell.border={top:{style:'thin',color:{argb:'FFC9CFD9'}},left:{style:'thin',color:{argb:'FFC9CFD9'}},bottom:{style:'thin',color:{argb:'FFC9CFD9'}},right:{style:'thin',color:{argb:'FFC9CFD9'}}}})});});
  return workbook;
};

const exportAccreditation = async (req, res) => {
  try {
    const data = await loadData(req); const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    await AccreditationExportLog.create({ college:data.college._id,exportedBy:req.user.id,academicYear:data.academicYear,departments:data.departments,format,recordCount:data.records.length });
    const filename=`${data.college.code||'college'}_accreditation_${data.academicYear}.${format}`;
    res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
    if(format==='csv'){const keys=['academic_year','register_number','student_name','gender','programme','department','year_of_passing','outcome','employer_name','employer_city','designation','package_lpa','offer_date','offer_source','drive_reference','evidence_ref','verified_by','verified_on'];res.type('text/csv').send([keys.join(','),...data.records.map(r=>keys.map(k=>csvEscape(r[k] instanceof Date?r[k].toISOString().slice(0,10):r[k])).join(','))].join('\n'));return;}
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); const workbook=await buildWorkbook(data); await workbook.xlsx.write(res); res.end();
  } catch(error){if(!res.headersSent)res.status(error.status||500).json({msg:error.message});}
};

const PLACEMENT_IMPORT_FIELDS = ['academic_year','register_number','student_name','gender','programme','department','year_of_passing','outcome','employer_name','employer_city','designation','package_lpa','offer_date','offer_source','drive_reference','evidence_ref','verified_by','verified_on'];
const PROGRESSION_IMPORT_FIELDS = ['academic_year','register_number','student_name','programme','department','progression_type','institution_joined','programme_joined','evidence_ref'];
const normalizeOfferSource = value => {
  const source = String(value || '').trim().toLowerCase();
  if (source.startsWith('campus drive')) return 'Campus drive';
  if (source === 'pool campus drive') return 'Pool campus drive';
  if (source.startsWith('off-campus')) return 'Off-campus, verified';
  if (source === 'platform application') return 'Platform application';
  return '';
};

const getImportTemplate = async (req, res) => {
  const type = req.params.type === 'progression' ? 'progression' : 'placement';
  const fields = type === 'progression' ? PROGRESSION_IMPORT_FIELDS : PLACEMENT_IMPORT_FIELDS;
  res.type('text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="accreditation_${type}_template.csv"`);
  res.send(`${fields.join(',')}\n`);
};

const readImportRows = (buffer, requiredFields) => {
  const rows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });
  if (!rows.length) throw Object.assign(new Error('The CSV has no data rows'), { status: 400 });
  const headers = Object.keys(rows[0]);
  const missing = requiredFields.filter(field => !headers.includes(field));
  if (missing.length) throw Object.assign(new Error(`Missing CSV columns: ${missing.join(', ')}`), { status: 400 });
  return rows;
};

const importPlacementCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Choose a placement CSV file' });
    const college = await getCollege(req.user.id);
    const rows = readImportRows(req.file.buffer, PLACEMENT_IMPORT_FIELDS);
    const companies = await Company.find({}).select('name');
    const canonicalNames = new Map(companies.map(company => [company.name.toLowerCase(), company.name]));
    const registerNumbers = rows.map(row => row.register_number).filter(Boolean);
    const students = await CollegeStudent.find({ college: college._id, rollNumber: { $in: registerNumbers } });
    const studentMap = new Map(students.map(student => [student.rollNumber.toLowerCase(), student]));
    const result = { totalRows: rows.length, imported: 0, unmatched: 0, failed: 0, warnings: 0, issues: [] };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;
      const student = studentMap.get(String(row.register_number || '').toLowerCase());
      if (!student) { result.unmatched += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'No student with this register number exists in the college' }); continue; }
      if (!OUTCOMES.includes(row.outcome)) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: `Invalid outcome: ${row.outcome}` }); continue; }
      if (!row.gender || !row.programme || !row.department || !row.year_of_passing) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'Gender, programme, department and year_of_passing are required' }); continue; }

      let employerName = '';
      const offerSource = normalizeOfferSource(row.offer_source);
      if (row.outcome === 'Placed') {
        employerName = canonicalNames.get(String(row.employer_name || '').toLowerCase()) || '';
        if (!employerName) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: `Employer "${row.employer_name}" is not in the canonical company list` }); continue; }
        if (!row.designation || !Number(row.package_lpa) || !row.offer_date || !offerSource) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'Placed rows require designation, package_lpa, offer_date and a valid offer_source' }); continue; }
        if (!row.evidence_ref) { result.warnings += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'Imported, but offer-letter evidence is missing and will appear in the DVV Evidence Log' }); }
      }

      student.department = row.department;
      student.batchYear = Number(row.year_of_passing);
      student.accreditation = {
        gender: row.gender,
        programme: row.programme,
        outcome: row.outcome,
        placement: {
          employerName,
          employerCity: row.outcome === 'Placed' ? row.employer_city : '',
          designation: row.outcome === 'Placed' ? row.designation : '',
          packageLPA: row.outcome === 'Placed' ? Number(row.package_lpa) : 0,
          offerDate: row.outcome === 'Placed' ? row.offer_date : null,
          offerSource: row.outcome === 'Placed' ? offerSource : '',
          driveReference: row.outcome === 'Placed' ? row.drive_reference : '',
          evidenceUrl: row.outcome === 'Placed' ? row.evidence_ref : '',
          verifiedBy: row.outcome === 'Placed' ? req.user.id : null,
          verifiedOn: row.outcome === 'Placed' ? (row.verified_on || new Date()) : null,
        },
        progression: student.accreditation?.progression || {},
      };
      student.placementStatus = row.outcome === 'Placed' ? 'placed' : (student.placementStatus === 'placed' ? 'unplaced' : student.placementStatus);
      try { await student.save(); result.imported += 1; }
      catch (error) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: error.message }); }
    }
    res.json({ msg: `Imported ${result.imported} of ${result.totalRows} placement rows`, ...result });
  } catch (error) { res.status(error.status || 500).json({ msg: error.message }); }
};

const importProgressionCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Choose a progression CSV file' });
    const college = await getCollege(req.user.id);
    const rows = readImportRows(req.file.buffer, PROGRESSION_IMPORT_FIELDS);
    const registerNumbers = rows.map(row => row.register_number).filter(Boolean);
    const students = await CollegeStudent.find({ college: college._id, rollNumber: { $in: registerNumbers } });
    const studentMap = new Map(students.map(student => [student.rollNumber.toLowerCase(), student]));
    const result = { totalRows: rows.length, imported: 0, unmatched: 0, failed: 0, warnings: 0, issues: [] };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;
      const student = studentMap.get(String(row.register_number || '').toLowerCase());
      if (!student) { result.unmatched += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'No student with this register number exists in the college' }); continue; }
      if (!['Higher Studies', 'Qualified Competitive Exam'].includes(row.progression_type)) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: `Invalid progression_type: ${row.progression_type}` }); continue; }
      if (!row.institution_joined || !row.programme_joined) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'institution_joined and programme_joined are required' }); continue; }
      if (!row.evidence_ref) { result.warnings += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: 'Imported, but progression evidence is missing and will appear in the DVV Evidence Log' }); }
      student.department = row.department || student.department;
      student.batchYear = academicYearToPassingYear(row.academic_year) || student.batchYear;
      const existingPlacement = student.accreditation?.placement?.toObject?.() || student.accreditation?.placement || {};
      student.accreditation = {
        gender: student.accreditation?.gender || '',
        programme: row.programme || student.accreditation?.programme || '',
        outcome: row.progression_type,
        placement: existingPlacement,
        progression: { type: row.progression_type, institutionJoined: row.institution_joined, programmeJoined: row.programme_joined, evidenceUrl: row.evidence_ref || '' },
      };
      if (student.placementStatus === 'placed') student.placementStatus = 'unplaced';
      try { await student.save(); result.imported += 1; }
      catch (error) { result.failed += 1; result.issues.push({ row: rowNumber, registerNumber: row.register_number, issue: error.message }); }
    }
    res.json({ msg: `Imported ${result.imported} of ${result.totalRows} progression rows`, ...result });
  } catch (error) { res.status(error.status || 500).json({ msg: error.message }); }
};

module.exports={getOverview,updateAccreditationRecord,exportAccreditation,searchEmployers,getImportTemplate,importPlacementCsv,importProgressionCsv,_test:{buildWorkbook,computeMetrics}};
