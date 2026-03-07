import {
  LayoutGrid,
  FileText,
  Clock,
  ClipboardCheck,
  LogOut,
  Users,
  User,
  Building2,
  CreditCard,
  Shield,
  Target,
  Brain,
  CalendarClock,
  Dumbbell,
  Apple,
  Menu,
  Moon,
  Sun,
  X,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';

const iconClass = 'size-5 shrink-0';

type IconProps = { className?: string };

export function IconDashboard({ className = iconClass }: IconProps) {
  return <LayoutGrid className={className} />;
}

export function IconTemplates({ className = iconClass }: IconProps) {
  return <FileText className={className} />;
}

export function IconSessions({ className = iconClass }: IconProps) {
  return <Clock className={className} />;
}

export function IconAudit({ className = iconClass }: IconProps) {
  return <ClipboardCheck className={className} />;
}

export function IconLogout({ className = iconClass }: IconProps) {
  return <LogOut className={className} />;
}

/** ECG pulse – brand mark for logo. Path uses currentColor; parent controls contrast (e.g. wrap in a span with text-white when on primary bg). */
export function IconPulse({ className = 'size-8' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
      <path
        d="M6 18h4v-2h2v6h2v-8h2v4h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function IconPatients({ className = iconClass }: IconProps) {
  return <Users className={className} />;
}

export function IconUsers({ className = iconClass }: IconProps) {
  return <User className={className} />;
}

export function IconTenants({ className = iconClass }: IconProps) {
  return <Building2 className={className} />;
}

export function IconSubscription({ className = iconClass }: IconProps) {
  return <CreditCard className={className} />;
}

export function IconShield({ className = iconClass }: IconProps) {
  return <Shield className={className} />;
}

export function IconGoals({ className = iconClass }: IconProps) {
  return <Target className={className} />;
}

export function IconAi({ className = iconClass }: IconProps) {
  return <Brain className={className} />;
}

export function IconSchedule({ className = iconClass }: IconProps) {
  return <CalendarClock className={className} />;
}

export function IconTraining({ className = iconClass }: IconProps) {
  return <Dumbbell className={className} />;
}

export function IconDiet({ className = iconClass }: IconProps) {
  return <Apple className={className} />;
}

export function IconChevronDown({ className = iconClass }: IconProps) {
  return <ChevronDown className={className} />;
}

export function IconHelp({ className = iconClass }: IconProps) {
  return <HelpCircle className={className} />;
}

export function IconMenu({ className = iconClass }: IconProps) {
  return <Menu className={className} />;
}

export function IconX({ className = iconClass }: IconProps) {
  return <X className={className} />;
}

export function IconSun({ className = iconClass }: IconProps) {
  return <Sun className={className} />;
}

export function IconMoon({ className = iconClass }: IconProps) {
  return <Moon className={className} />;
}

export function IconBell({ className = iconClass }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
