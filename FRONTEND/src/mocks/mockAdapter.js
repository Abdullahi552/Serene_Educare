/**
 * In-memory fake backend used when VITE_USE_MOCK=true (demo / UI development).
 * It implements the same contract as docs/BACKEND_API_CONTRACT.md, so it doubles as a runnable
 * reference for the backend developer. Data resets on page reload.
 */
import { AxiosError } from 'axios';

/* ------------------------------ helpers ------------------------------ */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const parseDay = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const ago = (ms) => new Date(Date.now() - ms).toISOString();

class HttpErr extends Error { constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; } }
const fieldErr = (status, message, errors) => new HttpErr(status, message, { errors });

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261102);
const pickOne = (a) => a[Math.floor(rnd() * a.length)];
const rint = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const paginate = (arr, page = 1, limit = 20) => {
  page = Math.max(1, Number(page) || 1); limit = Math.min(500, Math.max(1, Number(limit) || 20));
  return { data: arr.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: arr.length, totalPages: Math.max(1, Math.ceil(arr.length / limit)) } };
};

/** Tiny valid PDF so the "download" flows produce a real file in demo mode. */
function makePdf(title, lines) {
  const esc = (s) => String(s).replace(/[()\\]/g, '\\$&');
  const content = ['BT', '/F1 16 Tf', '50 780 Td', `(${esc(title)}) Tj`, '/F1 11 Tf', ...lines.flatMap((l) => ['0 -18 Td', `(${esc(l)}) Tj`]), 'ET'].join('\n');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

/* -------------------------------- seed -------------------------------- */
const now = new Date();
const REPORT_TYPES = { incident_summary: 'Monthly Incident Summary', student_allergies: 'Student Allergies List', activity_log: 'Health Activity Log', hygiene_compliance: 'Hygiene Compliance Report' };

function seed() {
  const db = {
    seq: { incident: 1, activity: 1, report: 3, convo: 1, msg: 1, attach: 1, request: 1 },
    read: new Set(),
    school: {
      id: 1, name: 'Nectar Schools', schoolCode: 'DST-8842', logoUrl: null, physicalAddress: 'Block 2-3, Anthony Street, Lagos Island, Lagos', mailingAddress: '', mailingSameAsPhysical: false,
      contact: { name: 'Busola Alao', jobTitle: 'School Health Manager', healthOfficePhone: '+234 803 555 0100', emergencyEmail: 'health@nectarschools.com.ng' },
      notifications: { dailyReport: { enabled: true, time: '08:00' }, emergencySms: { enabled: true }, weeklyDigest: { enabled: false } },
    },
    users: [
      { id: 1, name: 'Busola Alao', email: 'admin1@nectarschools.com', password: 'password123', role: 'school_admin', title: 'School Health Manager', status: 'active', lastActiveAt: ago(30000) },
      { id: 2, name: 'Sarah Adebayo', email: 'adebayo.s@nectarschools.com.ng', password: 'x', role: 'principal', status: 'active', lastActiveAt: ago(2 * 3600e3) },
      { id: 3, name: 'Mike Balogun', email: 'balogun.m@nectarschools.com.ng', password: 'x', role: 'school_nurse', status: 'offline', lastActiveAt: ago(26 * 3600e3) },
      { id: 4, name: 'Wasilat Sadiq', email: 'sadiq.w@nectarschools.com.ng', password: 'x', role: 'counselor', status: 'active', lastActiveAt: ago(3 * 3600e3) },
      { id: 5, name: 'David Akanfe', email: 'akanfe.d@nectarschools.com.ng', password: 'x', role: 'teacher', status: 'active', lastActiveAt: ago(5 * 3600e3) },
      { id: 6, name: 'Elizabeth John', email: 'john.e@nectarschools.com.ng', password: 'x', role: 'school_admin', status: 'offline', lastActiveAt: ago(3 * 86400e3) },
    ],
    students: [], incidents: [], activities: [], reports: [], convos: [], requests: [], courses: [], events: [],
  };
  const roles = ['teacher', 'teacher', 'school_nurse', 'teacher', 'counselor'];
  const first = ['Ada', 'Bola', 'Chike', 'Dayo', 'Efe', 'Funmi', 'Gbenga', 'Hauwa', 'Ife', 'Jide', 'Kemi', 'Lola', 'Musa', 'Nneka', 'Ola', 'Pelumi', 'Rita', 'Seun'];
  for (let i = 0; i < 18; i++) db.users.push({ id: 7 + i, name: `${first[i]} ${pickOne(['Okoro', 'Lawal', 'Bakare', 'Eze', 'Danjuma'])}`, email: `${first[i].toLowerCase()}@nectarschools.com.ng`, password: 'x', role: pickOne(roles), status: rnd() < 0.5 ? 'active' : 'offline', lastActiveAt: ago(rint(1, 200) * 3600e3) });

  const names = [['Femi Sanusi', 41325, 'JSS 1'], ['Mariam Balogun', 41102, 'Basic 5'], ['Sarah John', 40877, 'Basic 2'], ['Chidi Okafor', 41990, 'JSS 2'], ['Aminu Bello', 40231, 'SS 1'], ['Zainab Yusuf', 42018, 'Basic 3'], ['Tunde Adeyemi', 41560, 'JSS 3'], ['Ngozi Eze', 40654, 'Basic 4'], ['Ibrahim Musa', 41877, 'SS 2'], ['Halima Abdullahi', 40399, 'Basic 1'], ['Emeka Nwosu', 41443, 'JSS 2'], ['Fatima Sani', 42201, 'Basic 5'], ['David Okon', 40912, 'SS 3'], ['Blessing Udo', 41678, 'Basic 6'], ['Samuel Adeoye', 42055, 'JSS 1'], ['Amara Obi', 41234, 'Basic 2']];
  names.forEach(([name, admissionNo, className], i) => db.students.push({ id: i + 1, name, admissionNo: String(admissionNo), className }));

  // incidents over ~45 days
  const summaries = { injury: ['Scraped Knee', 'Sprained Ankle', 'Cut on Hand', 'Bruised Elbow'], illness: ['Fever (101°F)', 'Headache', 'Stomach Ache', 'Nosebleed'], safety: ['Slippery Floor', 'Broken Swing', 'Loose Railing'], medication: ['Daily Medication'] };
  const locs = ['Playground', 'Playground', 'Sports Field', 'Classroom', 'Cafeteria', 'Hallway'];
  const aid = ['ice_pack', 'bandage_dressing', 'cleaned_wound', 'observation_rest', 'parent_contacted'];
  const tmp = [];
  for (let d = 44; d >= 0; d--) {
    const n = d === 0 ? 8 : rint(2, 7);
    for (let k = 0; k < n; k++) {
      let when;
      if (d === 0) { const since = now.getHours() * 60 + now.getMinutes(); if (since < 15) continue; when = new Date(now.getTime() - rint(3, Math.max(5, since - 5)) * 60000); }
      else { when = addDays(now, -d); when.setHours(rint(8, 15), rint(0, 59), 0, 0); }
      const type = pickOne(['injury', 'injury', 'illness', 'illness', 'safety', 'medication']);
      const old = d > 3;
      const status = type === 'medication' ? 'administered' : old ? pickOne(['treated', 'treated', 'sent_home', 'closed']) : pickOne(['open', 'treated', 'sent_home', 'open']);
      tmp.push({ when, type, status });
    }
  }
  tmp.sort((a, b) => a.when - b.when).forEach((t) => {
    const s = pickOne(db.students);
    const id = db.seq.incident++;
    db.incidents.push({
      id, reference: `INC-${String(id).padStart(6, '0')}`, studentId: s.id, type: t.type, summary: pickOne(summaries[t.type]), location: t.type === 'medication' ? 'Sick Bay' : pickOne(locs),
      occurredAt: t.when.toISOString(), description: 'Reported by the class teacher and attended to in the sick bay. Student was calm and responsive.', firstAid: t.type === 'medication' ? [] : [pickOne(aid), pickOne(aid)].filter((v, i, a) => a.indexOf(v) === i),
      notifyParent: rnd() < 0.5, status: t.status, isDraft: false, reportedById: pickOne([1, 3]), attachments: [], createdAt: t.when.toISOString(),
    });
  });

  // activities
  const A = (title, category, back, assigneeId, status) => ({ id: db.seq.activity++, title, category, date: dayKey(addDays(now, -back)), assigneeId, status, notes: null });
  db.activities = [
    A('Monthly Water Tank Cleaning', 'hygiene', 3, 5, 'completed'), A('Fire Extinguisher Inspection', 'safety', 9, 2, 'pending'), A('Hand-washing Station Check', 'hygiene', 2, 5, 'completed'),
    A('Balanced Diet Session (JSS)', 'nutrition', -1, 4, 'pending'), A('Cafeteria Hygiene Audit', 'hygiene', 12, 6, 'completed'), A('Gym Equipment Safety Audit', 'safety', 6, 3, 'pending'),
    A('Dental Camp', 'event', -3, 1, 'pending'), A('Eye Screening Day', 'event', -6, 3, 'pending'), A('Healthy Snacks Workshop', 'nutrition', 15, 4, 'completed'), A('Playground Safety Walk', 'safety', 20, 2, 'completed'),
    A('Classroom Sanitation Drive', 'hygiene', 25, 5, 'completed'), A('Nutrition Plan Review', 'nutrition', 30, 1, 'completed'), A('Health Talk: Puberty & Hygiene', 'event', 35, 4, 'completed'),
  ];

  db.reports = [
    { id: 1, type: 'incident_summary', name: 'Monthly Incident Summary', format: 'pdf', sizeBytes: 2.4 * 1048576 | 0, createdAt: ago(32 * 86400e3), from: dayKey(addDays(now, -60)), to: dayKey(addDays(now, -31)) },
    { id: 2, type: 'student_allergies', name: 'Student Allergies List', format: 'csv', sizeBytes: 145 * 1024, createdAt: ago(40 * 86400e3), from: dayKey(addDays(now, -70)), to: dayKey(addDays(now, -41)) },
  ];

  const C = (id, title, description, type, durationMinutes, mandatory, status, progressPercent, contentUrl = null) => ({ id, title, description, type, durationMinutes, mandatory, status, progressPercent, contentUrl, completedAt: status === 'completed' ? ago(id * 86400e3) : null });
  db.courses = [
    C(1, 'First Aid Basics', 'Essential life-saving techniques for the classroom including CPR, choking and wound care.', 'video', 45, true, 'in_progress', 60, 'https://www.redcross.org/take-a-class/first-aid'),
    C(2, 'School Safety 101', 'Protocols for maintaining a secure environment and visitor management.', 'module', 30, true, 'completed', 100),
    C(3, 'Child Health & Hygiene', 'Understanding common childhood illnesses and hygiene practice in school.', 'presentation', 60, true, 'completed', 100),
    C(4, 'Emergency Response', 'Step-by-step actions for critical incidents and evacuation plans.', 'guide', 15, true, 'completed', 100),
    C(5, 'Nutrition Basics for Schools', 'Planning balanced meals and handling food allergies in the cafeteria.', 'module', 40, false, 'not_started', 0),
    C(6, 'Mental Health Awareness', 'Spotting early signs of distress and supporting students and staff.', 'presentation', 50, false, 'not_started', 0),
    C(7, 'Allergy Management Guide', 'Policy template and checklist for managing student allergies and anaphylaxis.', 'document', 20, false, 'not_started', 0),
    C(8, 'Infection Control Checklist', 'Daily and termly checklist for preventing the spread of infections.', 'guide', 25, false, 'not_started', 0),
  ];
  const ev = (id, title, d, h, location) => { const x = addDays(now, d); x.setHours(h, 0, 0, 0); return { id, title, startsAt: x.toISOString(), location }; };
  db.events = [ev(1, 'CPR Refresher', 2, 10, 'Staff Room A'), ev(2, 'Allergy Awareness Briefing', 6, 13, 'Main Hall'), ev(3, 'Hygiene Champions Workshop', 12, 11, 'Library')];
  return db;
}
const db = seed();

/* ------------------------- shared calculations ------------------------- */
const userById = (id) => db.users.find((u) => u.id === Number(id));
const studentRef = (id) => { const s = db.students.find((x) => x.id === id); return { id: s.id, name: s.name, className: s.className, admissionNo: s.admissionNo }; };
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, title: u.title || null, avatarUrl: null, school: { id: db.school.id, name: db.school.name, logoUrl: db.school.logoUrl } });
const incidentOut = (i, full = false) => {
  const { studentId, reportedById, ...rest } = i;
  const out = { ...rest, student: studentRef(studentId), reportedBy: { id: reportedById, name: userById(reportedById)?.name } };
  if (!full) { delete out.description; delete out.attachments; }
  return out;
};
const real = () => db.incidents.filter((i) => !i.isDraft);
const between = (list, from, to, key = 'occurredAt') => list.filter((i) => { const t = new Date(i[key]).getTime(); return t >= from.getTime() && t <= to.getTime(); });
const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 100) : 0);
const activityOut = (a) => { const { assigneeId, ...r } = a; return { ...r, assignee: assigneeId ? { id: assigneeId, name: userById(assigneeId)?.name } : null }; };
const courseOut = (c) => ({ ...c });

