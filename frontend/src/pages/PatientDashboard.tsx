import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Input,
  InputGroup,
  InputRightElement,
  Heading,
  Text,
  Flex,
  Avatar,
  Button,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import CategoryTabs from '../components/CategoryTabs';
import BlogCard from '../components/BlogCard';
import { getBlogsByCategory } from '../services/api';

const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionBox = motion(Box);

const DEFAULT_CATEGORY = 'All';

export default function PatientDashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [query, setQuery] = useState('');
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const cat = category === 'All' ? '' : category;
        const res = await getBlogsByCategory(cat);
        if (!mounted) return;
        if (res.ok && Array.isArray(res.data)) {
          setBlogs(res.data);
        } else {
          setBlogs([]);
        }
      } catch (e) {
        setBlogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [category]);

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return blogs;
    return blogs.filter(b => (b.title || '').toLowerCase().includes(q));
  }, [blogs, query]);

  const onLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    try { window.location.assign(window.location.origin + '/login'); } catch (e) {}
  };

  return (
    <Box py={8} px={4} maxW="1200px" mx="auto">
      {/* Hero Welcome Section */}
      <MotionBox
        bgGradient="linear(to-r, gray.900, gray.800)"
        borderRadius="lg"
        px={{ base: 6, md: 10 }}
        py={{ base: 8, md: 12 }}
        mb={10}
        textAlign="center"
        color="white"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <Flex justify="center" align="center" gap={6} direction="column">
          <Avatar
            name={user ? `${user.firstName} ${user.lastName}` : 'Guest'}
            src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : undefined}
            boxSize={{ base: '60px', md: '80px' }}
          />

          <MotionHeading
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="extrabold"
            color="teal.300"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          >
            Welcome back{user ? `, ${user.firstName || ''}` : ''}
          </MotionHeading>

          <MotionText
            fontSize={{ base: 'lg', md: '2xl', lg: '3xl' }}
            fontStyle="italic"
            fontWeight="semibold"
            color="gray.200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
          >
            "Ready to learn something useful today?"
          </MotionText>

          <Button
            size="lg"
            colorScheme="teal"
            variant="solid"
            onClick={onLogout}
            mt={6}
            transition="transform 180ms"
            _hover={{ transform: 'translateY(-3px)' }}
          >
            Logout
          </Button>
        </Flex>
      </MotionBox>

      {/* Category Tabs */}
      <Box mb={4}>
        <CategoryTabs value={category} onChange={(c) => setCategory(c)} />
      </Box>

      {/* Search */}
      <Flex mb={6}>
        <InputGroup maxW="420px">
          <Input placeholder="Search blogs by title" value={query} onChange={(e) => setQuery(e.target.value)} />
          <InputRightElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputRightElement>
        </InputGroup>
      </Flex>

      {/* Blog Cards */}
      {loading ? <Spinner /> : (
        <>
          {filtered.length === 0 ? (
            <Text>No posts yet in this category.</Text>
          ) : (
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
              gap={6}
            >
              {filtered.map((b) => (
                <MotionBox
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <BlogCard
                    id={b.id}
                    title={b.title}
                    image={b.image}
                    summary={b.summary || b.content || ''}
                  />
                </MotionBox>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
