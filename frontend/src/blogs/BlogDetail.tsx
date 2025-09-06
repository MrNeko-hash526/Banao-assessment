import { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner } from '@chakra-ui/react';

export default function BlogDetail() {
  const [blog, setBlog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const id = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    fetch(`http://localhost:5000/blogs/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (json && json.ok) setBlog(json.data);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, [id]);

  if (loading) return <Box p={6}><Spinner /> <Text>Loading...</Text></Box>;
  if (!blog) return <Box p={6}><Text>Blog not found</Text></Box>;

  return (
    <Box p={6}>
      <Heading>{blog.title}</Heading>
      <Text fontSize="sm" color="gray.600">By: {blog.doctor ? `${blog.doctor.firstName || ''} ${blog.doctor.lastName || ''}` : 'Unknown'}</Text>
      {blog.imageUrl && <Box mt={4}><img src={`http://localhost:5000${blog.imageUrl}`} alt={blog.title} style={{ maxWidth: '100%' }} /></Box>}
      <Box mt={4}><Text>{blog.content}</Text></Box>
    </Box>
  );
}
