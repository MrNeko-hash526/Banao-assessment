import { Box, Flex, Heading, Text, Button, Image, VStack } from '@chakra-ui/react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import homepageGif from '../assets/homepage.gif';

const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionImage = motion(Image);

export default function PatientDash() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev || 'auto';
    };
  }, []);
  return (
    <Box
      height="calc(100vh - 64px)"
      bg="white"
      color="gray.900"
      px={{ base: 4, md: 8 }}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Flex
        maxW="1200px"
        w="full"
        mx="auto"
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: 8, md: 12 }}
        align="center"
      >
        {/* Left: bold headline + short text */}
        <VStack align="start" spacing={6} w={{ base: '100%', md: '45%' }}>
          <MotionHeading
            as="h1"
            fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
            fontWeight="black"
            lineHeight="1.1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            Don’t just <Text as="span" color="teal.500">Google</Text> it —
            <br />read it <Text as="span" color="teal.500">right</Text>.
          </MotionHeading>

          <MotionText
            fontSize={{ base: 'lg', md: 'xl' }}
            color="gray.600"
            fontWeight="medium"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            Trusted health insights. Clear. Simple. Reliable.
          </MotionText>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              as={Link}
              to="/blogs"
              size="lg"
              colorScheme="teal"
              borderRadius="full"
              px={8}
              py={6}
              fontWeight="bold"
              _hover={{ transform: 'scale(1.05)', transition: '0.2s ease' }}
            >
              Explore Blogs
            </Button>
          </motion.div>
        </VStack>

        {/* Right: animated image */}
        <Box w={{ base: '100%', md: '55%' }} overflow="hidden">
          <MotionImage
            src={homepageGif}
            alt="homepage visual"
            w="100%"
            h="100%"
            objectFit="cover"
            initial={{ opacity: 0, scale: 0.94, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </Box>
      </Flex>
    </Box>
  );
}
