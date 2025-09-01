import React, { createContext, useContext, useState, useCallback } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

type Status = 'info' | 'success' | 'warning' | 'error';

type Toast = {
  id: string;
  title: string;
  description?: string;
  status?: Status;
  duration?: number;
};

const ToastContext = createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: Toast = { id, duration: 4500, ...t };
    setToasts((s) => [toast, ...s]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, toast.duration);
    }
  }, []);

  const remove = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const iconFor = (status?: Status) => {
    const style: React.CSSProperties = { fontSize: 18 };
    switch (status) {
      case 'success':
        return <span style={{ ...style }}>✅</span>;
      case 'error':
        return <span style={{ ...style }}>❌</span>;
      case 'warning':
        return <span style={{ ...style }}>⚠️</span>;
      default:
        return <span style={{ ...style }}>ℹ️</span>;
    }
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <Box position="fixed" top={4} right={4} zIndex={9999}>
        <Flex direction="column" gap={3}>
          {toasts.map((t) => (
            <Flex key={t.id} minW="300px" bg="white" boxShadow="md" borderRadius="8px" overflow="hidden">
              <Flex align="center" px={3} py={3} bg={t.status === 'success' ? 'green.50' : t.status === 'error' ? 'red.50' : t.status === 'warning' ? 'orange.50' : 'blue.50'}>
                <Box mr={3} aria-hidden>
                  {iconFor(t.status)}
                </Box>
              </Flex>
              <Box p={3} flex="1">
                <Text fontWeight="600">{t.title}</Text>
                {t.description && <Text fontSize="sm" color="gray.600">{t.description}</Text>}
              </Box>
              <Box display="flex" alignItems="start" p={2}>
                <Box as="button" onClick={() => remove(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }} aria-label="close">×</Box>
              </Box>
            </Flex>
          ))}
        </Flex>
      </Box>
    </ToastContext.Provider>
  );
};

export const useCustomToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useCustomToast must be used within ToastProvider');
  return ctx.push;
};
