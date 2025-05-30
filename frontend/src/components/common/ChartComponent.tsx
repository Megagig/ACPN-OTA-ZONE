import { type ReactNode } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import type { ChartData, ChartOptions } from 'chart.js';

import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

interface ChartComponentProps {
  type: ChartType;
  data: ChartData<any>;
  options?: ChartOptions<any>;
  height?: number;
  width?: number;
  className?: string;
}

export const ChartComponent = ({
  type,
  data,
  options,
  height,
  width,
  className,
}: ChartComponentProps): ReactNode => {
  const { theme } = useTheme();

  // Get theme-aware colors
  const getThemeColors = () => {
    const isDark = theme === 'dark';
    return {
      textColor: isDark ? 'rgb(248 250 252)' : 'rgb(15 23 42)',
      gridColor: isDark ? 'rgb(51 65 85)' : 'rgb(226 232 240)',
      backgroundColor: isDark ? 'rgb(15 23 42)' : 'rgb(255 255 255)',
    };
  };

  const themeColors = getThemeColors();

  // Default chart options with theme support
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: themeColors.textColor,
        },
      },
      tooltip: {
        backgroundColor: themeColors.backgroundColor,
        titleColor: themeColors.textColor,
        bodyColor: themeColors.textColor,
        borderColor: themeColors.gridColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: themeColors.textColor,
        },
        grid: {
          color: themeColors.gridColor,
        },
      },
      y: {
        ticks: {
          color: themeColors.textColor,
        },
        grid: {
          color: themeColors.gridColor,
        },
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Render different chart types based on the 'type' prop
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={mergedOptions} />;
      case 'bar':
        return <Bar data={data} options={mergedOptions} />;
      case 'pie':
        return <Pie data={data} options={mergedOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={mergedOptions} />;
      default:
        return <Bar data={data} options={mergedOptions} />;
    }
  };

  return (
    <div
      className={`chart-container bg-card rounded-lg p-4 ${className || ''}`}
      style={{ height: height || 300, width: width || '100%' }}
    >
      {renderChart()}
    </div>
  );
};

export default ChartComponent;
