import { Box, Image, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

type Props = {
  id: string | number;
  title: string;
  image?: string;
  summary?: string;
};

function truncateWords(s = '', n = 15) {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length <= n) return s;
  return parts.slice(0, n).join(' ') + '...';
}

export default function BlogCard({ id, title, image, summary }: Props) {
  return (
    <Box borderWidth={1} borderRadius="md" overflow="hidden" bg="white" boxShadow="sm">
      {image && (
        <Image src={image} alt={title} objectFit="cover" w="100%" h="160px" />
      )}
      <VStack align="start" spacing={3} p={4}>
        <Heading size="sm">{title}</Heading>
        <Text fontSize="sm" color="gray.600">{truncateWords(summary, 15)}</Text>
        <Box>
          <Button as={Link} to={`/blogs/${id}`} size="sm" colorScheme="teal">Read More</Button>
        </Box>
      </VStack>
    </Box>
  );
}
