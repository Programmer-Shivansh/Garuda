'use client';

import React from 'react';
import type { Coordinate } from '../types/coordinates';

interface StatsSidebarProps {
  coordinates: Coordinate[];
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({ coordinates }) => {
  const stats = coordinates.reduce(
    (acc, coord) => {
      acc[coord.priority] = (acc[coord.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="absolute left-0 top-0 h-full w-72 bg-white/95 backdrop-blur-md p-6 shadow-xl z-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Live Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time incident monitoring</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
            <h3 className="text-red-800 font-semibold mb-2">Critical Incidents</h3>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-red-900">{stats.severe || 0}</span>
              <span className="px-3 py-1 bg-red-200/50 text-red-800 rounded-full text-sm">
                Severe
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <h3 className="text-yellow-800 font-semibold mb-2">Moderate Incidents</h3>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-yellow-900">{stats.intermediate || 0}</span>
              <span className="px-3 py-1 bg-yellow-200/50 text-yellow-800 rounded-full text-sm">
                Intermediate
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
            <h3 className="text-green-800 font-semibold mb-2">Minor Incidents</h3>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold text-green-900">{stats.normal || 0}</span>
              <span className="px-3 py-1 bg-green-200/50 text-green-800 rounded-full text-sm">
                Normal
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-blue-800">Total Incidents</p>
              <p className="text-2xl font-bold text-blue-900">{coordinates.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSidebar;
