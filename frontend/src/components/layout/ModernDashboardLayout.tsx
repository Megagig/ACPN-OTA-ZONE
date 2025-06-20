import React, { useState } from 'react';
import { Box, useBreakpointValue } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import ModernSidebar from './ModernSidebar';
import ModernHeader from './ModernHeader';

const ModernDashboardLayout: React.FC = () => {
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
      >
        <ModernSidebar 
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

        {/* Page Content */}
        <Box
          pt="80px" // Header height
          p={6}
          minH="calc(100vh - 80px)"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ModernDashboardLayout;
