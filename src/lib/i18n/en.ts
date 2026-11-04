import type { Dictionary } from './es';

/** English dictionary. Mirrors every key defined in `es.ts`. */
export const en: Dictionary = {
  // --- Metadata / SEO ---
  'meta.title': 'Talentia — Open source resume builder',
  'meta.description':
    'Create, improve and export your professional resume with AI. 100% open source, free and self-hostable. Reads PDF, Word and even photos or scans.',
  'meta.keywords':
    'resume, cv, open source, free, builder, templates, ai, pdf, word, ats, curriculum vitae',
  'meta.ogTitle': 'Talentia — Professional, personalized and open source resumes',
  'meta.ogDescription':
    'Open source resume assistant: the AI reads your current CV (PDF, Word or a photo) or your free-form text and turns it into a resume ready to apply with.',

  // --- Common ---
  'common.language': 'Language',
  'common.spanish': 'Español',
  'common.english': 'English',

  // --- Navigation ---
  'nav.start': 'Get started',
  'nav.signIn': 'Sign in',
  'nav.home': 'Home',
  'nav.github': 'GitHub',
  'nav.star': 'Star us on GitHub',
  'nav.contribute': 'Contribute',
  'nav.license': 'MIT License',

  // --- Landing: hero ---
  'landing.badge': 'Open source · MIT License',
  'landing.hero.titleTop': 'Your resume,',
  'landing.hero.titleAccent': 'with real professional polish',
  'landing.hero.subtitle':
    'Create, improve and export your CV in minutes. Open source, no mandatory sign-up and ready whenever you need it.',
  'landing.hero.cta': 'Start now',
  'landing.hero.note': 'Exports to PDF and Word',
  'landing.hero.repo': 'View the code',

  // --- Landing: upload card ---
  'landing.upload.title': 'Upload your existing CV',
  'landing.upload.titleLoading': 'The AI is reading your CV...',
  'landing.upload.desc':
    'Drop a PDF, Word, TXT file or a photo. Our AI extracts your data and fills in the form.',
  'landing.upload.descActive': 'Drop your file here.',
  'landing.upload.badgeAi': 'AI filled',
  'landing.upload.error': 'We could not process the file. Try again or start from scratch.',

  // --- Landing: free text ---
  'landing.narrative.title': 'No resume yet? Tell us who you are',
  'landing.narrative.desc':
    'Write freely about your experience, your education and what you are looking for. The AI turns it into an organized resume — order and wording do not matter.',
  'landing.narrative.placeholder':
    'Example: I am John Smith, a systems technician with 5 years of support experience at a telecom company. I studied... My English is intermediate. I am looking for an IT support role...',
  'landing.narrative.cta': 'Build my resume with AI',
  'landing.narrative.ctaLoading': 'The AI is writing your CV...',
  'landing.narrative.error': 'We could not process your text. Please try again.',

  // --- Landing: features ---
  'landing.features.eyebrow': 'Key advantages',
  'landing.features.title': 'Powerful, open and built for professionals',
  'landing.features.free.title': 'Free and open source',
  'landing.features.free.desc':
    'MIT licensed: use it, modify it and self-host it. No hidden plans, no odd limits.',
  'landing.features.ai.title': 'AI that reads anything',
  'landing.features.ai.desc':
    'Upload your CV as PDF, Word or a photo: even scans are read with vision AI.',
  'landing.features.adapt.title': 'Tailored to the job post',
  'landing.features.adapt.desc':
    'Paste the job you want and stand out with the right keywords.',
  'landing.features.export.title': 'PDF and Word',
  'landing.features.export.desc':
    'Export a PDF with selectable text (ATS friendly) or Word so you can keep editing.',
  'landing.features.selfhost.title': 'Yours forever',
  'landing.features.selfhost.desc':
    'Your data stays in your browser. If you want, run your own instance on Netlify or Vercel.',
  'landing.features.nosignup.title': 'No sign-up',
  'landing.features.nosignup.desc':
    'Open it, fill it in and download. No sign-up and no server-side storage: your resume stays in your browser.',

  // --- Landing: steps ---
  'landing.steps.eyebrow': 'Simple flow',
  'landing.steps.title': 'Ready in 3 steps',
  'landing.steps.one.title': 'Upload or start',
  'landing.steps.one.desc':
    'Upload a PDF/Word to autofill, paste your text or start from scratch in seconds.',
  'landing.steps.two.title': 'Polish and design',
  'landing.steps.two.desc':
    'Edit step by step, improve your wording with AI and pick from 25+ templates.',
  'landing.steps.three.title': 'Export and apply',
  'landing.steps.three.desc': 'Download as PDF or Word and share your CV right away.',
  'landing.steps.cta': 'Create my resume for free',

  // --- Landing: templates ---
  'landing.templates.eyebrow': 'Professional designs',
  'landing.templates.title': 'Pick the style that represents you',
  'landing.templates.desc':
    'More than 25 ready templates. Inside the editor you can filter them by the role you are applying for.',

  // --- Landing: open source section ---
  'landing.oss.eyebrow': 'Built in the open',
  'landing.oss.title': 'An open source project for building resumes',
  'landing.oss.desc':
    'Talentia exists so that creating a professional resume never depends on a subscription. The code is public, the license is MIT, and anyone can audit it, improve it or deploy their own instance.',
  'landing.oss.license.title': 'MIT License',
  'landing.oss.license.desc':
    'Use it personally or commercially, modify it and redistribute it as long as you keep the license notice.',
  'landing.oss.selfhost.title': 'Self-host in minutes',
  'landing.oss.selfhost.desc':
    'Next.js and one command for development. The guide covers deploying to Vercel or Netlify.',
  'landing.oss.contribute.title': 'Contribute',
  'landing.oss.contribute.desc':
    'New templates, translations, accessibility or AI improvements: pull requests are welcome and there are issues labeled for newcomers.',
  'landing.oss.stack.title': 'Built on free software',
  'landing.oss.stack.desc':
    'Next.js, React, TypeScript, Tailwind CSS, jsPDF, docx and pdf.js. The AI runs on open models through an OpenAI-compatible service.',
  'landing.oss.cta.repo': 'View the repository',
  'landing.oss.cta.contribute': 'How to contribute',
  'landing.oss.cta.license': 'Read the license',

  // --- Landing: footer ---
  'landing.footer.tagline':
    'A builder for professional, personalized and open source resumes.',
  'landing.footer.product': 'Product',
  'landing.footer.project': 'Project',
  'landing.footer.start': 'Create my resume',
  'landing.footer.templates': 'Templates',
  'landing.footer.repo': 'Repository',
  'landing.footer.contribute': 'Contribute',
  'landing.footer.license': 'MIT License',
  'landing.footer.issues': 'Report an issue',
  'landing.footer.faq': 'FAQ',
  'landing.footer.rights': 'Open source under the MIT License',

  // --- Landing: hero microcopy ---
  'landing.hero.microcopy': 'No sign-up · 3 minutes · Download as PDF and Word',

  // --- Landing: trust strip ---
  'landing.trust.privacy.title': 'Your resume stays in your browser',
  'landing.trust.privacy.desc':
    'It only reaches the AI service when you ask it to read a file or improve some text, and it is never stored.',
  'landing.trust.free.title': 'No watermark, no paid plans',
  'landing.trust.free.desc':
    'Every template and every download is available from the very first minute.',
  'landing.trust.accounts.title': 'Start without an account',
  'landing.trust.accounts.desc':
    'There are no accounts and no database: your resume is saved in your own browser and you can export it whenever you want.',
  'landing.trust.ats.title': 'Ready for automatic filters',
  'landing.trust.ats.desc':
    'PDF with selectable text and standard sections; Word export is available too.',

  // --- Landing: demo (before / after) ---
  'landing.demo.eyebrow': 'See it from the inside',
  'landing.demo.title': 'From a photo of an old resume to a CV ready to apply',
  'landing.demo.desc':
    'Upload a photo, a screenshot or a scanned CV: the vision model reads it, understands what each piece of data is and files it under the right section. Nothing to retype by hand.',
  'landing.demo.before.label': 'Before',
  'landing.demo.before.title': 'Photo, screenshot or scan',
  'landing.demo.before.desc':
    'Even if the image is tilted, blurry or a scanned PDF, the model reads the text and interprets it.',
  'landing.demo.bridge': 'The AI reads it and organizes it',
  'landing.demo.after.label': 'After',
  'landing.demo.after.title': 'Your data, already split into sections',
  'landing.demo.after.desc':
    'Name, role, experience, education, languages and skills come out classified and ready to edit.',
  'landing.demo.editor.title': 'Editor with a live preview',
  'landing.demo.editor.desc':
    'Seven guided steps that tell you what is missing and what comes next, plus a quality score that updates as you type.',
  'landing.demo.editor.formLabel': 'Editor · Step 4 of 7',
  'landing.demo.editor.previewLabel': 'Live preview',
  'landing.demo.editor.score': 'Quality',
  'landing.demo.editor.nextStep': 'Next step: add your achievements',
  'landing.demo.mock.fullName': 'Full name',
  'landing.demo.mock.role': 'Professional title',
  'landing.demo.mock.roleValue': 'Data Analyst',
  'landing.demo.mock.experience': 'Experience',
  'landing.demo.mock.experienceValue': '2 roles · 4 achievements with results',
  'landing.demo.mock.skills': 'Skills',
  'landing.demo.mock.skillsValue': 'SQL · Power BI · Python · Storytelling',
  'landing.demo.mock.aiFilled': 'AI filled',
  'landing.demo.cta': 'Try it with my CV',

  // --- Landing: FAQ ---
  'landing.faq.eyebrow': 'FAQ',
  'landing.faq.title': 'What people ask before starting',
  'landing.faq.desc': 'Straight answers. If something is missing, open an issue in the repository.',
  'landing.faq.free.q': 'Is it really free?',
  'landing.faq.free.a':
    'Yes. The project is open source under the MIT license: no paid plans, no watermark and no download limits. Use the public instance or deploy your own.',
  'landing.faq.data.q': 'Where is my data stored?',
  'landing.faq.data.a':
    'Your resume lives in your own browser. It only reaches the AI service when you ask it to read a file or improve some text, and it is not kept on our servers.',
  'landing.faq.ats.q': 'Does it pass automated screening?',
  'landing.faq.ats.a':
    'The PDF is exported with selectable text and standard sections, and you can also download a Word file. Templates marked as ATS avoid the columns and graphics those filters read badly.',
  'landing.faq.ai.q': 'Which AI does it use and how much can I use it?',
  'landing.faq.ai.a':
    'Open models behind a single assistant. Everyone gets a daily quota of free AI uses, enough to create and polish a resume, and it resets every day.',
  'landing.faq.selfhost.q': 'Can I self-host it or use it at my company?',
  'landing.faq.selfhost.a':
    'Yes. You need Node.js and a database. The README explains how to run it locally and how to deploy it to Netlify or Vercel in a few minutes.',
  'landing.faq.account.q': 'Do I need to create an account?',
  'landing.faq.account.a':
    'No: open it, fill it in and download without creating anything. Your data is saved in your browser, not on a server, and the AI works without signing up.',
  // --- Editor: section tabs ---
  'editor.tab.personal.label': 'Details',
  'editor.tab.personal.title': 'Personal details',
  'editor.tab.personal.description': 'Name, headline, contact and photo.',
  'editor.tab.summary.label': 'Profile',
  'editor.tab.summary.title': 'Profile',
  'editor.tab.summary.description': 'Your professional summary and value proposition.',
  'editor.tab.skills.label': 'Skills',
  'editor.tab.skills.title': 'Skills',
  'editor.tab.skills.description': 'Key skills and main stack.',
  'editor.tab.experience.label': 'Experience',
  'editor.tab.experience.title': 'Experience',
  'editor.tab.experience.description': 'Your roles, achievements and results.',
  'editor.tab.education.label': 'Education',
  'editor.tab.education.title': 'Education',
  'editor.tab.education.description': 'Degrees, fields of study and courses.',
  'editor.tab.languages.label': 'Languages',
  'editor.tab.languages.title': 'Languages',
  'editor.tab.languages.description': 'Languages and real proficiency level.',
  'editor.tab.references.label': 'References',
  'editor.tab.references.title': 'References',
  'editor.tab.references.description': 'Optional. Contacts who can recommend you.',
  'editor.prev': 'Back',
  'editor.viewCv': 'View my resume',
  'editor.currentQuality': 'Current quality: {label}.',
  'editor.step': 'Step {current} of {total}',
  'editor.next': 'Next: {label}',
};
