import { Link } from 'react-router-dom';

const evaluatorGroups = [
  {
    title: 'Peer Students',
    description: 'Use the patient-facing flow first, then access staff roles only if credentials were provided for your evaluation batch.',
  },
  {
    title: 'Patients',
    description: 'Focus on registration, login, appointment request, dashboard, history, and account experience.',
  },
  {
    title: 'Domain Experts',
    description: 'Review the clinical and operational flow relevant to your expertise. Authorized evaluators may also receive doctor or admin credentials.',
  },
  {
    title: 'IT Experts',
    description: 'Evaluate the system flow, role separation, usability, and overall product quality using the credentials assigned to your group.',
  },
];

const evaluationSteps = [
  'Open the correct role account or register a patient account if you are testing the patient flow.',
  'Complete the core tasks assigned to your respondent classification.',
  'Observe the system’s functionality, usability, reliability, and clarity while using it.',
  'Answer the same ISO/IEC 25010-based survey after completing the guided tasks.',
];

const patientTasks = [
  'Create an account or log in.',
  'Request an appointment.',
  'Review dashboard, appointment history, and billing history.',
  'Update profile or account settings if included in your test flow.',
];

const staffTasks = [
  'Review assigned appointments or patient lists.',
  'Open a patient record and inspect available details.',
  'Check operational tools such as billing, reports, or scheduling if your role includes them.',
  'Avoid deleting records unless the evaluator facilitator explicitly asks you to test that action.',
];

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(201,162,39,.18)',
  boxShadow: '0 18px 40px rgba(45,42,38,.06)',
};

const EvaluationGuide = () => {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#2d2a26]">
      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <div className="mb-10 flex flex-col gap-6 rounded-[32px] border border-[rgba(201,162,39,.2)] bg-[linear-gradient(135deg,#fffdf8_0%,#f4eee2_100%)] px-7 py-8 shadow-[0_24px_60px_rgba(45,42,38,.08)] md:px-10 md:py-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b6932d]">
            Evaluation Guide
          </div>
          <div className="max-w-3xl">
            <h1 className="mb-4 font-serif text-4xl leading-tight md:text-5xl">
              VIVRE System Evaluation Instructions
            </h1>
            <p className="max-w-2xl text-[15px] leading-8 text-[#6f6a63]">
              Good day!This guide is for evaluators who will use the system first, then answer the same
              ISO/IEC 25010-based product quality survey. Respondents are grouped by profession or
              classification, but the survey instrument is shared across all groups. Thank you for taking the time to assess VIVRECARES!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full bg-[#2d2a26] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7be6d] transition hover:opacity-90"
            >
              Open Landing Page
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-[rgba(45,42,38,.16)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d2a26] transition hover:border-[#b6932d] hover:text-[#a07c18]"
            >
              Patient Registration
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-[rgba(45,42,38,.16)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d2a26] transition hover:border-[#b6932d] hover:text-[#a07c18]"
            >
              Login Page
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdX41ho3rdv9XxvaUqWyEWcluVlWPq63ETni6axiI-c5zXnzg/viewform"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[rgba(45,42,38,.16)] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d2a26] transition hover:border-[#b6932d] hover:text-[#a07c18]"
            >
              Open Survey Form
            </a>
          </div>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {evaluatorGroups.map((group) => (
            <div key={group.title} className="rounded-[28px] p-6" style={cardStyle}>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
                Respondent Group
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-[#202020]">{group.title}</h2>
              <p className="text-sm leading-7 text-[#6f6a63]">{group.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[30px] p-7 md:p-8" style={cardStyle}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
              Standard Flow
            </div>
            <h2 className="mb-5 text-3xl font-semibold">How Evaluation Should Run</h2>
            <div className="space-y-4">
              {evaluationSteps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2d2a26] text-[11px] font-semibold text-[#d7be6d]">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-[#6f6a63]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] p-7 md:p-8" style={cardStyle}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
              Access Note
            </div>
            <h2 className="mb-4 text-3xl font-semibold">Role Credentials</h2>
            <p className="mb-4 text-sm leading-7 text-[#6f6a63]">
              All respondent groups answer the same survey, but role access may still differ.
              Patient access can be self-registered, while doctor and admin credentials should only
              be shared with authorized evaluators.
            </p>
            <div className="rounded-[24px] border border-[rgba(201,162,39,.22)] bg-[#fcfaf4] p-5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a07c18]">
                Recommended Practice
              </div>
              <p className="text-sm leading-7 text-[#6f6a63]">
                Use a separate demo admin account and a separate demo doctor account for evaluation.
                Do not reuse your personal or final production credentials.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] p-7 md:p-8" style={cardStyle}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
              Patient Flow
            </div>
            <h2 className="mb-5 text-3xl font-semibold">Suggested Tasks</h2>
            <div className="space-y-3">
              {patientTasks.map((task) => (
                <div key={task} className="rounded-[22px] border border-[rgba(45,42,38,.08)] bg-[#fbfaf7] px-5 py-4 text-sm leading-7 text-[#6f6a63]">
                  {task}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] p-7 md:p-8" style={cardStyle}>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
              Staff Flow
            </div>
            <h2 className="mb-5 text-3xl font-semibold">Authorized Tasks</h2>
            <div className="space-y-3">
              {staffTasks.map((task) => (
                <div key={task} className="rounded-[22px] border border-[rgba(45,42,38,.08)] bg-[#fbfaf7] px-5 py-4 text-sm leading-7 text-[#6f6a63]">
                  {task}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[30px] p-7 md:p-8" style={cardStyle}>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b6932d]">
            Final Step
          </div>
          <h2 className="mb-4 text-3xl font-semibold">Answer the Evaluation Survey</h2>
          <p className="mb-6 max-w-3xl text-sm leading-7 text-[#6f6a63]">
            After completing the assigned system tasks, please answer the shared ISO/IEC 25010-based
            evaluation form. All respondent groups use the same questionnaire. Thank you!
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdX41ho3rdv9XxvaUqWyEWcluVlWPq63ETni6axiI-c5zXnzg/viewform"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-[#2d2a26] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7be6d] transition hover:opacity-90"
          >
            Proceed to Google Form
          </a>
        </div>
      </section>
    </div>
  );
};

export default EvaluationGuide;
