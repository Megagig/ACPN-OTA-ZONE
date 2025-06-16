import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Due {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  paymentStatus: string;
  pharmacyId: string;
  year: number;
}

interface DueFormProps {
  due?: Due;
  onSave: (data: Partial<Due>) => void;
  onClose: () => void;
}

const DueForm: React.FC<DueFormProps> = ({ due, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Due>>(
    due || { title: '', amount: 0, dueDate: '', description: '', pharmacyId: '', year: new Date().getFullYear() }
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{due ? 'Edit Due' : 'Assign New Due'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-3"
        >
          <input
            className="w-full border p-2 rounded"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="Amount"
            type="number"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
            required
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="Due Date"
            type="date"
            value={form.dueDate?.slice(0, 10) || ''}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            required
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="Pharmacy ID"
            value={form.pharmacyId}
            onChange={e => setForm(f => ({ ...f, pharmacyId: e.target.value }))}
            required
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDuesManagement: React.FC = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editDue, setEditDue] = useState<Due | undefined>(undefined);

  const fetchDues = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dues');
      setDues(res.data.data || []);
    } catch (err: any) {
      setError('Failed to fetch dues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this due?')) return;
    try {
      await axios.delete(`/api/dues/${id}`);
      setDues(dues => dues.filter(d => d._id !== id));
    } catch {
      setError('Failed to delete due');
    }
  };

  const handleSave = async (data: Partial<Due>) => {
    try {
      if (editDue) {
        // Edit
        await axios.put(`/api/dues/${editDue._id}`, data);
      } else {
        // Assign new
        await axios.post(`/api/pharmacies/${data.pharmacyId}/dues`, data);
      }
      setShowForm(false);
      setEditDue(undefined);
      fetchDues();
    } catch {
      setError('Failed to save due');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dues Management</h1>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      <button onClick={() => { setShowForm(true); setEditDue(undefined); }} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">Assign New Due</button>
      {loading ? <div>Loading...</div> : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Pharmacy ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dues.map(due => (
              <tr key={due._id}>
                <td className="px-4 py-2">{due.title}</td>
                <td className="px-4 py-2">₦{due.amount.toLocaleString()}</td>
                <td className="px-4 py-2">{due.dueDate.slice(0, 10)}</td>
                <td className="px-4 py-2">{due.pharmacyId}</td>
                <td className="px-4 py-2">{due.paymentStatus}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => { setEditDue(due); setShowForm(true); }} className="px-2 py-1 bg-yellow-400 text-white rounded">Edit</button>
                  <button onClick={() => handleDelete(due._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <DueForm due={editDue} onSave={handleSave} onClose={() => { setShowForm(false); setEditDue(undefined); }} />
      )}
    </div>
  );
};

export default AdminDuesManagement; 