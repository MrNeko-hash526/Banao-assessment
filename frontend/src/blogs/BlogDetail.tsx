import { useEffect, useState, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Heading, Text, Spinner, VStack, HStack, Image, Avatar, Button, Divider, useToast } from '@chakra-ui/react';

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const errorShown = useRef(false);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setServerError(null);
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/blogs/${id}`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let msg = `Failed to fetch blog: ${res.status} ${res.statusText}`;
          try { const j = JSON.parse(text); msg = j?.error || j?.message || msg; } catch (e) { if (text) msg = text; }
          if (mounted) setServerError(msg);
          throw new Error(msg);
        }
  const json = await res.json();
  // debug: log raw response so we can inspect imageUrl/status
  console.debug('BlogDetail fetched JSON:', json);
  if (mounted) setBlog(json?.data || json?.blog || json || null);
      } catch (e) {
        console.error('BlogDetail load error', e);
        if (!errorShown.current) {
          toast({ title: 'Error', description: (e as any).message || 'Unable to load blog', status: 'error' });
          errorShown.current = true;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, toast]);

  const resolveImage = (raw: string | undefined) => {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw) || /^data:/i.test(raw)) return raw;
    const backendOrigin = ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5000';
    return raw.startsWith('/') ? `${backendOrigin}${raw}` : `${backendOrigin}/${raw}`;
  };

  // build a list of candidate image URLs (in order)
  const imageCandidates = [
    (blog as any).imageUrl,
    (blog as any).image,
    (blog as any).imagePath,
    blog?.doctor?.profileImage,
  ].filter(Boolean).map(resolveImage);

  function handleImgError(e: any) {
    try {
      const img = e.target as HTMLImageElement;
      img.onerror = null;
      // try next candidate if available
      const current = img.src || '';
      const idx = imageCandidates.indexOf(current);
      const next = (idx >= 0 && idx + 1 < imageCandidates.length) ? imageCandidates[idx + 1] : null;
      if (next) {
        img.src = next;
        img.onerror = handleImgError;
        return;
      }
      // final fallback
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    } catch (err) {}
  }

  if (loading) return <Box py={12} textAlign="center"><Spinner /></Box>;
  if (!blog) return (
    <Box py={12} textAlign="center">
      <Text mb={4}>{serverError || 'Blog not found'}</Text>
      <Button as={RouterLink} to="/blogs" colorScheme="teal">Back to Blogs</Button>
    </Box>
  );

  const headerImage = resolveImage((blog as any).imageUrl || (blog as any).image || (blog as any).doctor?.profileImage || '');

  return (
    <Box py={8}>
      <Container maxW="container.md">
        {headerImage && <Image src={headerImage} alt={blog.title} w="100%" h={{ base: '160px', md: '260px' }} objectFit="cover" borderRadius="md" mb={4} onError={handleImgError} />}

        <VStack align="start" spacing={4}>
          <HStack spacing={3} alignItems="center">
            <Avatar name={blog.doctor ? `${blog.doctor.firstName || ''} ${blog.doctor.lastName || ''}` : 'Staff'} src={resolveImage(blog.doctor?.profileImage)} size="sm" />
            <Box>
              <Text fontWeight={600}>{blog.doctor ? `${blog.doctor.firstName || ''} ${blog.doctor.lastName || ''}` : (blog.author || 'Staff')}</Text>
              <Text fontSize="sm" color="gray.500">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}</Text>
            </Box>
          </HStack>

          <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="short" color="#07203a">{blog.title}</Heading>

          {blog.summary && (
            <Box bg="gray.50" px={4} py={3} borderLeftWidth={4} borderLeftColor="#0b2545" borderRadius="md" w="full">
              <Text color="gray.700">{blog.summary}</Text>
            </Box>
          )}

          <Divider />

          <Box color="gray.800" fontSize={{ base: '16px', md: '18px' }} lineHeight="tall" whiteSpace="pre-line">
            {blog.content}
          </Box>

          <Button as={RouterLink} to="/blogs" colorScheme="teal">Back to Blogs</Button>
        </VStack>
      </Container>
    </Box>
  );
}
