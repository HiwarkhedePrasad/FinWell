// IncomeList.jsx
import React from "react";

const IncomeList = ({ transactions, onDelete, onDownload }) => {
  return (
    <div className="income-list bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Income Records</h2>
        {onDownload && (
          <button
            onClick={onDownload}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Download Excel
          </button>
        )}
      </div>

      {Array.isArray(transactions) && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((item) => (
            <div
              key={item._id || item.id}
              className="income-item border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-gray-800">
                    <strong>{item.source || item.title}</strong> — ₹
                    {item.amount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.date
                      ? new Date(item.date).toLocaleDateString()
                      : "No date"}
                  </p>
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(item._id || item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No income records found</p>
        </div>
      )}
    </div>
  );
};

export default IncomeList;
