export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const studentNav: NavItem[] = [
  { label: 'My Dashboard', href: '/student', icon: '📊' },
  { label: 'Predictions', href: '/predictions', icon: '🔮' },
  { label: 'Backtest', href: '/backtest', icon: '🎯' },
  { label: 'Topic Deep Dive', href: '/deep-dive', icon: '🔬' },
  { label: 'Lesson Plan', href: '/lesson-plan', icon: '📚' },
  { label: 'Revision Plan', href: '/revision-plan', icon: '📅' },
  { label: 'Mistake Analysis', href: '/mistakes', icon: '🧪' },
  { label: 'Deep Analysis', href: '/analysis', icon: '🔬' },
  { label: 'Ask PRAJNA', href: '/copilot', icon: '🤖' },
  { label: 'Question Bank', href: '/question-bank', icon: '📝' },
  { label: 'Mock Test', href: '/mock-test', icon: '📄' },
];

export const orgNav: NavItem[] = [
  { label: 'Organisation', href: '/org', icon: '📊' },
  { label: 'At-Risk Students', href: '/org/risk', icon: '⚠' },
  { label: 'Predictions', href: '/predictions', icon: '🔮' },
  { label: 'Backtest', href: '/backtest', icon: '🎯' },
  { label: 'Topic Deep Dive', href: '/deep-dive', icon: '🔬' },
  { label: 'Lesson Plan', href: '/lesson-plan', icon: '📚' },
  { label: 'Revision Plan', href: '/revision-plan', icon: '📅' },
  { label: 'Mistake Analysis', href: '/mistakes', icon: '🧪' },
  { label: 'Deep Analysis', href: '/analysis', icon: '🔬' },
  { label: 'Ask PRAJNA', href: '/copilot', icon: '🤖' },
  { label: 'Question Bank', href: '/question-bank', icon: '📝' },
  { label: 'Mock Test', href: '/mock-test', icon: '📄' },
];

export function getSubjectLinks(exam: 'neet' | 'jee'): NavItem[] {
  if (exam === 'jee') {
    return [
      { label: 'Physics', href: '/student/physics', icon: '⚡' },
      { label: 'Chemistry', href: '/student/chemistry', icon: '🧪' },
      { label: 'Mathematics', href: '/student/mathematics', icon: '📐' },
    ];
  }
  return [
    { label: 'Physics', href: '/student/physics', icon: '⚡' },
    { label: 'Chemistry', href: '/student/chemistry', icon: '🧪' },
    { label: 'Biology', href: '/student/biology', icon: '🧬' },
  ];
}
