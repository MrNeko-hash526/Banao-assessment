import React, { useState } from 'react';
import bgImage from '../assets/image4.png';
import { Box, Button, Flex, Heading, Input, HStack, Text, VStack, SimpleGrid } from '@chakra-ui/react';

import { FormControl,  FormErrorMessage } from '@chakra-ui/form-control';
import { Radio, RadioGroup } from '@chakra-ui/radio';
import * as yup from 'yup';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  userType: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  profileImage?: string;
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  userType: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
  profileImage: '',
};

const schema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .matches(/^[A-Za-z'\- ]+$/, 'Use letters, spaces, apostrophes or hyphens only'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .matches(/^[A-Za-z'\- ]+$/, 'Use letters, spaces, apostrophes or hyphens only'),
  email: yup.string().email('Invalid email').required('Email is required'),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/, 'Use letters, numbers, dot, underscore or hyphen'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/(?=.*[A-Z])/, 'Include at least one uppercase letter')
    .matches(/(?=.*[0-9])/, 'Include at least one number')
    .matches(/(?=.*[!@#$%^&*])/, 'Include at least one special character (!@#$%^&*)'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Confirm your password'),
  userType: yup.string().required('User type is required'),
  addressLine1: yup.string().required('Address line 1 is required').min(5, 'Address is too short'),
  city: yup.string().required('City is required').matches(/^[A-Za-z ]+$/, 'Use letters only'),
  state: yup.string().required('State is required').matches(/^[A-Za-z ]+$/, 'Use letters only'),
  pincode: yup.string().required('Pincode is required').matches(/^[0-9]{4,6}$/, 'Enter a valid pincode'),
});

import { useCustomToast } from '../components/ui/toast';

const Signup: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const pushToast = useCustomToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setProfileFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) setForm((s) => ({ ...s, profileImage: result }));
    };
    reader.readAsDataURL(f);
  };

  

  const toggleShow = () => setShowPassword((s) => !s);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await schema.validate(form, { abortEarly: false });
      setErrors({});
      setIsSubmitting(true);
      setTimeout(async () => {
        try {
          const { confirmPassword, ...payloadToSend } = form;
          let res;
          if (profileFile) {
            const fd = new FormData();
            // append file
            fd.append('profileImage', profileFile);
            // append other fields
            Object.keys(payloadToSend).forEach((k) => {
              if (k === 'profileImage') return; // skip large preview data URL
              const v = (payloadToSend as Record<string, any>)[k];
              if (v !== undefined && v !== null) fd.append(k, String(v));
            });
            res = await fetch('http://localhost:5000/save-signup', {
              method: 'POST',
              body: fd,
            });
          } else {
            res = await fetch('http://localhost:5000/save-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadToSend),
            });
          }
          setIsSubmitting(false);
          if (res.ok) {
            pushToast({ title: 'Signed up', description: 'Signup saved to backend.', status: 'success' });
            // clear selected file after successful submit
            setProfileFile(null);
            // redirect based on userType
            try {
              const t = (form.userType || '').toLowerCase();
              if (t === 'doctor') {
                window.location.assign(window.location.origin + '/doctor-dashboard');
                return;
              }
              if (t === 'patient') {
                window.location.assign(window.location.origin + '/patient-dashboard');
                return;
              }
            } catch (e) {
              // ignore
            }
          } else if (res.status === 409) {
            pushToast({ title: 'Email taken', description: 'The provided email is already registered.', status: 'error' });
          } else {
            pushToast({ title: 'Signed up', description: 'Server error saving signup.', status: 'warning' });
          }
        } catch (e) {
          setIsSubmitting(false);
          pushToast({ title: 'Signed up', description: 'Server unreachable, signup not stored.', status: 'warning' });
        }
        setForm(initialState);
      }, 800);
    } catch (err) {
      const next: Record<string, string> = {};
      if (err instanceof yup.ValidationError && err.inner) {
        err.inner.forEach((er) => {
          if (er.path) next[er.path] = er.message;
        });
      }
      setErrors(next);
    }
  };
  

  

  const validateField = async (name: string, value: string) => {
    try {
      // validateAt expects the full object, so pass current form with the field updated
      await schema.validateAt(name, { ...form, [name]: value });
      setWarnings((w) => ({ ...w, [name]: '' }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const msg = err.message;
        setWarnings((w) => ({ ...w, [name]: msg }));
      }
    }
  };

  const getWarning = (key: keyof FormState) => {
    const msg = (warnings as Record<string, string>)[key as string];
    if (!msg) return '';
    const val = (form as Record<string, any>)[key as string];
    if (val === undefined || val === null || String(val).trim() === '') return 'Required';
    return msg;
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
            <Heading size="2xl" fontWeight="black" mb={2} color="gray.800">
              HR Hospitals
            </Heading>
            <Text fontSize="lg" color="gray.600" mb={8}>
              Sign up to create your account
            </Text>
            <form onSubmit={handleSubmit}>
              <Box mb={6} textAlign="center">
                <input id="profileImageInput" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <label htmlFor="profileImageInput">
                  <Box
                    as="span"
                    mx="auto"
                    width="96px"
                    height="96px"
                    borderRadius="full"
                    bg="gray.200"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    color="black"
                    style={form.profileImage ? { backgroundImage: `url(${form.profileImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!form.profileImage && (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="3" y="13" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </Box>
                </label>
                <Text fontSize="sm" color="gray.500" mt={2}>Profile image</Text>
              </Box>
              <VStack gap={6} alignItems="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <FormControl isRequired isInvalid={!!errors.firstName}>
                    <Input 
                      name="firstName" 
                      placeholder="First Name"
                      value={form.firstName} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('firstName', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.firstName ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                    {!errors.firstName && getWarning('firstName') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('firstName')}</Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.lastName}>
                    <Input 
                      name="lastName" 
                      placeholder="Last Name"
                      value={form.lastName} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('lastName', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.lastName ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                    {!errors.lastName && getWarning('lastName') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('lastName')}</Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.email}>
                    <Input 
                      name="email" 
                      placeholder="Email"
                      type="email"
                      value={form.email} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('email', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.email ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                    {!errors.email && getWarning('email') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('email')}</Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.username}>
                    <Input 
                      name="username" 
                      placeholder="Username"
                      value={form.username} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('username', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.username ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.username}</FormErrorMessage>
                    {!errors.username && getWarning('username') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('username')}</Text>
                    )}
                  </FormControl>

      <FormControl isRequired isInvalid={!!errors.password}>
                    <HStack gap={0}>
                      <Input 
                        name="password" 
                        placeholder="Password"
                        type={showPassword ? 'text' : 'password'} 
                        value={form.password} 
                        onChange={handleChange}
        onBlur={(e) => validateField('password', e.target.value)}
                        borderRadius="none"
                        borderTop="none"
                        borderLeft="none"
                        borderRight="none"
                        borderBottom="2px solid"
                        borderColor={errors.password ? "red.500" : "gray.300"}
                        _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                        _hover={{ borderColor: "gray.400" }}
                        bg="transparent"
                        px={0}
                        py={3}
                        flex={1}
                      />
                      <Button 
                        size="sm" 
                        onClick={toggleShow}
                        variant="ghost"
                        ml={2}
                        color="gray.500"
                        _hover={{ color: "teal.500" }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </Button>
                    </HStack>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                    {!errors.password && getWarning('password') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('password')}</Text>
                    )}
                  </FormControl>

          <FormControl isRequired isInvalid={!!errors.confirmPassword}>
                    <Input 
                      name="confirmPassword" 
                      placeholder="Confirm Password"
                      type={showPassword ? 'text' : 'password'} 
                      value={form.confirmPassword} 
                      onChange={handleChange}
            onBlur={(e) => validateField('confirmPassword', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.confirmPassword ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    {!errors.confirmPassword && getWarning('confirmPassword') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('confirmPassword')}</Text>
                    )}
                  </FormControl>
                </SimpleGrid>

                <FormControl as="fieldset" isRequired isInvalid={!!errors.userType}>
                  <Text fontSize="sm" color="gray.500" mb={3}>User Type</Text>
                  <RadioGroup value={form.userType} onChange={(v) => { setForm((s) => ({ ...s, userType: v })); validateField('userType', v); }}>
                    <HStack gap={6} mt={2}>
                      {['Patient', 'Doctor'].map((type) => {
                        const active = form.userType === type;
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
                          >
                            <Radio value={type} mr={3} colorScheme="teal" />
                            <Text as="span" fontWeight={active ? 'semibold' : 'medium'}>{type}</Text>
                          </Box>
                        );
                      })}
                    </HStack>
                  </RadioGroup>
                  <FormErrorMessage>{errors.userType}</FormErrorMessage>
                  {!errors.userType && getWarning('userType') && (
                    <Text fontSize="xs" color="red.500" mt={1}>{getWarning('userType')}</Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.addressLine1}>
                  <Input 
                    name="addressLine1" 
                    placeholder="Address Line 1"
                    value={form.addressLine1} 
                    onChange={handleChange}
                    onBlur={(e) => validateField('addressLine1', e.target.value)}
                    borderRadius="none"
                    borderTop="none"
                    borderLeft="none"
                    borderRight="none"
                    borderBottom="2px solid"
                    borderColor={errors.addressLine1 ? "red.500" : "gray.300"}
                    _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                    _hover={{ borderColor: "gray.400" }}
                    bg="transparent"
                    px={0}
                    py={3}
                  />
                  <FormErrorMessage>{errors.addressLine1}</FormErrorMessage>
                  {!errors.addressLine1 && getWarning('addressLine1') && (
                    <Text fontSize="xs" color="red.500" mt={1}>{getWarning('addressLine1')}</Text>
                  )}
                </FormControl>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                  <FormControl isRequired isInvalid={!!errors.city}>
                    <Input 
                      name="city" 
                      placeholder="City"
                      value={form.city} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('city', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.city ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.city}</FormErrorMessage>
                    {!errors.city && getWarning('city') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('city')}</Text>
                    )}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!errors.state}>
                    <Input 
                      name="state" 
                      placeholder="State"
                      value={form.state} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('state', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.state ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.state}</FormErrorMessage>
                    {!errors.state && getWarning('state') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('state')}</Text>
                    )}
                  </FormControl>
                  <FormControl isRequired isInvalid={!!errors.pincode}>
                    <Input 
                      name="pincode" 
                      placeholder="Pincode"
                      value={form.pincode} 
                      onChange={handleChange}
                      onBlur={(e) => validateField('pincode', e.target.value)}
                      borderRadius="none"
                      borderTop="none"
                      borderLeft="none"
                      borderRight="none"
                      borderBottom="2px solid"
                      borderColor={errors.pincode ? "red.500" : "gray.300"}
                      _focus={{ borderColor: "teal.500", boxShadow: "none" }}
                      _hover={{ borderColor: "gray.400" }}
                      bg="transparent"
                      px={0}
                      py={3}
                    />
                    <FormErrorMessage>{errors.pincode}</FormErrorMessage>
                    {!errors.pincode && getWarning('pincode') && (
                      <Text fontSize="xs" color="red.500" mt={1}>{getWarning('pincode')}</Text>
                    )}
                  </FormControl>
                </SimpleGrid>

                      <Button
                        bg="black"
                        color="white"
                        type="submit"
                        loading={isSubmitting}
                        width="full"
                        py={4}
                        fontSize="md"
                        fontWeight="semibold"
                        borderRadius="md"
                        boxShadow={isSubmitting ? undefined : "0 8px 24px rgba(0,0,0,0.12)"}
                        _hover={{ bg: "gray.900", boxShadow: "0 12px 36px rgba(0,0,0,0.16)" }}
                        _active={{ bg: "blackAlpha.800" }}
                      >
                        Sign Up
                      </Button>
              </VStack>
            </form>
          </Box>
        </Box>
        <Box
          w={{ base: '0', md: '60%' }}
          display={{ base: 'none', md: 'block' }}
          bgImage={`url(${bgImage})`}
          bgSize="cover"
          bgPos="center right"
          minH="100vh"
          flexShrink={0}
        />
      </Flex>
    </Flex>
  );
};

export default Signup;
