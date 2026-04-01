import { Header } from '@/components/layout/Header';

export default function ApiDocsPage() {
  const intelUrl = process.env.NEXT_PUBLIC_INTEL_URL || 'http://localhost:8001';
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  const apis = [
    {
      name: 'Intelligence API',
      description: 'Prediction engine, topic analysis, insights, copilot, reports',
      url: `${intelUrl}/docs`,
      endpoints: [
        'GET /api/v1/data/predict — PRAJNA predictions',
        'GET /api/v1/data/backtest — Historical accuracy',
        'GET /api/v1/data/topic-deep-dive — Topic analysis',
        'GET /api/v1/data/hot-cold-topics — Hot & cold topics',
        'GET /api/v1/data/lesson-plan — Study plan',
        'GET /api/v1/data/subject-timeline — Subject trends',
        'POST /api/v1/copilot/ask — AI tutor',
        'POST /api/v1/reports/revision-plan — Revision schedule',
        'POST /api/v1/insights/micro-topic — Topic insights',
      ],
    },
    {
      name: 'Question Bank API',
      description: '1.14M questions from PhysicsWallahAI datasets',
      url: `${intelUrl}/docs#/Question%20Bank`,
      endpoints: [
        'GET /api/v1/qbank/search — Full-text search',
        'GET /api/v1/qbank/random — Random questions',
        'GET /api/v1/qbank/stats — Database statistics',
        'POST /api/v1/qbank/mock-test — Generate mock test',
      ],
    },
    {
      name: 'Mistake Analysis API',
      description: 'Student error patterns and prediction model',
      url: `${intelUrl}/docs#/Mistake%20Analysis`,
      endpoints: [
        'GET /api/v1/mistakes/danger-zones — High-risk topics',
        'GET /api/v1/mistakes/cofailure — Co-failure patterns',
        'GET /api/v1/mistakes/time-accuracy — Time vs accuracy',
        'GET /api/v1/mistakes/predict — P(miss) per student',
        'GET /api/v1/mistakes/feature-importance — Model explanation',
      ],
    },
    {
      name: 'Backend API',
      description: 'Authentication, student data, branch management',
      url: `${backendUrl}/api/auth/health`,
      endpoints: [
        'POST /api/auth/login — JWT authentication',
        'GET /api/auth/me — Current user',
        'GET /api/students — Student records',
        'GET /api/branches — Branch statistics',
      ],
    },
  ];

  return (
    <>
      <Header title="PRAJNA · API Documentation" />
      <div className="p-6 space-y-4 max-w-[1000px]">
        <p className="text-sm text-prajna-muted">
          PRAJNA exposes 4 API groups. Click the links below to open the interactive FastAPI docs.
        </p>
        {apis.map((api, i) => (
          <div key={i} className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-prajna-text">{api.name}</h3>
              <a
                href={api.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-prajna-accent hover:text-prajna-accent/80 transition-colors"
              >
                Open Docs ↗
              </a>
            </div>
            <p className="text-xs text-prajna-muted mb-3">{api.description}</p>
            <div className="space-y-1">
              {api.endpoints.map((ep, j) => (
                <p key={j} className="text-xs text-prajna-muted font-mono bg-prajna-bg px-2 py-1 rounded">
                  {ep}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
