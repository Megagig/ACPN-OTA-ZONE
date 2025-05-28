import React, { useState, useEffect } from 'react';
import {
  generateCertificatePDF,
  getClearanceCertificate,
} from '../../services/financial.service';
import type { CertificateData } from '../../types/financial.types';

interface CertificateViewProps {
  dueId: string;
  isVisible: boolean;
  onClose: () => void;
}

const CertificateView: React.FC<CertificateViewProps> = ({
  dueId,
  isVisible,
  onClose,
}) => {
  const [certificateData, setCertificateData] =
    useState<CertificateData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch certificate data
  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClearanceCertificate(dueId);
      setCertificateData(data);
    } catch (err: any) {
      console.error('Error loading certificate:', err);

      // Handle different error scenarios with user-friendly messages
      if (err.response) {
        if (err.response.status === 404) {
          setError('Certificate not found. The due might not exist.');
        } else if (err.response.status === 400) {
          setError(
            'Certificate not available. The due might not be marked as fully paid in the system.'
          );
        } else if (err.response.data && err.response.data.error) {
          setError(err.response.data.error);
        } else {
          setError(
            'Certificate not available. Please contact an administrator.'
          );
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load certificate data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Download certificate as PDF
  const handleDownloadCertificate = async () => {
    if (!certificateData) return;

    try {
      setLoading(true);
      const pdfBlob = await generateCertificatePDF(certificateData);

      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ACPN_Certificate_${certificateData.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Failed to download certificate');
      console.error('Error downloading certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load certificate data when modal becomes visible
  useEffect(() => {
    if (isVisible && dueId) {
      fetchCertificateData();
    }
  }, [isVisible, dueId]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <svg
                className="w-6 h-6 text-green-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Clearance Certificate
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="ml-3 text-gray-600">Loading certificate data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-red-700 font-medium">
                    Certificate Error
                  </h3>
                  <p className="text-red-700 mt-1">{error}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Note: Certificates are only available for fully paid dues.
                    Please contact administration if you believe this is an
                    error.
                  </p>
                </div>
              </div>
            </div>
          ) : certificateData ? (
            <div className="relative">
              {/* Certificate Preview */}
              <div className="border-4 border-green-700 border-double p-8 mb-6 bg-gray-50 relative">
                <div className="absolute top-2 right-2 text-xs text-gray-400">
                  PREVIEW
                </div>

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <p className="text-6xl font-bold text-green-700 transform rotate-45">
                    ACPN OTA ZONE
                  </p>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <img
                      src="/api/static/assets/acpn-logo.png"
                      alt="ACPN Logo"
                      className="h-24 w-auto object-contain"
                      onError={(e) => {
                        // If logo fails to load, replace with a text placeholder
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite error loop
                        target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className =
                          'h-24 w-24 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center';
                        placeholder.innerHTML =
                          '<span class="text-green-700 font-bold text-sm text-center">ACPN<br/>OTA ZONE</span>';
                        target.parentNode?.appendChild(placeholder);
                      }}
                    />
                  </div>
                  <h1 className="text-3xl font-bold text-green-700 mb-2 uppercase tracking-wider">
                    Clearance Certificate
                  </h1>
                  <div className="w-32 h-1 bg-green-700 mx-auto mb-2"></div>
                  <p className="text-xl font-semibold text-gray-800">
                    Pharmaceutical Society of Nigeria
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    ACPN Ota Zone
                  </p>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                  <p className="mb-2 text-gray-700">This is to certify that:</p>
                  <p className="text-2xl font-bold mb-4 text-green-800 border-b-2 border-green-200 pb-2 inline-block px-4">
                    {certificateData.pharmacyName}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    has fulfilled all financial obligations to the Association
                    of Community Pharmacists of Nigeria, Ota Zone, pertaining to
                    the{' '}
                    <span className="font-semibold">
                      {certificateData.dueType}
                    </span>{' '}
                    for{' '}
                    <span className="font-semibold">
                      {new Date(certificateData.paidDate).getFullYear()}
                    </span>
                    .
                  </p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-green-50 p-4 rounded-lg border border-green-100">
                  <div>
                    <p className="mb-2">
                      <span className="font-semibold text-green-700">
                        Certificate Number:
                      </span>{' '}
                      <span className="text-gray-800 font-mono">
                        {certificateData.certificateNumber}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-green-700">
                        Due Type:
                      </span>{' '}
                      <span className="text-gray-800">
                        {certificateData.dueType}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2">
                      <span className="font-semibold text-green-700">
                        Amount Paid:
                      </span>{' '}
                      <span className="text-gray-800 font-medium">
                        <span className="font-bold naira-symbol">₦</span>{' '}
                        {certificateData.amount.toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-green-700">
                        Payment Date:
                      </span>{' '}
                      <span className="text-gray-800">
                        {new Date(certificateData.paidDate).toLocaleDateString(
                          'en-NG',
                          { day: '2-digit', month: 'long', year: 'numeric' }
                        )}
                      </span>
                    </p>
                    <p className="mb-2">
                      <span className="font-semibold text-green-700">
                        Valid Until:
                      </span>{' '}
                      <span className="text-gray-800">
                        {new Date(
                          certificateData.validUntil
                        ).toLocaleDateString('en-NG', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Signature Area */}
                <div className="flex justify-between mt-16">
                  <div className="text-center">
                    <div className="border-t-2 border-black w-40 mx-auto"></div>
                    <p className="mt-1 font-medium text-gray-700">Chairman</p>
                    <p className="text-xs text-gray-500">ACPN Ota Zone</p>
                  </div>

                  {/* Official Stamp Placeholder */}
                  <div className="flex items-center justify-center">
                    <div className="h-24 w-24 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center">
                      <p className="text-xs text-gray-400">OFFICIAL STAMP</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="border-t-2 border-black w-40 mx-auto"></div>
                    <p className="mt-1 font-medium text-gray-700">Secretary</p>
                    <p className="text-xs text-gray-500">ACPN Ota Zone</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 mt-8">
                  <p>
                    This certificate is issued in accordance with the
                    regulations of the
                  </p>
                  <p>
                    Association of Community Pharmacists of Nigeria (ACPN) Ota
                    Zone.
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:bg-green-300 shadow-md"
                >
                  {loading ? 'Generating PDF...' : 'Download Certificate'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No certificate data available
              </h3>
              <p className="mt-1 text-gray-500">
                We couldn't find certificate data for this due.
              </p>
              <button
                onClick={fetchCertificateData}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