/* ------------------------------- routes ------------------------------- */
const routes = [];
const on = (method, pattern, handler, { auth = true } = {}) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler, auth });
const ok = (data, status = 200) => ({ data, status });

// ---- auth (public)
on('POST', '/auth/login', ({ body }) => {
  const u = db.users.find((x) => x.email.toLowerCase() === String(body.email || '').trim().toLowerCase() && x.password === body.password);
  if (!u) throw new HttpErr(401, 'Invalid email or password.');
  u.lastActiveAt = new Date().toISOString(); u.status = 'active';
  return ok({ token: `mock.${u.id}`, user: publicUser(u) });
}, { auth: false });
on('POST', '/auth/forgot-password', () => ok(null, 204), { auth: false });
on('POST', '/auth/reset-password', ({ body }) => {
  if (!body.token) throw new HttpErr(400, 'This reset link is invalid or has expired.');
  if (!body.newPassword || body.newPassword.length < 8) throw fieldErr(422, 'Password is too short.', { newPassword: 'Use at least 8 characters.' });
  return ok(null, 204);
}, { auth: false });
on('POST', '/onboarding-requests', ({ body }) => {
  const e = {};
  if (!body.schoolName) e.schoolName = 'School name is required.';
  if (!body.email) e.email = 'Email is required.';
  if (Object.keys(e).length) throw fieldErr(422, 'Please fix the highlighted fields.', e);
  db.requests.push({ id: db.seq.request++, ...body });
  return ok({ id: db.seq.request - 1 }, 201);
}, { auth: false });
on('POST', '/auth/logout', () => ok(null, 204));
on('GET', '/auth/me', ({ user }) => ok(publicUser(user)));

