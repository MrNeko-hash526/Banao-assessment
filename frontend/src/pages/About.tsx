import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  SimpleGrid,
  Avatar,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function About() {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const team = [
    { name: 'Dr. Asha Rao', role: 'Clinical Editor', image: '/src/assets/image1.png' },
    { name: 'Samir Patel', role: 'Engineering', image: '/src/assets/image2.png' },
    { name: 'Lina Gomez', role: 'Content', image: '/src/assets/image3.png' },
  ];

  return (
    <Box bg={bg} color={useColorModeValue('gray.800', 'gray.100')} py={16}>
      <Container maxW="container.lg">
        {/* Hero */}
        <VStack spacing={6} textAlign="center" mb={12}>
          <Heading size="2xl" bgGradient="linear(to-r, teal.400, teal.600)" bgClip="text">
            About MediMind
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} maxW="760px" color={useColorModeValue('gray.600', 'gray.300')}>
            MediMind is a focused health blog platform that delivers concise, evidence-backed articles
            for readers and professionals. We make complex topics easier to understand without
            sacrificing accuracy.
          </Text>
          <Button as={RouterLink} to="/blogs" colorScheme="teal" size="lg" mt={2}>
            Explore Articles
          </Button>
        </VStack>

        {/* Mission & Values */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={12}>
          <Box bg={cardBg} p={6} rounded="lg" boxShadow="sm">
            <Heading size="md" color="teal.500" mb={3}>
              Our Mission
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')}>
              To make high-quality health content approachable and useful for everyone — from
              everyday readers to healthcare professionals.
            </Text>
          </Box>

          <Box bg={cardBg} p={6} rounded="lg" boxShadow="sm">
            <Heading size="md" color="teal.500" mb={3}>
              Our Values
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')}>
              Accuracy, empathy and accessibility. We simplify complex information while keeping
              nuance where it matters.
            </Text>
          </Box>
        </SimpleGrid>

        {/* Team */}
        <VStack align="stretch" spacing={6} mb={12}>
          <Heading size="lg" color="teal.500">
            Meet the team
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {team.map((m) => (
              <Box key={m.name} bg={cardBg} p={6} rounded="lg" textAlign="center" boxShadow="sm">
                <Avatar src={m.image} name={m.name} size="xl" mb={4} mx="auto" />
                <Heading size="sm" mb={1}>{m.name}</Heading>
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>{m.role}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>

        {/* Footer CTA */}
        <Box textAlign="center">
          <Text mb={4} color={useColorModeValue('gray.600', 'gray.300')}>
            Want to contribute or suggest a topic? Get in touch and help us make reliable health
            information available to more people.
          </Text>
          <Button as={RouterLink} to="/contact" colorScheme="teal" variant="solid">
            Contact Us
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
