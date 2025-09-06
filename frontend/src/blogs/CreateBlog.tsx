import React, { useState } from 'react';
import { Box, Heading, Input, Textarea, Button, VStack } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useCustomToast } from '../components/ui/toast';

export default function CreateBlog() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useCustomToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title, summary, content }),
      });
        setLoading(false);
        if (!res.ok) {
          toast({ title: 'Error', description: 'Failed to create blog', status: 'error' });
          return;
        }
      toast({ title: 'Created', description: 'Blog created', status: 'success' });
      window.location.assign(window.location.origin + '/doctor-dashboard');
    } catch (e) {
      setLoading(false);
      toast({ title: 'Error', description: 'Unable to reach server', status: 'error' });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Create Blog</Heading>
      <form onSubmit={handleSubmit}>
  <VStack align="stretch" gap={4} maxW="800px">
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Summary</FormLabel>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Content</FormLabel>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
          </FormControl>
          <Button type="submit" colorScheme="teal" isLoading={loading}>Create</Button>
        </VStack>
      </form>
    </Box>
  );
}