// ---- dashboard
on('GET', '/dashboard', () => {
  const today = real().filter((i) => new Date(i.occurredAt) >= startOfDay(now));
  const yday = between(real(), startOfDay(addDays(now, -1)), endOfDay(addDays(now, -1)));
  const med = (list) => list.filter((i) => i.status === 'administered').length;
  const recent = [...real()].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)).slice(0, 3);
  return ok({
    stats: {
      clinicVisitsToday: { value: today.length, changePercent: pct(today.length, yday.length) },
      openCases: { value: real().filter((i) => i.status === 'open').length },
      medicationDispensed: { value: med(today), changePercent: pct(med(today), med(yday)) },
    },
    recentIncidents: recent.map((i) => ({ id: i.id, studentName: studentRef(i.studentId).name, summary: i.summary, className: studentRef(i.studentId).className, type: i.type, status: i.status, occurredAt: i.occurredAt })),
    weeklyActivity: Array.from({ length: 7 }, (_, k) => { const d = addDays(now, k - 6); return { date: dayKey(d), count: between(real(), startOfDay(d), endOfDay(d)).length }; }),
    upcomingTrainings: db.events.filter((e) => new Date(e.startsAt) > now).slice(0, 3),
  });
});

// ---- students
on('GET', '/students', ({ params: q }) => {
  let list = [...db.students];
  if (q.search) { const s = String(q.search).toLowerCase().replace('#', ''); list = list.filter((x) => x.name.toLowerCase().includes(s) || x.admissionNo.includes(s)); }
  return ok(paginate(list, q.page, q.limit));
});
on('GET', '/students/:id', ({ groups }) => { const s = db.students.find((x) => x.id === Number(groups.id)); if (!s) throw new HttpErr(404, 'Student not found.'); return ok(s); });

