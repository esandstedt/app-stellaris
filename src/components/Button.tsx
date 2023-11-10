import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";

function getIcon(key: string) {
  switch (key) {
    case "download":
      return ArrowDownTrayIcon;
    case "close":
      return XMarkIcon;
    default:
      return QuestionMarkCircleIcon;
  }
}

export const Button: React.FC<{ onClick: () => void; icon: string }> = (
  props
) => {
  const Icon = getIcon(props.icon);
  return (
    <div
      className="p-2 rounded bg-white hover:bg-slate-100 border border-slate-400 shadow-lg hover:ring-opacity-20 cursor-pointer flex justify-center items-center"
      onClick={props.onClick}
    >
      <Icon className="w-4 h-4" />
    </div>
  );
};
