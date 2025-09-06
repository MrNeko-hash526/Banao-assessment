import { useState, useEffect } from 'react';
import { Box, Image, Heading, Text, Button, VStack, HStack, Badge, AspectRatio, usePrefersReducedMotion } from '@chakra-ui/react';
import { checkIsDoctor, getUserFromToken } from '../../utils/auth';
import { Link as RouterLink } from 'react-router-dom';

type Blog = {
  id: string | number;
  title: string;
  summary?: string;
  image?: string;
  imagePath?: string;
  category?: string;
  author?: string;
  createdAt?: string;
  _id?: string | number;
};

function truncateWords(text = '', n = 15) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= n) return text;
  return words.slice(0, n).join(' ') + '...';
}

export default function BlogCard({ blog, delay = 0 }: { blog: Blog; delay?: number }) {
  let rawUser: any = null;
  try { rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null; } catch (e) { rawUser = null; }
  if (!rawUser) rawUser = getUserFromToken();
  const isDoctor = checkIsDoctor(rawUser);

  const rawCategory = blog.category || 'General';
  const friendlyCategory = typeof rawCategory === 'string' && rawCategory.includes('_') ? rawCategory.split('_').map(s => s[0] + s.slice(1).toLowerCase()).join(' ') : rawCategory;

  // image handling: prefer blog.imageUrl/image/imagePath. Normalize uploads paths to backend origin.
  const rawImage = (blog as any).imageUrl || (blog as any).image || blog.imagePath || '';
  const backendOrigin = ((import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:5000';
  const resolveImage = (raw: string) => {
    if (!raw) return '';
    if (/^data:/i.test(raw)) return raw;
    try {
      const asUrl = new URL(raw, backendOrigin);
      if (asUrl.pathname && asUrl.pathname.includes('/uploads/')) {
        return backendOrigin + asUrl.pathname;
      }
      if (/^https?:\/\//i.test(raw)) return raw;
    } catch (e) {
      // not a full URL
    }
    const cleaned = raw.startsWith('/') ? raw : `/${raw}`;
    return `${backendOrigin}${cleaned}`;
  };
  const [imgSrc, setImgSrc] = useState(() => resolveImage(rawImage));
  const [imageLoaded, setImageLoaded] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setImgSrc(resolveImage(rawImage));
    setImageLoaded(false);
  }, [rawImage]);
  function handleImgError(e?: any) {
    try {
      const imgEl = (e && e.target) ? e.target as HTMLImageElement : null;
      if (imgEl) {
        imgEl.onerror = null;
        imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      } else {
        setImgSrc('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
      }
    } catch (err) {}
  }

  const isDraft = (blog as any).isDraft === true || (blog as any).draft === true || (blog as any).status === 'draft';

  // role-aware detail route: doctors should use the doctor detail route
  const blogId = (blog as any).id ?? (blog as any)._id ?? '';
  const detailRoute = blogId ? (isDoctor ? `/blogs/doctor/${blogId}` : `/blogs/${blogId}`) : '';
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion) {
      setMounted(true);
      return;
    }
    const t = window.setTimeout(() => setMounted(true), delay);
    return () => window.clearTimeout(t);
  }, [delay, prefersReducedMotion]);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
  boxShadow="md"
  transition="transform 360ms cubic-bezier(.16,.84,.35,1), box-shadow 260ms ease, opacity 420ms ease"
  _hover={{ transform: prefersReducedMotion ? undefined : 'translateY(-8px) scale(1.02)', boxShadow: '2xl' }}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : (prefersReducedMotion ? 'none' : 'translateY(10px) scale(0.985)')
      }}
    >
      <Box position="relative">
        <AspectRatio ratio={16 / 9}>
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={blog.title}
              objectFit="cover"
              w="100%"
              h="100%"
              onError={handleImgError}
              onLoad={() => setImageLoaded(true)}
              transition="opacity 520ms ease, transform 520ms ease"
              style={{ opacity: imageLoaded ? 1 : 0.01, transform: imageLoaded ? 'scale(1)' : 'scale(1.02)' }}
            />
          ) : (
            <Box bg="gray.100" />
          )}
        </AspectRatio>
        <Badge position="absolute" top={3} left={3} colorScheme={isDraft ? 'orange' : 'teal'} borderRadius="md" px={2} py={1} fontSize="xs">
          {isDraft ? 'Draft' : (friendlyCategory || 'General')}
        </Badge>
      </Box>

      <VStack align="start" spacing={3} p={4}>
  <Heading size="sm" fontWeight={600} noOfLines={2}>{blog.title}</Heading>
  <Text color="gray.600" fontSize="sm" noOfLines={3} sx={{ lineHeight: 1.4 }}>{truncateWords(blog.summary || '', 15)}</Text>

        <HStack w="full" justifyContent="space-between">
          <Text fontSize="sm" color="gray.500">{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}</Text>
          <HStack>
            {isDraft && !isDoctor ? (
              <Button size="sm" variant="outline" isDisabled colorScheme="gray">Private</Button>
            ) : (
              detailRoute ? (
                <Button as={RouterLink} to={detailRoute} size="sm" variant="ghost" colorScheme="teal">Read</Button>
              ) : (
                <Button size="sm" variant="outline" isDisabled>Unavailable</Button>
              )
            )}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}
