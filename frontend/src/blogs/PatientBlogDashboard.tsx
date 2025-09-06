import { useEffect, useState } from 'react';
import { Box, Heading, HStack, Button, Text, Image, SimpleGrid, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useCustomToast } from '../components/ui/toast';

export default function PatientBlogDashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useCustomToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/blogs/mine', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (mounted) setPosts(json || []);
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Unable to load posts', status: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  if (loading) return <Box p={6}><Spinner /></Box>;

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Heading>My Posts</Heading>
        <Button colorScheme="teal" onClick={() => navigate('/blogs/patient/new')}>New Post</Button>
      </HStack>

      {posts.length === 0 ? (
        <Box p={6} bg="gray.50" borderRadius="md">
          <Text>No posts yet. Click New Post to create one.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {posts.map((p) => (
            <Box key={p._id} p={4} borderWidth={1} borderRadius="md">
              {p.image && <Image src={p.image.startsWith('http') ? p.image : `http://localhost:5000${p.image}`} alt={p.title} maxH="160px" objectFit="cover" mb={3} />}
              <Heading size="md">{p.title}</Heading>
              <Text noOfLines={2} mt={2}>{p.summary}</Text>
              <HStack mt={3} justify="space-between">
                <Button size="sm" onClick={() => navigate(`/blogs/patient/edit/${p._id}`)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={async () => {
                  if (!confirm('Delete post?')) return;
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`http://localhost:5000/blogs/${p._id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
                    if (!res.ok) {
                      const txt = await res.text().catch(() => '');
                      console.warn('DELETE returned non-ok for patient post:', res.status, res.statusText, txt);
                      // fallback: try PUT to mark deleted
                      const putRes = await fetch(`http://localhost:5000/blogs/${p._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ status: 'deleted' }),
                      });
                      if (!putRes.ok) {
                        const putTxt = await putRes.text().catch(() => '');
                        toast({ title: 'Delete failed', description: putTxt || `${putRes.status} ${putRes.statusText}`, status: 'error' });
                        throw new Error(`Fallback PUT failed: ${putRes.status} ${putRes.statusText} ${putTxt}`);
                      }
                      setPosts((s) => s.filter((x) => x._id !== p._id && x.id !== p._id));
                      toast({ title: 'Deleted (marked)', status: 'success' });
                      return;
                    }
                    setPosts((s) => s.filter((x) => x._id !== p._id && x.id !== p._id));
                    toast({ title: 'Deleted', status: 'success' });
                  } catch (err) {
                    console.error(err);
                    // message already shown above for non-ok; show generic otherwise
                    if (!(err as any).message) toast({ title: 'Error', description: 'Could not delete', status: 'error' });
                  }
                }}>Delete</Button>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
