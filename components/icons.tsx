import {
  Loader2,
  type LightbulbIcon as LucideProps,
  User,
  LogOut,
  UserPlus,
  UserCheck,
  Mail,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export const Icons = {
  spinner: Loader2,
  user: User,
  logout: LogOut,
  userPlus: UserPlus,
  userCheck: UserCheck,
  mail: Mail,
  settings: Settings,
  alertCircle: AlertCircle,
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  ),
}