// ---- activities
on('GET', '/activities/overview', () => {
  const a = db.activities;
  const days = (iso) => Math.round((startOfDay(now) - parseDay(iso)) / 86400e3);
  const lastHyg = a.filter((x) => x.category === 'hygiene' && x.status === 'completed').sort((x, y) => y.date.localeCompare(x.date))[0];
  const nextNut = a.filter((x) => x.category === 'nutrition' && x.status === 'pending').sort((x, y) => x.date.localeCompare(y.date))[0];
  const overdue = a.filter((x) => x.category === 'safety' && x.status === 'pending' && days(x.date) > 0)[0];
  const nextEvent = a.filter((x) => x.category === 'event' && x.status === 'pending').sort((x, y) => x.date.localeCompare(y.date))[0];
  const rel = (n) => (n === 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago`);
  return ok({
    stats: {
      totalActivities: { value: a.length * 11 + 9, changePercent: 12 },
      pendingAudits: { value: a.filter((x) => x.category === 'safety' && x.status === 'pending').length },
      upcomingEvents: { value: a.filter((x) => x.category === 'event' && x.status === 'pending' && days(x.date) <= 0 && days(x.date) >= -7).length },
      nutritionSessions: { value: a.filter((x) => x.category === 'nutrition').length * 4, changePercent: 5 },
    },
    categories: [
      { category: 'hygiene', title: 'Hygiene Log', subtitle: lastHyg ? `Latest check: ${rel(days(lastHyg.date))}` : 'No checks yet', alert: false },
      { category: 'nutrition', title: 'Nutrition Plan', subtitle: nextNut ? `Next session: ${days(nextNut.date) === -1 ? 'Tomorrow' : nextNut.date}` : 'Nothing scheduled', alert: false },
      { category: 'safety', title: 'Safety Checklist', subtitle: overdue ? `Audit Overdue: ${overdue.title.replace(/ (Safety )?(Audit|Inspection)$/, '')}` : 'All audits on time', alert: Boolean(overdue) },
      { category: 'event', title: 'Health Talks', subtitle: nextEvent ? `Upcoming: ${nextEvent.title}` : 'Nothing scheduled', alert: false },
    ],
  });
});
on('GET', '/activities', ({ params: q }) => {
  let list = [...db.activities];
  if (q.category) list = list.filter((a) => a.category === q.category);
  if (q.status) list = list.filter((a) => a.status === q.status);
  if (q.search) list = list.filter((a) => a.title.toLowerCase().includes(String(q.search).toLowerCase()));
  list.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const r = paginate(list, q.page, q.limit);
  return ok({ ...r, data: r.data.map(activityOut) });
});
const checkActivity = (b, partial) => {
  const e = {};
  if ((!partial || 'title' in b) && !String(b.title || '').trim()) e.title = 'Name is required.';
  if ((!partial || 'date' in b) && !/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) e.date = 'Date is required (yyyy-mm-dd).';
  if (Object.keys(e).length) throw fieldErr(422, 'Please fix the highlighted fields.', e);
};
on('POST', '/activities', ({ body }) => { checkActivity(body, false); const a = { id: db.seq.activity++, notes: null, assigneeId: null, status: 'pending', ...body }; db.activities.push(a); return ok(activityOut(a), 201); });
on('PUT', '/activities/:id', ({ body, groups }) => { const a = db.activities.find((x) => x.id === Number(groups.id)); if (!a) throw new HttpErr(404, 'Activity not found.'); checkActivity(body, true); Object.assign(a, body); return ok(activityOut(a)); });
on('DELETE', '/activities/:id', ({ groups }) => { const i = db.activities.findIndex((x) => x.id === Number(groups.id)); if (i < 0) throw new HttpErr(404, 'Activity not found.'); db.activities.splice(i, 1); return ok(null, 204); });

// ---- incidents
on('GET', '/incidents', ({ params: q }) => {
  let list = [...db.incidents];
  if (q.type) list = list.filter((i) => i.type === q.type);
  if (q.status) list = list.filter((i) => i.status === q.status);
  if (q.search) { const s = String(q.search).toLowerCase(); list = list.filter((i) => i.reference.toLowerCase().includes(s) || studentRef(i.studentId).name.toLowerCase().includes(s)); }
  list.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  const r = paginate(list, q.page, q.limit);
  return ok({ ...r, data: r.data.map((i) => incidentOut(i)) });
});
on('GET', '/incidents/:id', ({ groups }) => { const i = db.incidents.find((x) => x.id === Number(groups.id)); if (!i) throw new HttpErr(404, 'Report not found.'); return ok(incidentOut(i, true)); });
on('POST', '/incidents', ({ body, user }) => {
  if (!db.students.some((s) => s.id === Number(body.studentId))) throw fieldErr(422, 'Choose a student.', { studentId: 'Choose a student.' });
  if (!['injury', 'illness', 'safety'].includes(body.type)) throw fieldErr(422, 'Choose the type of incident.', { type: 'Choose the type of incident.' });
  if (!body.isDraft) {
    const e = {};
    if (!body.location) e.location = 'Select where it happened.';
    if (!body.occurredAt) e.occurredAt = 'Enter when it happened.';
    if (!body.description || body.description.trim().length < 10) e.description = 'Describe what happened (at least 10 characters).';
    if (Object.keys(e).length) throw fieldErr(422, 'Please fix the highlighted fields.', e);
  }
  const id = db.seq.incident++;
  const i = {
    id, reference: `INC-${String(id).padStart(6, '0')}`, studentId: Number(body.studentId), type: body.type, summary: (body.description || body.type).trim().slice(0, 40), location: body.location || null,
    occurredAt: body.occurredAt || new Date().toISOString(), description: body.description || null, firstAid: body.firstAid || [], notifyParent: !!body.notifyParent, status: 'open', isDraft: !!body.isDraft,
    reportedById: user.id, attachments: [], createdAt: new Date().toISOString(),
  };
  db.incidents.push(i);
  return ok(incidentOut(i, true), 201);
});
on('PUT', '/incidents/:id', ({ body, groups }) => {
  const i = db.incidents.find((x) => x.id === Number(groups.id));
  if (!i) throw new HttpErr(404, 'Report not found.');
  const { status, description, location, occurredAt, firstAid, notifyParent, type, isDraft } = body;
  Object.entries({ status, description, location, occurredAt, firstAid, notifyParent, type, isDraft }).forEach(([k, v]) => { if (v !== undefined) i[k] = v; });
  return ok(incidentOut(i, true));
});
on('POST', '/incidents/:id/attachments', ({ body, groups }) => {
  const i = db.incidents.find((x) => x.id === Number(groups.id));
  if (!i) throw new HttpErr(404, 'Report not found.');
  const file = body.get('file');
  const att = { id: db.seq.attach++, name: file.name, url: URL.createObjectURL(file), sizeBytes: file.size };
  i.attachments.push(att);
  return ok(att, 201);
});

// ---- reports
on('GET', '/reports/insights', ({ params: q }) => {
  const from = startOfDay(parseDay(q.from || dayKey(addDays(now, -29)))); const to = endOfDay(parseDay(q.to || dayKey(now)));
  const span = Math.max(1, Math.round((to - from) / 86400e3));
  const cur = between(real(), from, to);
  const prev = between(real(), addDays(from, -span), addDays(from, -1));
  const aidCount = (l) => l.filter((i) => i.firstAid.length).length;
  const sick = (l) => l.filter((i) => i.type === 'illness' && i.status === 'sent_home').length * 2;
  const days = Math.min(span, 31);
  const daily = Array.from({ length: days }, (_, k) => { const d = addDays(to, k - days + 1); return { date: dayKey(d), value: between(real(), startOfDay(d), endOfDay(d)).length }; });
  const weekly = []; for (let w = 0; w < daily.length; w += 7) weekly.push({ label: `Wk ${weekly.length + 1}`, value: daily.slice(w, w + 7).reduce((s, x) => s + x.value, 0) });
  const byLoc = {}; cur.forEach((i) => { if (i.location) byLoc[i.location] = (byLoc[i.location] || 0) + 1; });
  const incidentsByLocation = Object.entries(byLoc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([location, n]) => ({ location, percent: Math.round((n / Math.max(1, cur.length)) * 100) }));
  return ok({
    period: { from: from.toISOString(), to: to.toISOString() },
    stats: { totalIncidents: { value: cur.length, changePercent: pct(cur.length, prev.length) }, hygieneScore: { value: 94, label: 'Compliance rate' }, firstAidCases: { value: aidCount(cur), changePercent: pct(aidCount(cur), aidCount(prev)) }, sickLeaveDays: { value: sick(cur), changePercent: pct(sick(cur), sick(prev)) } },
    incidentsTrend: { daily, weekly },
    hygieneCompliance: { score: 94, pass: 70, warning: 15, fail: 15 },
    incidentsByLocation,
    programImpact: { labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'], values: [14, 46, 12, 78, 36, 100] },
  });
});
on('GET', '/reports/generated', () => ok({ data: [...db.reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20).map(({ from, to, type, ...r }) => r) }));
on('POST', '/reports/generated', ({ body }) => {
  if (!REPORT_TYPES[body.type]) throw fieldErr(422, 'Choose a report type.', { type: 'Choose a report type.' });
  if (!['pdf', 'csv'].includes(body.format)) throw fieldErr(422, 'Choose a format.', { format: 'Choose a format.' });
  const r = { id: db.seq.report++, type: body.type, name: REPORT_TYPES[body.type], format: body.format, sizeBytes: body.format === 'pdf' ? 18000 : 4200, createdAt: new Date().toISOString(), from: body.from, to: body.to };
  db.reports.push(r);
  const { from, to, type, ...out } = r;
  return ok(out, 201);
});
on('GET', '/reports/generated/:id/download', ({ groups }) => {
  const r = db.reports.find((x) => x.id === Number(groups.id));
  if (!r) throw new HttpErr(404, 'Report not found.');
  const rows = real().filter((i) => i.occurredAt >= (r.from ? startOfDay(parseDay(r.from)).toISOString() : '') && i.occurredAt <= (r.to ? endOfDay(parseDay(r.to)).toISOString() : '9')).slice(-25);
  if (r.format === 'csv') return ok(new Blob([`Reference,Student,Type,Location,Status,Occurred\n${rows.map((i) => [i.reference, studentRef(i.studentId).name, i.type, i.location, i.status, i.occurredAt].join(',')).join('\n')}`], { type: 'text/csv' }));
  return ok(makePdf(`${r.name} - ${db.school.name}`, [`Period: ${r.from || ''} to ${r.to || ''}`, `Incidents in period: ${rows.length}`, '(Demo PDF generated by the mock API)']));
});

// ---- training
on('GET', '/training/overview', () => {
  const mand = db.courses.filter((c) => c.mandatory);
  const done = db.courses.filter((c) => c.status === 'completed');
  const hours = db.courses.reduce((s, c) => s + (c.durationMinutes * (c.status === 'completed' ? 100 : c.progressPercent)) / 100, 0) / 60;
  const latest = [...done].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
  return ok({ stats: { mandatory: { completed: mand.filter((c) => c.status === 'completed').length, total: mand.length }, learningHours: { value: Math.round(hours * 10) / 10, thisWeek: 2.5 }, certificates: { count: done.length, latest: latest?.title || null } } });
});
on('GET', '/training/courses', ({ params: q }) => {
  let list = [...db.courses];
  if (q.filter === 'mandatory') list = list.filter((c) => c.mandatory);
  if (q.filter === 'optional') list = list.filter((c) => !c.mandatory);
  if (q.filter === 'documents') list = list.filter((c) => ['guide', 'document'].includes(c.type));
  if (q.search) { const s = String(q.search).toLowerCase(); list = list.filter((c) => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)); }
  return ok({ data: list.map(courseOut) });
});
const findCourse = (id) => { const c = db.courses.find((x) => x.id === Number(id)); if (!c) throw new HttpErr(404, 'Course not found.'); return c; };
on('POST', '/training/courses/:id/start', ({ groups }) => { const c = findCourse(groups.id); if (c.status === 'not_started') Object.assign(c, { status: 'in_progress', progressPercent: 10 }); return ok(courseOut(c)); });
on('POST', '/training/courses/:id/complete', ({ groups }) => { const c = findCourse(groups.id); Object.assign(c, { status: 'completed', progressPercent: 100, completedAt: new Date().toISOString() }); return ok(courseOut(c)); });
on('GET', '/training/events', () => ok({ data: db.events.filter((e) => new Date(e.startsAt) > now) }));

// ---- school
on('GET', '/school', () => ok(db.school));
on('PUT', '/school', ({ body }) => {
  if ('name' in body && !String(body.name).trim()) throw fieldErr(422, 'School name is required.', { name: 'Enter the school name.' });
  const { logoUrl, id, ...rest } = body;
  Object.assign(db.school, rest);
  return ok(db.school);
});
on('POST', '/school/logo', ({ body }) => { db.school.logoUrl = URL.createObjectURL(body.get('logo')); return ok({ logoUrl: db.school.logoUrl }); });
on('DELETE', '/school/logo', () => { db.school.logoUrl = null; return ok(null, 204); });
on('GET', '/school/users', ({ params: q }) => {
  const r = paginate(db.users, q.page, q.limit);
  return ok({ ...r, data: r.data.map(({ id, name, email, role, status, lastActiveAt }) => ({ id, name, email, role, status, lastActiveAt })) });
});

// ---- AI chatbot (canned replies in demo mode)
function aiReply(text) {
  const t = text.toLowerCase();
  if (/fever|temperature/.test(t)) return { content: 'According to district policy #402, students with a fever over 100.4°F must be sent home immediately. They may return after being fever-free for 24 hours without the use of fever-reducing medication.', attachment: { name: 'Fever_Protocol_2024.pdf', mimeType: 'application/pdf', sizeBytes: 124 * 1024, blob: makePdf('Fever Protocol', ['Policy #402', 'Send home if temperature is over 100.4F.']) } };
  if (/immuni/.test(t)) return { content: 'Please share the student ID (for example #41325) and I will check the immunization record for you.' };
  if (/symptom/.test(t)) return { content: 'Tell me the symptoms you are seeing (for example fever, rash, vomiting) and the student’s class. I will suggest the right protocol and whether a report is needed.' };
  if (/policy/.test(t)) return { content: 'I can look up policies on infection control, medication administration, allergies and emergency response. Which one do you need?' };
  if (/emergency|contact/.test(t)) return { content: `Emergency contacts for ${db.school.name}: Health office ${db.school.contact.healthOfficePhone}, ${db.school.contact.emergencyEmail}. For life-threatening emergencies, call emergency services first.` };
  return { content: 'I can help with student health records, protocols and reporting. Try asking about a fever, an immunization record or an emergency contact.' };
}
on('GET', '/ai/conversations', () => ok({ data: [...db.convos].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(({ id, title, updatedAt }) => ({ id, title, updatedAt })) }));
on('GET', '/ai/conversations/:id', ({ groups }) => { const c = db.convos.find((x) => x.id === Number(groups.id)); if (!c) throw new HttpErr(404, 'Conversation not found.'); return ok({ id: c.id, messages: c.messages }); });
on('DELETE', '/ai/conversations/:id', ({ groups }) => { const i = db.convos.findIndex((x) => x.id === Number(groups.id)); if (i < 0) throw new HttpErr(404, 'Conversation not found.'); db.convos.splice(i, 1); return ok(null, 204); });
on('POST', '/ai/chat', async ({ body }) => {
  if (!String(body.message || '').trim()) throw fieldErr(422, 'Type a message.', { message: 'Type a message.' });
  let c = db.convos.find((x) => x.id === body.conversationId);
  if (!c) { c = { id: db.seq.convo++, title: body.message.slice(0, 40), updatedAt: new Date().toISOString(), messages: [] }; db.convos.push(c); }
  c.messages.push({ id: `m${db.seq.msg++}`, role: 'user', content: body.message, createdAt: new Date().toISOString(), attachments: [] });
  await delay(700);
  const r = aiReply(body.message);
  const msg = { id: `m${db.seq.msg++}`, role: 'assistant', content: r.content, createdAt: new Date().toISOString(), attachments: r.attachment ? [{ name: r.attachment.name, mimeType: r.attachment.mimeType, sizeBytes: r.attachment.sizeBytes, url: URL.createObjectURL(r.attachment.blob) }] : [] };
  c.messages.push(msg); c.updatedAt = msg.createdAt;
  return ok({ conversationId: c.id, message: msg });
});

// ---- notifications
const notifications = () => [
  ...db.activities.filter((a) => a.category === 'safety' && a.status === 'pending' && a.date < dayKey(now)).map((a) => ({ id: `audit-${a.id}`, title: 'Audit overdue', message: `${a.title} was due on ${a.date}.`, createdAt: startOfDay(parseDay(a.date)).toISOString() })),
  ...real().filter((i) => i.status === 'open').slice(-3).map((i) => ({ id: `inc-${i.id}`, title: 'Case needs follow-up', message: `${studentRef(i.studentId).name}: ${i.summary} (${i.reference})`, createdAt: i.occurredAt })),
].map((n) => ({ ...n, read: db.read.has(n.id) })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
on('GET', '/notifications', () => ok({ data: notifications() }));
on('POST', '/notifications/read-all', () => { notifications().forEach((n) => db.read.add(n.id)); return ok(null, 204); });

/* ------------------------------- adapter ------------------------------- */
export async function mockAdapter(config) {
  await delay(100 + Math.random() * 140);
  const method = (config.method || 'get').toUpperCase();
  const path = (config.url || '').split('?')[0].replace(/\/$/, '');
  let body = config.data;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const fail = (e) => new AxiosError(e.message, 'ERR_BAD_REQUEST', config, {}, { data: { message: e.message, ...e.extra }, status: e.status, statusText: '', headers: {}, config });
  try {
    const hit = routes.map((r) => ({ r, m: r.re.exec(path) })).find((x) => x.r.method === method && x.m);
    if (!hit) throw new HttpErr(404, `No such endpoint: ${method} ${path}`);
    let user = null;
    if (hit.r.auth) {
      user = userById(Number(String(config.headers?.Authorization || '').replace('Bearer mock.', '')));
      if (!user) throw new HttpErr(401, 'Please sign in.');
    }
    const out = await hit.r.handler({ params: config.params || {}, body: body || {}, user, groups: hit.m.groups || {} });
    return { data: out.data, status: out.status || 200, statusText: 'OK', headers: {}, config, request: {} };
  } catch (e) {
    if (e instanceof HttpErr) throw fail(e);
    throw e;
  }
}
