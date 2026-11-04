/**
 * Datos públicos del proyecto (marca, repositorio y licencia).
 *
 * El repositorio se configura con `NEXT_PUBLIC_GITHUB_URL` para que cada
 * despliegue apunte a su propio fork sin tocar código. Los enlaces derivados
 * (licencia, contribuir, issues) se construyen a partir de esa URL.
 */

const REPO_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/talentia-hdv/talentia';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talentiacv.vercel.app';

export const SITE = {
  name: 'Talentia',
  url: SITE_URL,
  repoUrl: REPO_URL,
  issuesUrl: `${REPO_URL}/issues`,
  newIssueUrl: `${REPO_URL}/issues/new/choose`,
  contributingUrl: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
  licenseUrl: `${REPO_URL}/blob/main/LICENSE`,
  readmeUrl: `${REPO_URL}/blob/main/README.md`,
  licenseName: 'MIT',
} as const;

/** Stack que se menciona en la landing y en el README. */
export const OSS_STACK = [
  'Next.js 14',
  'React 18',
  'TypeScript',
  'Tailwind CSS',
  'jsPDF',
  'docx',
  'pdf.js',
  'OpenAI-compatible API',
] as const;
