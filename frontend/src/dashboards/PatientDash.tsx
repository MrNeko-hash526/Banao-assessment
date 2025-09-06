import { Box, Flex, Heading, Text, Button, Image, VStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import homepageGif from '../assets/homepage.gif';

const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionImage = motion(Image);

export default function PatientDash() {
  return (
    <Box
      height="calc(100vh - 64px)"
      minH="calc(100vh - 64px)"
      bg="white"
      color="gray.900"
      py={0}
      px={{ base: 2, md: 4 }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Flex maxW="1200px" w="full" mx="auto" direction={{ base: 'column', md: 'row' }} gap={{ base: 6, md: 8 }} align="center" height="100%">

  {/* Left: very big engaging text (45%) */}
  <VStack align="start" spacing={6} flex={{ base: '0 0 auto', md: '0 0 45%' }} w={{ base: '100%', md: '45%' }} justifyContent="center" height="100%" maxH="100%">
          <MotionHeading
            as="h1"
            fontSize={{ base: '4xl', md: '6xl', lg: '7xl' }}
            fontWeight="black"
            lineHeight="0.9"
            color="gray.900"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            Health
            <Text as="span" color="teal.500"> made</Text>
            <br />
            simple
          </MotionHeading>

          <MotionText 
            fontSize={{ base: 'xl', md: '2xl' }} 
            color="gray.600" 
            fontWeight="medium"
            maxW="600px"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            Evidence-based insights that actually matter to your daily life.
          </MotionText>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              as={Link} 
              to="/blogs" 
              size="xl" 
              colorScheme="teal" 
              borderRadius="full"
              px={8}
              py={6}
              fontSize="lg"
              fontWeight="bold"
            >
              Read our Blogs
            </Button>
          </motion.div>
        </VStack>

  {/* Right: entrance animated image (55%) */}
  <Box flex={{ base: '0 0 auto', md: '0 0 55%' }} w={{ base: '100%', md: '55%' }} overflow="hidden" height="100%" maxH="100%">
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
