import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import financialService from '../../services/financial.service';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { CalendarIcon, Download, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FinancialReport {
  id: string;
  type: string;
  period: string;
  totalAmount: number;
  generatedAt: string;
  summary?: Record<string, number>;
}

const FinancialReports: React.FC = () => {
  const [reportType, setReportType] = useState<'yearly' | 'monthly' | 'custom'>('monthly');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const { data: reports, isLoading, error, refetch } = useQuery<FinancialReport[]>({
    queryKey: ['financialReports', reportType, year, month, startDate, endDate],
    queryFn: () => financialService.getFinancialReports({
      reportType,
      ...(reportType === 'custom'
        ? {
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
          }
        : {
            year,
            month,
          }),
    }),
    enabled: reportType !== 'custom' || (!!startDate && !!endDate),
  });

  const handleDownload = async (reportId: string) => {
    try {
      const response = await financialService.downloadReport(reportId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleFilter = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('reports:', reports);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading financial reports. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex gap-4">
          <Select value={reportType} onValueChange={(value: 'yearly' | 'monthly' | 'custom') => setReportType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom Period</SelectItem>
            </SelectContent>
          </Select>

          {reportType === 'yearly' && (
            <Input
              type="number"
                value={year}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYear(parseInt(e.target.value))}
              className="w-[120px]"
              placeholder="Year"
            />
          )}

          {reportType === 'monthly' && (
            <>
              <Input
                type="number"
                  value={year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYear(parseInt(e.target.value))}
                className="w-[120px]"
                placeholder="Year"
              />
              <Input
                type="number"
                  value={month}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonth(parseInt(e.target.value))}
                className="w-[120px]"
                placeholder="Month"
                min={1}
                max={12}
              />
            </>
          )}

          {reportType === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}

          <Button onClick={handleFilter} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {Array.isArray(reports) && reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {report.type} Report - {report.period}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(report.id)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-semibold">{formatCurrency(report.totalAmount)}</span>
        </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Generated At</span>
                  <span className="text-sm">{format(new Date(report.generatedAt), 'PPP')}</span>
        </div>
                {report.summary && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Summary</h4>
                    <div className="grid gap-2">
                      {Object.entries(report.summary).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{key}</span>
                          <span className="text-sm">{formatCurrency(value)}</span>
        </div>
            ))}
          </div>
            </div>
                )}
          </div>
            </CardContent>
          </Card>
        ))}

        {(!Array.isArray(reports) || reports.length === 0) && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No financial reports found for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReports;
