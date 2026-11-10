// Ready-made course lists a college can start from. The college can still add or remove any course afterwards.
export const COLLEGE_TYPES = [
  { key: 'arts-science', label: 'Arts & Science', departments: [
    { name: 'B.A. English', code: 'BA-ENG' }, { name: 'B.A. Tamil', code: 'BA-TAM' }, { name: 'B.Sc. Computer Science', code: 'BSC-CS' },
    { name: 'B.Sc. Mathematics', code: 'BSC-MAT' }, { name: 'B.Sc. Physics', code: 'BSC-PHY' }, { name: 'B.Sc. Chemistry', code: 'BSC-CHE' },
    { name: 'B.Com.', code: 'BCOM' }, { name: 'B.B.A.', code: 'BBA' }, { name: 'B.C.A.', code: 'BCA' },
    { name: 'M.A.', code: 'MA' }, { name: 'M.Sc.', code: 'MSC' }, { name: 'M.Com.', code: 'MCOM' } ] },
  { key: 'engineering', label: 'Engineering', departments: [
    { name: 'Computer Science', code: 'CS' }, { name: 'Information Technology', code: 'IT' }, { name: 'Electronics & Communication', code: 'ECE' },
    { name: 'Electrical & Electronics', code: 'EEE' }, { name: 'Mechanical Engineering', code: 'MECH' }, { name: 'Civil Engineering', code: 'CIVIL' } ] },
  { key: 'polytechnic-iti', label: 'Polytechnic & ITI', departments: [
    { name: 'Mechanical', code: 'DME' }, { name: 'Electrical', code: 'DEEE' }, { name: 'Electronics', code: 'DECE' },
    { name: 'Civil', code: 'DCE' }, { name: 'Computer', code: 'DCSE' }, { name: 'ITI Trades', code: 'ITI' } ] },
  { key: 'nursing-paramedical', label: 'Nursing & Paramedical', departments: [
    { name: 'B.Sc. Nursing', code: 'BSC-NUR' }, { name: 'GNM Nursing', code: 'GNM' }, { name: 'Medical Lab Technology', code: 'DMLT' },
    { name: 'Pharmacy', code: 'PHARM' }, { name: 'Physiotherapy', code: 'PHYSIO' }, { name: 'Radiology', code: 'RAD' } ] },
  { key: 'management', label: 'Management', departments: [
    { name: 'M.B.A. Finance', code: 'MBA-FIN' }, { name: 'M.B.A. Marketing', code: 'MBA-MKT' }, { name: 'M.B.A. HR', code: 'MBA-HR' },
    { name: 'M.B.A. Operations', code: 'MBA-OPS' }, { name: 'B.B.A.', code: 'BBA' }, { name: 'M.C.A.', code: 'MCA' } ] },
];
export const departmentHint = (departments = []) =>
  departments.length ? departments.slice(0, 4).map((d) => d.code || d.name).join(', ') : 'BCA, BSc, BCom, MBA';
