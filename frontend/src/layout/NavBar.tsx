import { useEffect, useState } from 'react';
import { Box, Flex, Text, Spinner, Button, HStack, Link } from '@chakra-ui/react';

type User = {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
};

const getImageUrl = (p?: string) => {
  if (!p) return '';
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `http://localhost:5000${p}`;
};

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.ok && json.user && mounted) {
            setUser(json.user);
            localStorage.setItem('user', JSON.stringify(json.user));
          }
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (mounted) setUser(null);
          window.location.assign('/login');
          return;
        }
      } catch (e) {
        console.error('navbar: fetch failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const initials = (u?: User | null) => {
    if (!u) return '';
    const a = (u.firstName || '').trim();
    const b = (u.lastName || '').trim();
    return ((a[0] || '') + (b[0] || '')).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.assign('/login');
  };

  return (
    <Box as="header" w="full" bg="black" px={6} py={4} boxShadow="sm">
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
        
        {/* Brand / Logo */}
        <Text fontWeight="extrabold" fontSize="2xl" color="white" letterSpacing="wide">
          Medi
          <Box as="span" color="teal.400">Mind</Box>
        </Text>

        {/* Categories */}
        <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
          <Link href="/category/mental-health" fontSize="sm" color="white" _hover={{ color: 'teal.400' }}>
            Mental Health
          </Link>
          <Link href="/category/heart-disease" fontSize="sm" color="white" _hover={{ color: 'teal.400' }}>
            Heart Disease
          </Link>
          <Link href="/category/covid19" fontSize="sm" color="white" _hover={{ color: 'teal.400' }}>
            Covid19
          </Link>
          <Link href="/category/immunization" fontSize="sm" color="white" _hover={{ color: 'teal.400' }}>
            Immunization
          </Link>
        </HStack>

        {/* Profile + Logout */}
        <Flex align="center" gap={4}>
          {loading ? (
            <Spinner size="sm" color="teal.400" />
          ) : (
            <>
              <Flex align="center" gap={3}>
                <Box textAlign="right">
                  <Text fontSize="sm" fontWeight={600} color="white">
                    {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest'}
                  </Text>
                  <Text fontSize="xs" color="gray.400">{user?.email || ''}</Text>
                </Box>
                <Box
                  w="40px"
                  h="40px"
                  borderRadius="50%"
                  bg="teal.500"
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight={700}
                  style={user?.profileImage
                    ? {
                        backgroundImage: `url(${getImageUrl(user.profileImage)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : {}
                  }
                >
                  {!user?.profileImage && <Text fontSize="sm">{initials(user)}</Text>}
                </Box>
              </Flex>

              {user && (
                <Button
                  size="sm"
                  variant="solid"
                  bg="teal.500"
                  color="white"
                  _hover={{ bg: 'teal.600' }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
