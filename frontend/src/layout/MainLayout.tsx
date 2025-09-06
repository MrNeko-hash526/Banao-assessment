import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

import { Box } from '@chakra-ui/react';

export default function MainLayout() {
  return (
    <>
      <NavBar />
      <Box display="flex" minH="calc(100vh - 64px)" width="full">
        {/* make routed content full-bleed; individual pages provide their own inner padding */}
        <Box flex={1} p={0}>
          <Outlet />
        </Box>
      </Box>
    </>
  );
}

