import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import pharmacyService from '../../services/pharmacy.service';
import financialService from '../../services/financial.service';
import type { Pharmacy } from '../../types/pharmacy.types';
import type { DueType } from '../../types/pharmacy.types';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  onSave: (data: Partial<Due> & { pharmacyId: string; dueTypeId: string }) => void;
  onClose: () => void;
  dueTypes: DueType[];
}

const DueForm: React.FC<DueFormProps> = ({ due, onSave, onClose, dueTypes }) => {
  const [form, setForm] = useState<Partial<Due> & { pharmacyId: string; dueTypeId: string }>(
    due
      ? { ...due, pharmacyId: due.pharmacyId, dueTypeId: (due as any).dueTypeId || '' }
      : { title: '', amount: 0, dueDate: '', description: '', pharmacyId: '', dueTypeId: '', year: new Date().getFullYear() }
  );
  const [pharmacyQuery, setPharmacyQuery] = useState('');
  const [pharmacyResults, setPharmacyResults] = useState<Pharmacy[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);

  useEffect(() => {
    if (pharmacyQuery.length < 2) {
      setPharmacyResults([]);
      return;
    }
    setPharmacyLoading(true);
    pharmacyService.searchPharmacies(pharmacyQuery).then((results) => {
      setPharmacyResults(results);
      setPharmacyLoading(false);
    });
  }, [pharmacyQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{due ? 'Edit Due' : 'Assign New Due'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave(form);
          }}
          className="space-y-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
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
          <select
            className="w-full border p-2 rounded"
            value={form.dueTypeId}
            onChange={e => setForm(f => ({ ...f, dueTypeId: e.target.value }))}
            required
          >
            <option value="">Select Due Type</option>
            {dueTypes.map(dt => (
              <option key={dt._id} value={dt._id}>{dt.name}</option>
            ))}
          </select>
          <input
            className="w-full border p-2 rounded"
            placeholder="Search Pharmacy by name..."
            value={pharmacyQuery}
            onChange={e => setPharmacyQuery(e.target.value)}
            autoComplete="off"
            required={!due}
            disabled={!!due}
          />
          {pharmacyLoading && <div className="text-xs text-gray-500">Searching...</div>}
          {pharmacyResults.length > 0 && (
            <div className="border rounded bg-white max-h-32 overflow-y-auto">
              {pharmacyResults.map(pharm => (
                <div
                  key={pharm._id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => {
                    setForm(f => ({ ...f, pharmacyId: pharm._id }));
                    setPharmacyQuery(pharm.name);
                    setPharmacyResults([]);
                  }}
                >
                  {pharm.name} ({pharm.registrationNumber})
                </div>
              ))}
            </div>
          )}
          <input type="hidden" value={form.pharmacyId} />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 col-span-full">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded w-full sm:w-auto">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDuesManagement: React.FC = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDue, setEditDue] = useState<Due | undefined>(undefined);
  const [dueTypes, setDueTypes] = useState<DueType[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchDues = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/api/dues', {
        params: { page, limit: itemsPerPage, search },
      });
      setDues(res.data.data.filter((due: any) => !due.isDeleted));
      setTotalPages(res.data.pagination.totalPages);
    } catch (err: any) {
      console.error('Error fetching dues:', err);
      toast.error('Failed to fetch dues. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, [page, search]);

  useEffect(() => {
    financialService.getDueTypes().then(setDueTypes);
  }, []);

  const handleDelete = async (id: string) => {
    toast.info('Deleting due...');
    try {
      await api.delete(`/api/dues/${id}`);
      setDues((prev) => prev.filter((d) => d._id !== id));
      toast.success('Due deleted successfully.');
      fetchDues();
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setDues((prev) => prev.filter((d) => d._id !== id));
        toast.info('Due was already deleted.');
      } else {
        toast.error('Failed to delete due');
      }
    }
  };

  const handleSave = async (data: Partial<Due> & { pharmacyId: string; dueTypeId: string }) => {
    try {
      if (editDue) {
        // Edit
        await api.put(`/api/dues/${editDue._id}`, data);
        toast.success('Due updated successfully');
      } else {
        // Assign new
        await api.post(`/api/pharmacies/${data.pharmacyId}/dues`, data);
        toast.success('Due assigned successfully');
      }
      setShowForm(false);
      setEditDue(undefined);
      fetchDues();
    } catch (err: any) {
      console.error('Error submitting due:', err);
      toast.error(err.response?.data?.message || 'Failed to submit due');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dues Management</h1>
      <div className="flex items-center mb-4 space-x-2">
        <input
          className="border p-2 rounded"
          placeholder="Search dues by title or pharmacy..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button onClick={() => { setShowForm(true); setEditDue(undefined); }} className="px-4 py-2 bg-blue-600 text-white rounded">Assign New Due</button>
      </div>
      {isLoading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-2 whitespace-nowrap">Title</th>
                <th className="px-2 py-2 whitespace-nowrap">Amount</th>
                <th className="px-2 py-2 whitespace-nowrap">Due Date</th>
                <th className="px-2 py-2 whitespace-nowrap">Pharmacy</th>
                <th className="px-2 py-2 whitespace-nowrap">Due Type</th>
                <th className="px-2 py-2 whitespace-nowrap">Status</th>
                <th className="px-2 py-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dues.map(due => (
                <tr key={due._id}>
                  <td className="px-2 py-2 whitespace-nowrap">{due.title}</td>
                  <td className="px-2 py-2 whitespace-nowrap">₦{due.amount.toLocaleString()}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{due.dueDate.slice(0, 10)}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{(due as any).pharmacyName || (due as any).pharmacyId?.name || due.pharmacyId}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{(due as any).dueTypeName || (due as any).dueTypeId?.name || (due as any).dueTypeId || ''}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      due.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      due.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      due.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {due.paymentStatus.charAt(0).toUpperCase() + due.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap space-x-2 flex flex-col sm:flex-row">
                    <button onClick={() => { setEditDue(due); setShowForm(true); }} className="px-2 py-1 mb-1 sm:mb-0 bg-yellow-400 text-white rounded w-full sm:w-auto">Edit</button>
                    <button onClick={() => handleDelete(due._id)} className="px-2 py-1 bg-red-600 text-white rounded w-full sm:w-auto">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <button
            key={pageNum}
            onClick={() => setPage(pageNum)}
            className={`px-3 py-1 rounded ${pageNum === page ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      {showForm && (
        <DueForm due={editDue} onSave={handleSave} onClose={() => { setShowForm(false); setEditDue(undefined); }} dueTypes={dueTypes} />
      )}
    </div>
  );
};

export default AdminDuesManagement; 