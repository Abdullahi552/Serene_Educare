/* Values here must match what the backend accepts (see docs/BACKEND_API_CONTRACT.md). */

export const INCIDENT_TYPES = [
  { value: 'injury', label: 'Injury' },
  { value: 'illness', label: 'Illness' },
  { value: 'safety', label: 'Safety Issue' },
];

export const INCIDENT_LOCATIONS = ['Classroom', 'Playground', 'Sports Field', 'Cafeteria', 'Hallway', 'Laboratory', 'School Bus', 'Toilets', 'Other'];

export const FIRST_AID_OPTIONS = [
  { value: 'ice_pack', label: 'Ice Pack' },
  { value: 'bandage_dressing', label: 'Bandage/Dressing' },
  { value: 'cleaned_wound', label: 'Cleaned Wound' },
  { value: 'observation_rest', label: 'Observation/Rest' },
  { value: 'parent_contacted', label: 'Parent Contacted' },
  { value: 'emergency_called', label: '911 Called' },
];

/** Outcome / follow-up status of an incident or clinic visit. */
export const INCIDENT_STATUSES = [
  { value: 'open', label: 'Open', tone: 'danger' },
  { value: 'treated', label: 'Treated', tone: 'ok' },
  { value: 'sent_home', label: 'Sent Home', tone: 'warn' },
  { value: 'administered', label: 'Administered', tone: 'ok' },
  { value: 'referred', label: 'Referred', tone: 'info' },
  { value: 'closed', label: 'Closed', tone: 'neutral' },
];

export const ACTIVITY_CATEGORIES = [
  { value: 'hygiene', label: 'Hygiene Checks', short: 'Hygiene', tone: 'ok' },
  { value: 'nutrition', label: 'Nutrition Sessions', short: 'Nutrition', tone: 'warn' },
  { value: 'safety', label: 'Safety Audits', short: 'Safety', tone: 'danger' },
  { value: 'event', label: 'Health Events', short: 'Event', tone: 'info' },
];
export const ACTIVITY_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export const ROLE_LABELS = {
  school_admin: 'School Admin',
  principal: 'Principal',
  school_nurse: 'School Nurse',
  counselor: 'Counselor',
  teacher: 'Teacher',
};

export const COURSE_TYPES = { video: 'Video', module: 'Module', presentation: 'Presentation', guide: 'Guide', document: 'Document' };
export const COURSE_FILTERS = [
  { value: 'all', label: 'All Resources' },
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional', label: 'Optional' },
  { value: 'documents', label: 'Documents' },
];

export const REPORT_TYPES = [
  { value: 'incident_summary', label: 'Monthly Incident Summary' },
  { value: 'student_allergies', label: 'Student Allergies List' },
  { value: 'activity_log', label: 'Health Activity Log' },
  { value: 'hygiene_compliance', label: 'Hygiene Compliance Report' },
];
export const REPORT_FORMATS = [{ value: 'pdf', label: 'PDF' }, { value: 'csv', label: 'CSV (Excel)' }];

export const PLANS = [
  { key: 'basic', name: 'Basic Plan', price: 150000, ideal: 'Ideal for small schools (≤150 students)', includes: null,
    features: ['1 baseline health assessment', '3 monthly visits', 'Basic student screening', '1 health talk', 'First aid audit', 'Advisory support'] },
  { key: 'standard', name: 'Standard Plan', price: 300000, ideal: 'Ideal for medium schools (150–400 students)', includes: 'Includes everything in Basic, plus:', featured: true,
    features: ['2 health talks per term', 'Teacher awareness session', 'Termly health documentation', '1 inter-house sports medical coverage'] },
  { key: 'premium', name: 'Premium Plan', price: 550000, ideal: 'Ideal for large schools (400+ students)', includes: 'Includes everything in Standard, plus:',
    features: ['Scheduled on-site nurse support', 'Mental health awareness session', 'Parent health webinar', '2 event medical coverages', 'Custom health policy advisory'] },
];
export const ONE_OFF_SERVICES = [
  ['Inter-House Sports Medical Coverage', '₦80,000 – ₦250,000'],
  ['Health Awareness Session', '₦50,000 – ₦150,000'],
  ['Comprehensive School Health Assessment', '₦120,000 – ₦200,000'],
  ['First Aid Box Setup/Upgrade', '₦40,000 – ₦120,000'],
];
