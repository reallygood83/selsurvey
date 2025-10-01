// SEL 5개 영역 레이더 차트
'use client';

import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface SELRadarChartProps {
  scores: {
    selfAwareness: number;     // 자기인식
    selfManagement: number;    // 자기관리
    socialAwareness: number;   // 사회인식
    relationshipSkills: number; // 관계기술
    responsibleDecision: number; // 책임의식
  };
  className?: string;
}

export default function SELRadarChart({ scores, className = '' }: SELRadarChartProps) {
  const data = {
    labels: ['자기인식', '자기관리', '사회인식', '관계기술', '책임의식'],
    datasets: [
      {
        label: 'SEL 역량 점수',
        data: [
          scores.selfAwareness,
          scores.selfManagement,
          scores.socialAwareness,
          scores.relationshipSkills,
          scores.responsibleDecision
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        min: 0,
        ticks: {
          stepSize: 20,
          font: {
            size: 12
          }
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.r}점`;
          }
        }
      }
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg border ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-center">SEL 5개 영역 분석</h3>
      <div className="max-w-md mx-auto">
        <Radar data={data} options={options} />
      </div>

      {/* 점수 요약 */}
      <div className="mt-6 grid grid-cols-5 gap-2 text-center">
        {Object.entries(scores).map(([key, value], index) => {
          const labels = ['자기인식', '자기관리', '사회인식', '관계기술', '책임의식'];
          const colors = ['bg-purple-100 text-purple-800', 'bg-blue-100 text-blue-800',
                         'bg-green-100 text-green-800', 'bg-orange-100 text-orange-800',
                         'bg-pink-100 text-pink-800'];

          return (
            <div key={key} className={`p-2 rounded ${colors[index]}`}>
              <div className="text-xs font-medium">{labels[index]}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
