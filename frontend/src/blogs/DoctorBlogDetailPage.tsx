import { useEffect, useState, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Heading, Text, Image, Spinner, Button, VStack, HStack, Avatar, Divider, useToast } from '@chakra-ui/react';
import { getUserFromToken } from '../utils/auth';
import { checkIsDoctor } from '../utils/auth';

export default function DoctorBlogDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const errorShown = useRef(false);
  const toast = useToast();
  const [blog, setBlog] = useState<any | null>(null);

  // compute user & role before effect to avoid stale captures
  let rawUser: any = null;
  try {
    rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  } catch (e) {
    rawUser = null;
  }
  if (!rawUser) rawUser = getUserFromToken();
  const isDoctor = checkIsDoctor(rawUser);

  const lastFetchedId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    // if not a doctor, skip fetch
    if (!isDoctor) {
      setLoading(false);
      return;
    }
  // avoid duplicate fetches for same id (React StrictMode can mount/unmount twice)
  // NOTE: don't mark as fetched until we actually complete a fetch —
  // marking too early combined with StrictMode unmount will abort the
  // in-progress request and the remount will skip fetching.
  if (lastFetchedId.current === id) return;

  const controller = new AbortController();
    let mounted = true;
    const load = async () => {
      try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`http://localhost:5000/blogs/${id}`, { signal: controller.signal, headers });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Failed to fetch blog: ${res.status} ${res.statusText} ${text}`);
        }
        const json = await res.json();
        if (mounted) {
          setBlog(json?.blog || json?.data || json || null);
          // mark as fetched only after successful load
          lastFetchedId.current = id;
        }
      } catch (e) {
        if ((e as any).name === 'AbortError') return;
        console.error('DoctorBlogDetailPage load error:', e);
        if (!errorShown.current) {
          const message = (e && (e as any).message) ? (e as any).message : 'Unable to load blog';
          toast({ title: 'Error', description: message, status: 'error' });
          errorShown.current = true;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; controller.abort(); };
  }, [id, isDoctor, toast]);

  const rawImage = (blog && (blog.imageUrl || blog.image || blog.imagePath || blog.imageUrlPath)) || '';
  const resolveImage = (raw: string) => {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw;
    const backendOrigin = ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5000';
    if (raw.startsWith('/')) return `${backendOrigin}${raw}`;
    return `${backendOrigin}/${raw}`;
  };
  const imageCandidates = [rawImage].filter(Boolean).map(resolveImage);
  let detailImageSrc = imageCandidates[0] || '';

  function handleDetailImgError(e: any) {
    try {
      const img = e.target as HTMLImageElement;
      img.onerror = null;
      const current = img.src || '';
      const idx = imageCandidates.indexOf(current);
      const next = (idx >= 0 && idx + 1 < imageCandidates.length) ? imageCandidates[idx + 1] : null;
      if (next) {
        img.src = next;
        img.onerror = handleDetailImgError;
        return;
      }
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    } catch (err) {}
  }

  if (!isDoctor) return (
    <Box py={12} textAlign="center">
      <Text fontSize="lg" fontWeight={600} mb={4}>Access denied</Text>
      <Text mb={4}>This page is only available to doctors.</Text>
      <Button as={RouterLink} to="/" colorScheme="teal">Go Home</Button>
    </Box>
  );

  if (loading) return <Box py={12} textAlign="center"><Spinner /></Box>;
  if (!blog) return <Box py={12} textAlign="center">Blog not found</Box>;

  return (
    <Box py={8}>
      <Container maxW="container.md">
        {detailImageSrc && (
          <Image src={detailImageSrc} alt={blog.title} w="70%" h={{ base: '160px', md: '260px' }} objectFit="cover" borderRadius="lg" mb={2} boxShadow="lg" onError={handleDetailImgError} />
        )}

        <VStack align="start" spacing={3} maxW="720px" mx="auto">
          <HStack spacing={4} alignItems="center">
            <Avatar name={blog.doctor ? `${blog.doctor.firstName || ''} ${blog.doctor.lastName || ''}` : blog.author || 'Staff'} src={blog.doctor?.profileImage || undefined} size="sm" />
            <Box>
              <Text fontWeight="600" color="gray.700">{blog.doctor ? `${blog.doctor.firstName || ''} ${blog.doctor.lastName || ''}` : (blog.author || 'Staff')}</Text>
              <Text fontSize="sm" color="gray.500">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}</Text>
            </Box>
          </HStack>

          <Heading as="h1" fontSize={{ base: '2xl', md: '4xl' }} lineHeight="short" fontWeight="700" color="#07203a">{blog.title}</Heading>

          {blog.summary && (
            <Box bg="gray.50" px={4} py={3} borderLeftWidth={4} borderLeftColor="#0b2545" borderRadius="md" w="full">
              <Text color="gray.700" fontSize={{ base: 'md', md: 'lg' }} fontWeight={500} maxW="720px">{blog.summary}</Text>
            </Box>
          )}

          <Divider borderColor="gray.200" />

          <Box color="gray.800" fontSize={{ base: '16px', md: '18px' }} lineHeight="tall" whiteSpace="pre-line" letterSpacing="0.2px">
            {blog.content}
          </Box>

          <Button as={RouterLink} to="/blogs/doctor" colorScheme="teal">Back to Blogs</Button>
        </VStack>
      </Container>
    </Box>
  );
}
