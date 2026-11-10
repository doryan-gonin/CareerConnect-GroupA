export const JOB_TYPES = [
  'Permanent',
  'Temporary',
  'Contract',
  'Seasonal',
  'Internship',
]

export const JOB_SCHEDULES = [
  'Full-time',
  'Part-time',
]

export const PRESET_CATEGORIES = [
  'Software Engineering',
  'Design',
  'Data Science & AI',
  'DevOps & Infrastructure',
  'Quality Assurance',
  'Technical Support',
  'Information Technology',
  'Cybersecurity',
  'Marketing',
  'Content & Communications',
  'Finance',
]

export const CANONICAL_LOCATIONS = [
  { name: 'Montreal, QC', aliases: ['montreal', 'montréal', 'mtl', 'quebec', 'qc'] },
  { name: 'Toronto, ON', aliases: ['toronto', 'gta', 'ontario', 'on', 'yyz'] },
  { name: 'Vancouver, BC', aliases: ['vancouver', 'bc', 'british columbia', 'yvr'] },
  { name: 'Ottawa, ON', aliases: ['ottawa', 'gatineau', 'ncr', 'capital', 'on'] },
  { name: 'Calgary, AB', aliases: ['calgary', 'alberta', 'ab', 'yyc'] },
  { name: 'Edmonton, AB', aliases: ['edmonton', 'alberta', 'ab', 'yeg'] },
  { name: 'Quebec City, QC', aliases: ['quebec city', 'québec', 'ville de quebec', 'qc'] },
  { name: 'Winnipeg, MB', aliases: ['winnipeg', 'manitoba', 'mb'] },
  { name: 'Halifax, NS', aliases: ['halifax', 'nova scotia', 'ns'] },
  { name: 'Victoria, BC', aliases: ['victoria', 'vancouver island', 'bc'] },
  { name: 'Kitchener-Waterloo, ON', aliases: ['kitchener', 'waterloo', 'kw', 'on'] },
  { name: 'Remote - Canada', aliases: ['remote', 'telework', 'work from home', 'wfh', 'canada'] },
  { name: 'Remote', aliases: ['remote', 'anywhere', 'wfh'] },
]

export const COMMON_LOCATIONS = CANONICAL_LOCATIONS.map((loc) => loc.name)

export const SCHEDULE_HOURS_MAP = {
  'Full-time': { min: 35, max: 40 },
  'Part-time': { min: 15, max: 25 },
}

export const HOURS_EXTREMUMS = { min: 0, max: 60, step: 1 }
export const SALARY_EXTREMUMS = { min: 20000, max: 250000, step: 5000 }

