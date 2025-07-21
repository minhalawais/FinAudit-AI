import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-[#E2E8F0] h-16 shadow-sm fixed w-full top-0 z-50">
      <div className="h-full px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#003366] to-[#004D99] bg-clip-text text-transparent">
            FinAudit AI
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative group">
            <Bell 
              className="w-5 h-5 text-[#64748B] group-hover:text-[#003366] transition-colors cursor-pointer" 
            />
            <span className="absolute -top-2 -right-2 bg-[#DC2626] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-4 cursor-pointer group">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-[#1E293B] group-hover:text-[#003366] transition-colors">John Doe</span>
              <span className="text-xs text-[#64748B]">Admin</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:border-[#003366] transition-colors">
              <User className="w-5 h-5 text-[#64748B] group-hover:text-[#003366]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;