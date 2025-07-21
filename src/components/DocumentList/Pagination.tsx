import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-200
            ${currentPage === i 
              ? 'bg-gradient-to-r from-navy-blue to-[#004D99] text-white' 
              : 'text-dark-text hover:bg-hover-state'
            }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-secondary-bg p-4 rounded-lg shadow-card">
      {/* Items per page selector */}
      <div className="flex items-center space-x-3">
        <span className="text-slate-gray">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="p-2 border border-light-border rounded-md bg-primary-bg text-dark-text focus:outline-none focus:ring-2 focus:ring-navy-blue transition-all duration-200"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-slate-gray">entries</span>
      </div>

      {/* Items counter */}
      <div className="text-slate-gray text-sm">
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-slate-gray hover:text-dark-text hover:bg-hover-state disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-200"
        >
          <ChevronsLeft size={18} />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-slate-gray hover:text-dark-text hover:bg-hover-state disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-200"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {renderPageNumbers()}
        </div>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-slate-gray hover:text-dark-text hover:bg-hover-state disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-200"
        >
          <ChevronRight size={18} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-slate-gray hover:text-dark-text hover:bg-hover-state disabled:opacity-50 disabled:hover:bg-transparent transition-colors duration-200"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;