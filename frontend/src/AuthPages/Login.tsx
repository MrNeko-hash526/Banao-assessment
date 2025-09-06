import React, { useState } from 'react';
import bgImage from '../assets/image4.png';
import { Box, Button, Flex, Heading, Input, HStack, Text, VStack } from '@chakra-ui/react';
import { FormControl } from '@chakra-ui/form-control';
import { Radio, RadioGroup } from '@chakra-ui/radio';
import { useCustomToast } from '../components/ui/toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pushToast = useCustomToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim(), password }),
      });

      setLoading(false);

      if (!res.ok) {
        if (res.status === 401) {
          pushToast({ title: 'Invalid', description: 'Invalid email or password', status: 'error' });
          return;
        }
        pushToast({ title: 'Login failed', description: 'Server error', status: 'error' });
        return;
      }

      const json = await res.json();
      const found = json && json.ok ? json.user : null;
      // store token and user for sidebar and subsequent requests
      if (json && json.ok && json.token) {
        try { localStorage.setItem('token', json.token); } catch {}
      }
      if (found) {
        try { localStorage.setItem('user', JSON.stringify(found)); } catch {}
      }
      if (!found) {
        pushToast({ title: 'Not found', description: 'No user with this email', status: 'error' });
        return;
      }

      // if a role is selected, ensure it matches the stored userType
      const selected = String(userType || '').trim().toLowerCase();
      const actual = String(found.userType || '').trim().toLowerCase();
      if (selected && selected !== actual) {
        pushToast({ title: 'Role mismatch', description: `Selected role does not match this account (${actual || 'unknown'})`, status: 'error' });
        return;
      }

      // redirect based on role
      if ((selected || actual) === 'doctor') {
        window.location.assign(window.location.origin + '/doctor-dashboard');
        return;
      }
      if ((selected || actual) === 'patient') {
        window.location.assign(window.location.origin + '/patient-dashboard');
        return;
      }

      pushToast({ title: 'Logged in', description: 'Login successful', status: 'success' });
    } catch (e) {
      setLoading(false);
      pushToast({ title: 'Error', description: 'Unable to reach server', status: 'error' });
    }
  };

  return (
    <Flex align="center" justify="center" minH="100vh" overflowY="auto">
      <Flex w="full" mx="auto" align="stretch">
        <Box
          w={{ base: 'full', md: '40%' }}
          bg="white"
          p={0}
          display="flex"
          alignItems="center"
          borderRightWidth={{ base: 0, md: '1px' }}
          borderRightColor="gray.100"
          borderStyle="solid"
          minH="100vh"
          overflowY="auto"
        >
          <Box w="full" maxW="640px" px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }} color="black">
            <Heading size="2xl" fontWeight="black" mb={2} color="gray.800">HR Hospital</Heading>
            <Text fontSize="lg" color="gray.600" mb={8}>Log in to your account</Text>
            <form onSubmit={handleSubmit}>
              <VStack gap={6} alignItems="stretch">
                <FormControl isRequired>
                  <Input name="email" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} borderRadius="none" borderTop="none" borderLeft="none" borderRight="none" borderBottom="2px solid" borderColor="gray.300" _focus={{ borderColor: 'teal.500', boxShadow: 'none' }} bg="transparent" px={0} py={3} />
                </FormControl>
                <FormControl isRequired>
                  <HStack gap={0}>
                    <Input name="password" placeholder="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} borderRadius="none" borderTop="none" borderLeft="none" borderRight="none" borderBottom="2px solid" borderColor="gray.300" _focus={{ borderColor: 'teal.500', boxShadow: 'none' }} bg="transparent" px={0} py={3} flex={1} />
                    <Button size="sm" onClick={() => setShowPassword((s) => !s)} variant="ghost" ml={2} color="gray.500" _hover={{ color: 'teal.500' }}>{showPassword ? 'Hide' : 'Show'}</Button>
                  </HStack>
                </FormControl>

                <FormControl as="fieldset" isRequired>
                  <Text fontSize="sm" color="gray.500" mb={3}>Login as</Text>
                  <RadioGroup value={userType} onChange={(v) => setUserType(v)}>
                    <HStack gap={6} mt={2}>
                      {['Patient', 'Doctor'].map((type) => {
                        const active = userType === type;
                        return (
                          <Box
                            as="label"
                            key={type}
                            cursor="pointer"
                            borderWidth={1}
                            borderRadius="md"
                            px={6}
                            py={3}
                            bg={active ? 'teal.50' : 'transparent'}
                            borderColor={active ? 'teal.400' : 'gray.200'}
                            transition="all 0.2s"
                            _hover={{ borderColor: active ? 'teal.500' : 'gray.300', bg: active ? 'teal.100' : 'gray.50' }}
                            display="flex"
                            alignItems="center"
                            gap={3}
                          >
                            <Radio value={type} colorScheme="teal" />
                            <Text as="span" fontWeight={active ? 'semibold' : 'medium'}>{type}</Text>
                          </Box>
                        );
                      })}
                    </HStack>
                  </RadioGroup>
                </FormControl>

                <Button bg="black" color="white" type="submit" isLoading={loading} width="full" py={4} fontSize="md" fontWeight="semibold" borderRadius="md">Log in</Button>

                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Don't have an account?{' '}
                  <Text as="span" color="teal.600" fontWeight="semibold" cursor="pointer" onClick={() => window.location.assign(window.location.origin + '/signup')}>
                    Sign up
                  </Text>
                </Text>
              </VStack>
            </form>
          </Box>
        </Box>
  <Box w={{ base: '0', md: '60%' }} display={{ base: 'none', md: 'block' }} bgImage={`url(${bgImage})`} bgSize="cover" bgPos="center right" minH="100vh" flexShrink={0} />
      </Flex>
    </Flex>
  );
};

export default Login;
