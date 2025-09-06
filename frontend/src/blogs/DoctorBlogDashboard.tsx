import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Heading,
  Button,
  HStack,
  Text,
  Spinner,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  SimpleGrid,
  IconButton,
  Flex,
  Stack,
  Tag,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useCustomToast } from '../components/ui/toast';
import { checkIsDoctor, getUserFromToken } from '../utils/auth';
import BlogCard from '../components/blog/BlogCard';

type Blog = {
  id: string | number;
  title: string;
  category?: string;
  status?: 'draft' | 'published' | string;
  createdAt?: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  summary?: string;
  isDraft?: boolean;
  draft?: boolean;
  _id?: string;
};

export default function DoctorBlogDashboard() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [errorShown, setErrorShown] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const toast = useCustomToast();
  const navigate = useNavigate();

  // responsive table view removed; using grid layout similar to PatientBlogDashboard

  // determine current user and require doctor role to access this page
  let rawUser: any = null;
  try {
    rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  } catch (e) {
    rawUser = null;
  }
  if (!rawUser) rawUser = getUserFromToken();
  const isDoctor = checkIsDoctor(rawUser);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Assumption: backend provides an endpoint returning the logged-in doctor's blogs
        // e.g. GET /blogs/mine
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/blogs/mine', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          // If /blogs/mine isn't available, fall back to fetching all blogs and filter client-side
          const text = await res.text().catch(() => '');
          const msg = `blogs/mine not available: ${res.status} ${res.statusText} ${text}`;
          console.warn(msg);
          // Attempt fallback
          const allRes = await fetch('http://localhost:5000/blogs');
          if (!allRes.ok) throw new Error(`Fallback fetch /blogs failed: ${allRes.status} ${allRes.statusText}`);
          const allJson = await allRes.json();
          const listAll = allJson?.blogs || allJson?.data || allJson || [];
          // Use rawUser to identify doctor's own posts
          const doctorId = rawUser?.id || rawUser?._id || rawUser?.userId || rawUser?.uid;
          const doctorEmail = rawUser?.email;
          const filtered = (Array.isArray(listAll) ? listAll : []).filter((b: any) => {
            const d = b.doctor || b.author || null;
            if (!d) return false;
            if (doctorId && (d.id === doctorId || d._id === doctorId || String(d.id) === String(doctorId) || String(d._id) === String(doctorId))) return true;
            if (doctorEmail && (d.email === doctorEmail || b.email === doctorEmail)) return true;
            return false;
          });
          if (mounted) setBlogs(filtered);
          return;
        }
        const json = await res.json();
        if (mounted) {
          // backend may return { blogs: [...] } or { data: [...] } or the array directly
          const list = json?.blogs || json?.data || json || [];
          setBlogs(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('DoctorBlogDashboard load error:', err);
        if (!errorShown) {
          const message = (err && (err as any).message) ? (err as any).message : 'Unable to load blogs';
          toast({ title: 'Error', description: message, status: 'error' });
          setErrorShown(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  const onDelete = async () => {
    if (!deletingId) return;
    try {
      const token = localStorage.getItem('token');
      // primary attempt: DELETE
      const res = await fetch(`http://localhost:5000/blogs/${deletingId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn('DELETE returned non-ok:', res.status, res.statusText, txt);
        // fallback: some servers don't implement DELETE; try updating status to 'deleted'
        try {
          const putRes = await fetch(`http://localhost:5000/blogs/${deletingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ status: 'deleted' }),
          });
          if (!putRes.ok) {
            const putTxt = await putRes.text().catch(() => '');
            const msg = `Fallback PUT failed: ${putRes.status} ${putRes.statusText} ${putTxt}`;
            console.error(msg);
            toast({ title: 'Delete failed', description: putTxt || `${putRes.status} ${putRes.statusText}`, status: 'error' });
            return;
          }
          // fallback succeeded
          setBlogs((b) => b.filter((x) => x.id !== deletingId));
          toast({ title: 'Deleted (marked)', description: 'Blog marked deleted via fallback', status: 'success' });
          return;
        } catch (putErr) {
          console.error('Fallback PUT error:', putErr);
          toast({ title: 'Delete failed', description: txt || 'Server does not support DELETE', status: 'error' });
          return;
        }
      }
      setBlogs((b) => b.filter((x) => x.id !== deletingId));
      toast({ title: 'Deleted', description: 'Blog deleted', status: 'success' });
    } catch (err) {
      console.error('Delete error:', err);
      const message = (err && (err as any).message) ? (err as any).message : 'Could not delete blog';
      toast({ title: 'Error', description: message, status: 'error' });
    } finally {
      setDeletingId(null);
      onClose();
    }
  };

  // block access for non-doctors
  if (!isDoctor) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="md" mb={3}>Access denied</Heading>
        <Text mb={4}>Only doctors can view and manage articles here. Please log in with a doctor account.</Text>
        <Button colorScheme="teal" onClick={() => navigate('/')}>Go to home</Button>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Box bg={useColorModeValue('gray.50', 'gray.700')} p={6} borderRadius="md" mb={6} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }} transition="opacity 800ms ease, transform 800ms ease">
        <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
          <Stack spacing={1}>
            <Heading size="2xl" color="blue.800">My Articles</Heading>
            <Text color="gray.500" fontSize="md">Manage your drafts and published articles</Text>
          </Stack>

          <HStack spacing={3}>
            <Tag size="md" colorScheme="teal">{blogs.length} {blogs.length === 1 ? 'article' : 'articles'}</Tag>
            <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => navigate('/blogs/create')}>New Article</Button>
          </HStack>
        </Flex>
      </Box>

      {loading ? (
        <Flex justify="center" py={12}><Spinner /></Flex>
      ) : blogs.length === 0 ? (
        <Flex direction="column" align="center" py={16} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
          <Heading size="md" mb={2}>No articles yet</Heading>
          <Text mb={4} color="gray.500">Create your first article to share knowledge with your patients.</Text>
          <Button colorScheme="teal" leftIcon={<AddIcon />} onClick={() => navigate('/blogs/create')}>Write your first article</Button>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
          {blogs.map((b) => {
            const bid = b.id || b._id || b.id?.toString?.();
            return (
              <Box key={bid} position="relative" borderRadius="lg" overflow="visible">
                <BlogCard blog={b} />

                {/* overlay action buttons */}
                <HStack className="doc-actions" position="absolute" top={3} right={3} spacing={2} style={{ opacity: 1, transform: 'translateY(0)', transition: 'opacity 220ms ease, transform 220ms ease', zIndex: 2 }}>
                  <Tooltip label="Edit" aria-label="Edit article">
                    <IconButton size="sm" aria-label="Edit" icon={<EditIcon />} onClick={() => navigate(`/blogs/doctor/edit/${bid}`)} variant="ghost" bg={useColorModeValue('whiteAlpha.800','whiteAlpha.200')} />
                  </Tooltip>
                  <Tooltip label="Delete" aria-label="Delete article">
                    <IconButton size="sm" aria-label="Delete" icon={<DeleteIcon />} variant="ghost" colorScheme="red" onClick={() => { setDeletingId(bid); onOpen(); }} bg={useColorModeValue('whiteAlpha.800','whiteAlpha.200')} />
                  </Tooltip>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => { setDeletingId(null); onClose(); }}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete blog
            </AlertDialogHeader>

            <AlertDialogBody>Are you sure? This action cannot be undone.</AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => { setDeletingId(null); onClose(); }}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={onDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
