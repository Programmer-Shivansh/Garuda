'use client';

import { useState, useEffect } from 'react';
import type { Coordinate } from '../types/coordinates';

export default function AdminPanel() {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Coordinate>>({});

  const fetchCoordinates = async () => {
    try {
      const response = await fetch('/api/admin/coordinates');
      const data = await response.json();
      if (data.success) {
        setCoordinates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
    }
  };

  const handleEdit = (coordinate: Coordinate) => {
    setEditingId(coordinate.id || null);
    setEditForm(coordinate);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/coordinates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setEditingId(null);
        fetchCoordinates();
      }
    } catch (error) {
      console.error('Failed to update coordinate:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/admin/coordinates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchCoordinates();
      }
    } catch (error) {
      console.error('Failed to delete coordinate:', error);
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Coordinate Management</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Latitude</th>
              <th className="px-4 py-2">Longitude</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coordinates.map(coord => (
              <tr key={coord.id} className="border-t">
                <td className="px-4 py-2">{coord.id}</td>
                <td className="px-4 py-2">
                  {editingId === coord.id ? (
                    <input
                      type="number"
                      value={editForm.latitude || ''}
                      onChange={e => setEditForm({
                        ...editForm,
                        latitude: parseFloat(e.target.value)
                      })}
                      className="border rounded px-2 py-1"
                    />
                  ) : coord.latitude}
                </td>
                <td className="px-4 py-2">
                  {editingId === coord.id ? (
                    <input
                      type="number"
                      value={editForm.longitude || ''}
                      onChange={e => setEditForm({
                        ...editForm,
                        longitude: parseFloat(e.target.value)
                      })}
                      className="border rounded px-2 py-1"
                    />
                  ) : coord.longitude}
                </td>
                <td className="px-4 py-2">
                  {editingId === coord.id ? (
                    <select
                      value={editForm.priority}
                      onChange={e => setEditForm({
                        ...editForm,
                        priority: e.target.value as Coordinate['priority']
                      })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="normal">Normal</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="severe">Severe</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded ${
                      coord.priority === 'severe' ? 'bg-red-100 text-red-800' :
                      coord.priority === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {coord.priority}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingId === coord.id ? (
                    <button
                      onClick={handleSave}
                      className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(coord)}
                      className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(coord.id!)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
