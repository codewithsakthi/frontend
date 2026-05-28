import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from 'recharts';

interface SkillMatrixChartProps {
  skills?: any[];
}

export const SkillMatrixChart: React.FC<SkillMatrixChartProps> = ({ skills = [] }) => {
  // If no skills are provided, we can render a beautiful empty state or some placeholder competencies
  const chartData = skills.length > 0 
    ? skills.map(s => ({
        name: s.skill_name,
        rating: s.self_rating || 5,
        ratingMax: 10,
        type: s.category || 'programming'
      }))
    : [
        { name: 'JavaScript', rating: 7, ratingMax: 10, type: 'programming' },
        { name: 'Python', rating: 8, ratingMax: 10, type: 'programming' },
        { name: 'React', rating: 6, ratingMax: 10, type: 'framework' },
        { name: 'PostgreSQL', rating: 7, ratingMax: 10, type: 'database' },
      ];

  const colors = {
    programming: 'var(--primary)',
    framework: 'var(--accent)',
    database: '#10b981',
    cloud: '#f59e0b',
    tool: '#8b5cf6',
    soft_skill: '#ec4899',
    other: '#6b7280'
  };

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.3} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 'bold' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} 
            domain={[0, 10]} 
          />
          <Tooltip
            contentStyle={{ 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              background: 'var(--card)',
              boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)'
            }}
            labelStyle={{ fontWeight: 'bold', fontSize: 11 }}
            itemStyle={{ fontSize: 10 }}
          />
          <Bar dataKey="rating" name="Rating" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => {
              const colorKey = (entry.type || 'other') as keyof typeof colors;
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[colorKey] || colors.other} 
                  opacity={0.85} 
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
