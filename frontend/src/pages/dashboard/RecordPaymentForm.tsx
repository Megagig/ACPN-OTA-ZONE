import React, { useState, useEffect } from 'react';
import financialService from '../../services/financial.service';
import pharmacyService from '../../services/pharmacy.service';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const RecordPaymentForm: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [selectedDue, setSelectedDue] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const paymentTypes = [
    { value: 'due', label: 'Dues' },
    { value: 'donation', label: 'Donation' },
    { value: 'event_fee', label: 'Event Fee' },
    { value: 'registration_fee', label: 'Registration Fee' },
    { value: 'conference_fee', label: 'Conference Fee' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'building', label: 'Building' },
    { value: 'other', label: 'Other' },
  ];
  const [paymentType, setPaymentType] = useState('due');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [participant, setParticipant] = useState('');
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    pharmacyService.getPharmacies(1, 100).then(res => setPharmacies(res.pharmacies));
  }, []);

  useEffect(() => {
    if (selectedPharmacy && paymentType === 'due') {
      financialService.getRealDues({ pharmacyId: selectedPharmacy, paymentStatus: undefined }).then((res) => {
        setDues(res.dues || []);
      });
    } else {
      setDues([]);
    }
  }, [selectedPharmacy, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy || !amount || !paymentMethod || !receipt) {
      toast.error('Please fill all required fields and upload a receipt.');
      return;
    }
    if (paymentType === 'due' && !selectedDue) {
      toast.error('Please select a due.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentType', paymentType);
      formData.append('pharmacyId', selectedPharmacy);
      formData.append('amount', amount);
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference);
      formData.append('receipt', receipt);
      if (paymentType === 'due') formData.append('dueId', selectedDue);
      if (purpose) formData.append('purpose', purpose);
      if (description) formData.append('description', description);
      if (participant) formData.append('participant', participant);
      if (eventId) formData.append('eventId', eventId);
      await financialService.recordPayment(formData);
      toast.success('Payment recorded successfully!');
      navigate('/finances/payment-history');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg p-6 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4">Record New Payment</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Payment Type</label>
          <select
            className="w-full border p-2 rounded"
            value={paymentType}
            onChange={e => setPaymentType(e.target.value)}
            required
          >
            {paymentTypes.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Pharmacy</label>
          <select
            className="w-full border p-2 rounded"
            value={selectedPharmacy}
            onChange={e => setSelectedPharmacy(e.target.value)}
            required
          >
            <option value="">Select Pharmacy</option>
            {pharmacies.map(pharm => (
              <option key={pharm._id} value={pharm._id}>{pharm.name}</option>
            ))}
          </select>
        </div>
        {paymentType === 'due' && (
          <div>
            <label className="block mb-1 font-medium">Due</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedDue}
              onChange={e => setSelectedDue(e.target.value)}
              required
              disabled={!selectedPharmacy}
            >
              <option value="">Select Due</option>
              {dues.map(due => (
                <option key={due._id} value={due._id}>{due.title} (₦{due.amount})</option>
              ))}
            </select>
          </div>
        )}
        {paymentType === 'event_fee' && (
          <div>
            <label className="block mb-1 font-medium">Event ID</label>
            <input
              className="w-full border p-2 rounded"
              type="text"
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              placeholder="Enter Event ID or Name"
              required
            />
            <label className="block mb-1 font-medium mt-2">Participant</label>
            <input
              className="w-full border p-2 rounded"
              type="text"
              value={participant}
              onChange={e => setParticipant(e.target.value)}
              placeholder="Participant Name"
            />
          </div>
        )}
        {(paymentType === 'donation' || paymentType === 'other' || paymentType === 'conference_fee' || paymentType === 'accommodation' || paymentType === 'seminar' || paymentType === 'transportation' || paymentType === 'building' || paymentType === 'registration_fee') && (
          <div>
            <label className="block mb-1 font-medium">Purpose</label>
            <input
              className="w-full border p-2 rounded"
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Purpose/Title"
              required
            />
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium">Amount</label>
          <input
            className="w-full border p-2 rounded"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Payment Method</label>
          <select
            className="w-full border p-2 rounded"
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            required
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="mobile_payment">Mobile Payment</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Payment Reference</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={paymentReference}
            onChange={e => setPaymentReference(e.target.value)}
            placeholder="e.g. Bank transaction ID"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Receipt Upload</label>
          <input
            className="w-full border p-2 rounded"
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setReceipt(e.target.files?.[0] || null)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
      </form>
    </div>
  );
};

export default RecordPaymentForm; 