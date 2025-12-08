import { Star } from "lucide-react";

export interface FriendCardProps {
  name: string;
  teamCount: number;
  lastSeen: string;
}

export const FriendCard = ({ name, teamCount, lastSeen }: FriendCardProps) => (
  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition cursor-pointer">
    <div className="w-8 h-8 rounded-full bg-linear-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
      {name.charAt(0)}
    </div>
    <div className="ml-3 grow min-w-0">
      <h4 className="text-xs font-bold text-gray-800 truncate">{name}</h4>
      <p className="text-[10px] text-gray-500">
        {teamCount} PKM • {lastSeen}
      </p>
    </div>
    <Star size={14} className="text-gray-300" />
  </div>
);
