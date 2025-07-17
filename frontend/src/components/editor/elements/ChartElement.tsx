import React from 'react';
import { ChartElement as ChartElementType, Quiz } from '../../../types/editor';
import { cn } from '../../../lib/utils';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

interface ChartElementProps {
  element: ChartElementType;
  isEditing: boolean;
  onUpdate: (updates: Partial<ChartElementType>) => void;
  onEndEdit: () => void;
  quizSettings: Quiz['settings'];
}

export const ChartElement: React.FC<ChartElementProps> = ({
  element,
  isEditing,
  onUpdate,
  onEndEdit,
  quizSettings,
}) => {
  const renderBarChart = () => {
    const maxValue = Math.max(...element.data.datasets[0].data);
    
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-2 h-48">
          {element.data.labels.map((label, index) => {
            const value = element.data.datasets[0].data[index];
            const height = (value / maxValue) * 100;
            const color = element.data.datasets[0].backgroundColor?.[index] || '#3b82f6';
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: '4px',
                  }}
                />
                <span className="text-xs text-gray-600 mt-2">{label}</span>
                <span className="text-xs text-gray-500">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = element.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    let cumulativeAngle = 0;
    
    const slices = element.data.datasets[0].data.map((value, index) => {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;
      
      return {
        label: element.data.labels[index],
        value,
        percentage,
        angle,
        startAngle,
        color: element.data.datasets[0].backgroundColor?.[index] || `hsl(${index * 60}, 70%, 50%)`,
      };
    });

    return (
      <div className="flex items-center gap-8">
        <div className="w-48 h-48 relative">
          <svg width="192" height="192" viewBox="0 0 192 192">
            <circle cx="96" cy="96" r="80" fill="none" stroke="#e5e7eb" strokeWidth="2" />
            {slices.map((slice, index) => {
              const radius = 80;
              const x1 = 96 + radius * Math.cos((slice.startAngle - 90) * Math.PI / 180);
              const y1 = 96 + radius * Math.sin((slice.startAngle - 90) * Math.PI / 180);
              const x2 = 96 + radius * Math.cos((slice.startAngle + slice.angle - 90) * Math.PI / 180);
              const y2 = 96 + radius * Math.sin((slice.startAngle + slice.angle - 90) * Math.PI / 180);
              
              const largeArc = slice.angle > 180 ? 1 : 0;
              
              return (
                <path
                  key={index}
                  d={`M 96 96 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-sm text-gray-700">{slice.label}</span>
              <span className="text-xs text-gray-500">
                {slice.value} ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Configurações do Gráfico</h3>
            <button onClick={onEndEdit} className="text-xs text-gray-500 hover:text-gray-700">
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {element.title && (
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            {element.title}
          </h3>
        )}
        
        {element.chartType === 'bar' && renderBarChart()}
        {element.chartType === 'pie' && renderPieChart()}
        {element.chartType === 'donut' && renderPieChart()}
        
        {element.showLegend && element.chartType !== 'pie' && (
          <div className="flex justify-center gap-4 mt-4">
            {element.data.datasets.map((dataset, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: dataset.backgroundColor?.[0] || '#3b82f6' }}
                />
                <span className="text-sm text-gray-700">{dataset.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};