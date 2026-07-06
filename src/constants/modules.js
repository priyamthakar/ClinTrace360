import {
  BookOpen,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Map as MapIcon,
  MessageSquareWarning,
} from "lucide-react";

export const modules = [
  { id: "review", label: "Data Review", icon: LayoutDashboard },
  { id: "recon", label: "SAE / Lab Recon", icon: GitCompareArrows },
  { id: "queries", label: "Query Workbench", icon: MessageSquareWarning },
  { id: "dqp", label: "Protocol → DQP", icon: FileText },
  { id: "mapper", label: "CRF → SDTM", icon: MapIcon },
  { id: "rules", label: "Rule Library", icon: BookOpen },
];
