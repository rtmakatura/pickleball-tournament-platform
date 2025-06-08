// src/components/ui/Table.jsx
import React from 'react';

/**
 * Table Component - A reusable data table
 * 
 * Props:
 * - columns: array - Column definitions [{key, label, render?}]
 * - data: array - Array of data objects to display
 * - loading: boolean - Shows loading state
 * - emptyMessage: string - Message when no data
 * - onRowClick: function - Called when row is clicked
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = ''
}) => {
  // Show loading state
  if (loading) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (data.length === 0) {
    return (
      <div className="border rounded-lg">
        <div className="p-8 text-center text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={`
                  ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  transition-colors duration-150
                `}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {/* Use custom render function if provided, otherwise show raw data */}
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * TableActions Component - For action buttons in table cells
 * Usage: <TableActions actions={[{label: 'Edit', onClick: () => {}}, ...]} />
 */
export const TableActions = ({ actions = [] }) => (
  <div className="flex space-x-2">
    {actions.map((action, index) => (
      <button
        key={index}
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click when clicking action
          action.onClick();
        }}
        className={`
          px-2 py-1 text-xs rounded font-medium transition-colors
          ${action.variant === 'danger' 
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        {action.label}
      </button>
    ))}
  </div>
);

export default Table;