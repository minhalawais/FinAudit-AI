import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarExpanded(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarExpanded(false);
    }
  }, [location.pathname, isMobile]);

  // Determine if current route needs full-width layout
  const isFullWidthRoute = () => {
    const fullWidthRoutes = [
      '/audits/create',
      '/auditor/dashboard',
      '/auditee/dashboard',
      '/compliance',
      '/auditors/performance'
    ];
    return fullWidthRoutes.some(route => location.pathname.includes(route));
  };

  // Determine if current route is an audit-related route
  const isAuditRoute = () => {
    return location.pathname.includes('/audit') || 
           location.pathname.includes('/compliance') ||
           location.pathname.includes('/findings');
  };

  // Handle sidebar overlay for mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarExpanded) {
      setSidebarExpanded(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <Header 
          onMenuToggle={() => setSidebarExpanded(!sidebarExpanded)}
          sidebarExpanded={sidebarExpanded}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          ${isMobile ? 'fixed' : 'relative'} 
          left-0 h-full z-40 transition-all duration-300 ease-in-out
          ${sidebarExpanded ? 'translate-x-0' : isMobile ? '-translate-x-full' : '-translate-x-56'}
          ${isMobile ? 'w-64' : 'w-64'}
        `}>
          <Sidebar 
            isExpanded={sidebarExpanded}
            onExpandToggle={setSidebarExpanded}
            isMobile={isMobile}
            currentPath={location.pathname}
          />
        </div>

        {/* Main Content */}
        <main className={`
          flex-1 transition-all duration-300 ease-in-out overflow-hidden
          ${!isMobile && sidebarExpanded ? 'ml-0' : 'ml-0'}
          ${isAuditRoute() ? 'bg-gray-50' : 'bg-white'}
        `}>
          {/* Content Container */}
          <div className="h-full flex flex-col">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className={`
                ${isFullWidthRoute() ? 'w-full' : 'max-w-8xl mx-auto'} 
                ${isAuditRoute() ? 'p-4 lg:p-6' : 'p-6'}
                min-h-full
              `}>
                {/* Content Wrapper */}
                <div className={`
                  ${isAuditRoute() ? 'space-y-4' : 'space-y-6'}
                  ${isFullWidthRoute() ? 'h-full' : ''}
                `}>
                  {/* Main Content */}
                  <div className={`
                    ${isAuditRoute() ? 
                      'bg-white rounded-lg shadow-sm border border-gray-200' : 
                      'bg-white rounded-xl shadow-sm border border-gray-200'
                    }
                    ${isFullWidthRoute() ? 'h-full flex flex-col' : ''}
                    overflow-hidden
                  `}>
                    {children}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer for Audit Routes */}
            {isAuditRoute() && (
              <div className="bg-white border-t border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Audit Management System</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }

        /* Smooth transitions for all layout elements */
        * {
          transition-property: margin, padding, transform, opacity;
          transition-duration: 200ms;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Audit-specific styling */
        .audit-layout {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        /* Mobile-first responsive design */
        @media (max-width: 768px) {
          .mobile-padding {
            padding: 1rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .border-gray-200 {
            border-color: #000;
          }
          
          .text-gray-500 {
            color: #000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            transition-duration: 0.01ms !important;
          }
        }

        /* Focus management for accessibility */
        .focus-visible:focus {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-full-width {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
