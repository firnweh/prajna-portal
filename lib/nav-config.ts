export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const studentNav: NavItem[] = [
  { label: 'My Dashboard', href: '/student', icon: '📊' },
  { label: 'Predictions', href: '/predictions', icon: '🔮' },
  { label: 'Lesson Plan', href: '/predictions?tab=lesson', icon: '📚' },
  { label: 'Mistake Analysis', href: '/predictions?tab=mistakes', icon: '🧪' },
  { label: 'Deep Analysis', href: '/analysis', icon: '🔬' },
];

export const orgNav: NavItem[] = [
  { label: 'Organisation', href: '/org', icon: '📊' },
  { label: 'Predictions', href: '/predictions', icon: '🔮' },
  { label: 'Lesson Plan', href: '/predictions?tab=lesson', icon: '📚' },
  { label: 'Mistake Analysis', href: '/predictions?tab=mistakes', icon: '🧪' },
  { label: 'Deep Analysis', href: '/analysis', icon: '🔬' },
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
