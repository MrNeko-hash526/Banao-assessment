import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Spinner, Text, Button } from '@chakra-ui/react';
import bgImage from '../assets/image.png';

type Signup = {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  userType?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  savedAt?: string;
  profileImage?: string;
};

export default function DocDash() {
  const [data, setData] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // search/preview removed per user request

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('http://localhost:5000/signups')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json && json.ok && Array.isArray(json.data)) {
          const doctors = json.data.filter((s: Signup) => (s.userType || '').toLowerCase() === 'doctor');
          setData(doctors);
        } else {
          setError('Invalid data from server');
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const latest = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data
      .slice()
      .sort((a, b) => (b.savedAt ? Date.parse(b.savedAt) : 0) - (a.savedAt ? Date.parse(a.savedAt) : 0))[0];
  }, [data]);

  const initials = (s?: Signup) => {
    if (!s) return '';
    const a = (s.firstName || '').trim();
    const b = (s.lastName || '').trim();
    return ((a[0] || '') + (b[0] || '')).toUpperCase();
  };

  const getImageUrl = (p?: string) => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return `http://localhost:5000${p}`;
  };

  const [showLatestDetails, setShowLatestDetails] = useState(false);

  return (
    <Box
      minH="100vh"
  bgImage={`linear-gradient(rgba(255,255,255,0.22), rgba(255,255,255,0.22)), url(${bgImage})`}
      bgSize="cover"
      bgPos="center"
      bgRepeat="no-repeat"
  color="black"
      py={10}
    >
      <Flex maxW="1100px" mx="auto" gap={6} px={4} direction={{ base: 'column', md: 'row' }}>
        <Box flex={1} p={6}>
          <Box mb={4}>
            <Heading size="lg">Doctor Signups</Heading>
            <Text fontSize="sm" color="gray.700">Showing signups filtered for doctors.</Text>
          </Box>

          {latest && (
      <Box mb={4} p={1} borderRadius="6px" bg="rgba(255,255,255,0.8)">
              <Flex alignItems="center" gap={4}>
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="teal.600"
                  fontWeight={700}
                  style={latest.profileImage ? { backgroundImage: `url(${getImageUrl(latest.profileImage)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                  {!latest.profileImage && initials(latest)}
                </Box>
                <Box flex={1}>
        <Text fontWeight={700} color="black">{(latest.firstName || '') + (latest.lastName ? ' ' + latest.lastName : '')}</Text>
                  <Text fontSize="sm" color="gray.700">{latest.email}</Text>
                  <Text fontSize="xs" color="gray.600">Saved: {latest.savedAt}</Text>
                </Box>
                <Box>
                  <Button
                    size="sm"
                    variant="solid"
                    colorScheme="teal"
                    bg="teal.600"
                    color="white"
                    px={4}
                    py={1}
                    boxShadow="sm"
                    _hover={{ bg: 'teal.700' }}
                    aria-label={showLatestDetails ? 'Hide latest details' : 'Show latest details'}
                    onClick={() => setShowLatestDetails((s) => !s)}
                  >
                    {showLatestDetails ? 'Hide' : 'Show more'}
                  </Button>
                </Box>
              </Flex>

              {showLatestDetails && (
                <Box mt={3} pl={12}>
        <Text fontSize="sm" color="black"><strong>Username:</strong> {latest.username || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>User Type:</strong> {latest.userType || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>Address:</strong> {latest.addressLine1 || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>City:</strong> {latest.city || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>State:</strong> {latest.state || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>Pincode:</strong> {latest.pincode || '-'}</Text>
        <Text fontSize="sm" color="black"><strong>Saved at:</strong> {latest.savedAt ? (() => { try { return new Date(latest.savedAt).toLocaleString(); } catch { return latest.savedAt; } })() : '-'}</Text>
                </Box>
              )}
            </Box>
          )}

          {loading && (
            <Box display="flex" alignItems="center" gap={3}><Spinner /> <Text>Loading...</Text></Box>
          )}
          {error && (
            <Text color="red.300">{error}</Text>
          )}

            {!loading && !error && (
              <Box overflowX="auto" borderWidth={1} borderRadius="8px" p={2} borderColor="rgba(0,0,0,0.06)" bg="rgba(255,255,255,0.20)">
                {/* <table style={{ width: '100%', borderCollapse: 'collapse', color: 'black' }}>
                <thead>
                  <tr>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Username</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>City</th>
                      <th style={{ textAlign: 'left', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>Saved At</th>
                  </tr>
                </thead>
                <tbody>
          {data.length === 0 && (
                    <tr>
            <td colSpan={5} style={{ padding: 16 }}><Text>No doctor signups found</Text></td>
                    </tr>
                  )}
            {data.map((d, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'black' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'teal', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', overflow: 'hidden' , backgroundColor: 'teal'}}>
                              {d.profileImage ? (
                                <img src={getImageUrl(d.profileImage)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span>{((d.firstName || '').charAt(0) + (d.lastName || '').charAt(0)).toUpperCase()}</span>
                              )}
                            </div>
                            <div>{(d.firstName || '') + (d.lastName ? ' ' + d.lastName : '')}</div>
                          </div>
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'black' }}>{d.email}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'black' }}>{d.username}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'black' }}>{d.city}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.06)', color: 'black' }}>{d.savedAt}</td>
                      </tr>
                    ))}
                </tbody>
              </table> */}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
