import { useEffect, useState, useRef } from 'react';
import { Box, Container, Input, InputGroup, InputLeftElement, SimpleGrid, Spinner, VStack, Heading, HStack, Button, Text, Flex, Tag, useColorModeValue } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import BlogCard from '../components/blog/BlogCard';
import { checkIsDoctor, getUserFromToken } from '../utils/auth';
import CategoryTabs from '../components/blog/CategoryTabs';

export default function BlogListPage() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  
  const debounceRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  let rawUser: any = null;
  try {
    rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  } catch (e) {
    rawUser = null;
  }
  if (!rawUser) rawUser = getUserFromToken();
  const isDoctor = checkIsDoctor(rawUser);

  // If current user is a doctor, redirect away — this list is only for patients
  useEffect(() => {
    if (isDoctor) navigate('/doctor-dashboard');
  }, [isDoctor, navigate]);

  

  useEffect(() => {
    let mounted = true;
    const fetchBlogs = async () => {
      if (isDoctor) return; // doctors should not fetch the public blog list
      setLoading(true);
      try {
        const q = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
        const res = await fetch(`http://localhost:5000/blogs${q}`);
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok && Array.isArray(json.data)) {
          setBlogs(json.data);
        } else setBlogs(json?.data || []);
      } catch (e) {
        setBlogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBlogs();
    return () => { mounted = false; };
  }, [category]);

  const visible = blogs.filter((b) => {
    const isDraft = b && ((b.isDraft === true) || (b.draft === true) || (b.status === 'draft'));
    if (isDraft && !isDoctor) return false; // hide drafts from non-doctors
    return true;
  });

  const filtered = visible.filter((b) => !query ? true : ((b.title || '') + ' ' + (b.summary || '')).toLowerCase().includes(query.toLowerCase()));

  // debounce the search input so we don't re-filter on every keystroke
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQuery(search.trim());
    }, 400) as unknown as number;
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <Box py={8}>
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={6}>
          <Box bg={useColorModeValue('gray.50', 'gray.700')} p={6} borderRadius="md">
            <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
              <Box>
                <Heading
                  size="2xl"
                  color="blue.800"
                  mb={6}
                  lineHeight={1.25}
                  sx={{ display: 'block' }}
                  style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }}
                  transition="opacity 760ms ease, transform 760ms ease"
                >
                  Read our Blogs
                </Heading>
                <Text color="gray.600" fontSize="lg" mb={2} style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(6px)' }} transition="opacity 760ms ease, transform 760ms ease">Explore expert articles and practical advice for patients and clinicians.</Text>
              </Box>

              <HStack>
                <Tag size="md" colorScheme="teal" bg={useColorModeValue('white', 'gray.800')}>{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</Tag>
              </HStack>
            </Flex>
          </Box>

          {/* category/search pill overlapping the hero - keeps sections distinct but visually merged */}
          <Box bg={useColorModeValue('white', 'gray.800')} p={4} borderRadius="md" mt={-4} mb={6} boxShadow="sm">
            <HStack justify="space-between">
              <CategoryTabs value={category} onChange={setCategory} />
              <HStack>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input placeholder="Search articles by title or summary" maxW="360px" value={search} onChange={(e) => setSearch(e.target.value)} _placeholder={{ color: 'gray.500', opacity: 1 }} pl={10} />
                </InputGroup>
                {search ? <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setQuery(''); }}>Clear</Button> : null}
              </HStack>
            </HStack>
          </Box>

          {loading ? (
            <Box textAlign="center" py={12}><Spinner /></Box>
          ) : (
            <>
              <Text color="gray.600">Showing {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</Text>
              {filtered.length === 0 ? (
                <Box textAlign="center" py={12}>
                  <Heading size="md">No articles found</Heading>
                  <Text color="gray.500">Try a different search term or category.</Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filtered.map((b, i) => (
                    <BlogCard key={b.id} blog={b} delay={i * 80} />
                  ))}
                </SimpleGrid>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
