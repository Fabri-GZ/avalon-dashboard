"use client"

const StatCard = ({ title, value, change, icon: Icon }) => (
  <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-[#A047FF]/50 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-lg bg-[#A047FF]/10">
        <Icon className="w-6 h-6 text-[#A047FF]" />
      </div>
      {change !== undefined && (
        <span className={`text-sm font-semibold ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white">{value}</p>
  </div>
);
export default StatCard;
