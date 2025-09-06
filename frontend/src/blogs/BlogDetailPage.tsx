import { useEffect, useState, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Heading, Text, Image, Spinner, Button, VStack, HStack, Avatar, Divider, useToast } from '@chakra-ui/react';
import { checkIsDoctor, getUserFromToken } from '../utils/auth';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const errorShown = useRef(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const toast = useToast();
  const [blog, setBlog] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`http://localhost:5000/blogs/${id}`, { headers });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            let msg = `Failed to fetch blog: ${res.status} ${res.statusText}`;
            try { const j = JSON.parse(text); msg = j?.error || j?.message || msg; } catch (e) { if (text) msg = text; }
            if (mounted) setServerError(msg);
            throw new Error(msg);
          }
          const json = await res.json();
          console.debug('BlogDetailPage fetched JSON:', json);
          setBlog(json?.blog || json?.data || json || null);
      } catch (e) {
          console.error('BlogDetailPage load error:', e);
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
    return () => { mounted = false; };
  }, [id]);

  const rawImage = (blog && (blog.imageUrl || blog.image || blog.imagePath || blog.imageUrlPath)) || '';
  const resolveImage = (raw: string) => {
    if (!raw) return '';
    // If it's already a data URL, use it as-is
    if (/^data:/i.test(raw)) return raw;
    const backendOrigin = ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5000';
    try {
      const asUrl = new URL(raw, backendOrigin);
      // If the path contains /uploads, force the backend origin so uploaded files always come from the server
      if (asUrl.pathname && asUrl.pathname.includes('/uploads/')) {
        return backendOrigin + asUrl.pathname;
      }
      // If raw was absolute and not an uploads path, return as-is
      if (/^https?:\/\//i.test(raw)) return raw;
    } catch (e) {
      // not a full URL, fall through
    }
    // raw is a relative path like /uploads/blogs/xxx or uploads/blogs/xxx
    const cleaned = raw.startsWith('/') ? raw : `/${raw}`;
    return `${backendOrigin}${cleaned}`;
  };
  // explicit fallback image (provided by user) — will be used only if blog image is missing or fails
  const explicitFallback = 'http://localhost:5000/uploads/blogs/1757168495349-8midb3.jpg';
  const imageCandidates = [rawImage, explicitFallback].filter(Boolean).map(resolveImage);
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

  let rawUser: any = null;
  try {
    rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  } catch (e) {
    rawUser = null;
  }
  if (!rawUser) rawUser = getUserFromToken();
  const isDoctor = checkIsDoctor(rawUser);

  const isDraft = blog && ((blog.isDraft === true) || (blog.draft === true) || (blog.status === 'draft'));

  if (loading) return <Box py={12} textAlign="center"><Spinner /></Box>;
  if (!blog) return (
    <Box py={12} textAlign="center">
      <Text mb={4}>{serverError || 'Blog not found'}</Text>
      <Button as={RouterLink} to={isDoctor ? '/blogs/doctor' : '/blogs'} colorScheme="teal">Back</Button>
    </Box>
  );
  if (isDraft && !isDoctor) return (
    <Box py={12} textAlign="center">
      <Text fontSize="lg" fontWeight={600} mb={4}>This article is private</Text>
      <Button as={RouterLink} to="/blogs" colorScheme="teal">Back to Blogs</Button>
    </Box>
  );

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

          <Button as={RouterLink} to={isDoctor ? '/blogs/doctor' : '/blogs'} colorScheme="teal">Back to Blogs</Button>
        </VStack>
      </Container>
    </Box>
  );
}
