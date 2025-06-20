import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { type ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Register ChartJS components
ChartJS.register(...registerables);

type ChartType = 'line' | 'bar' | 'pie' | 'doughnut';

interface ChartComponentProps {
  type: ChartType;
  data: any;
  options?: any;
  width?: number;
  height?: number;
  className?: string;
}

const ChartComponent = ({
  type,
  data,
  options = {},
  width,
  height,
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
  const defaultOptions = {
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

  return (
    <div
      className={`chart-container bg-card rounded-lg p-4 ${className || ''}`}
      style={{ height: height || 300, width: width || '100%' }}
    >
      <Chart type={type} data={data} options={mergedOptions} />
    </div>
  );
};

export default ChartComponent;
