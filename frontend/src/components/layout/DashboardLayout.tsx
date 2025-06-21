import React, { useState } from 'react';
import { Box, useBreakpointValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ModernHeader from './ModernHeader';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Responsive sidebar behavior
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {/* Sidebar */}
      <Box
        display={isMobile && !isSidebarOpen ? 'none' : 'block'}
        position="fixed"
        zIndex={1000}
      >        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar}
        />
      </Box>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={999}
          onClick={closeSidebar}
        />
      )}

      {/* Main Content Area */}
      <Box
        ml={isMobile ? 0 : isSidebarOpen ? "280px" : "80px"}
        transition="margin-left 0.3s ease"
        minH="100vh"
      >
        {/* Header */}
        <ModernHeader 
          onMenuClick={toggleSidebar}
          isSidebarOpen={!isMobile && isSidebarOpen}
        />

        {/* Page Content */}        <Box
          pt="80px" // Header height
          p={6}
          minH="calc(100vh - 80px)"
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
