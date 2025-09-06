import React, { useState } from 'react';
import * as yup from 'yup';
import {
  Box,
  Heading,
  Input,
  Textarea,
  Button,
  VStack,
  Image,
  HStack,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Divider,
  Badge,
  Spinner,
  useColorModeValue,
  Text,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useCustomToast } from '../components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { resizeImageFile } from '../utils/image';
import { checkIsDoctor } from '../utils/auth';

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function CreateBlog() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const pushToast = useCustomToast();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const CATEGORIES = ['Mental Health', 'Heart Disease', 'Covid19', 'Immunization'];
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Yup validation schema
  const createBlogSchema = yup.object({
    title: yup.string().trim().required('Title is required'),
    category: yup.string().required('Please select a category'),
    summary: yup.string().trim().required('Summary is required').test('max-words', 'Summary must be 50 words or less', (v) => {
      if (!v) return false;
      const count = String(v).split(/\s+/).filter(Boolean).length;
      return count <= 50;
    }),
    content: yup.string().trim().required('Content is required'),
    file: yup.mixed().test('fileSize', 'Image must be smaller than 8MB', (value) => {
      if (!value) return true; // optional
      try {
        return (value as File).size <= 8 * 1024 * 1024;
      } catch (e) {
        return true;
      }
    }),
  });

  // determine user role from localStorage; only doctors can create blogs
  let rawUser: any = null;
  try {
    rawUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  } catch (e) {
    rawUser = null;
  }

  const isDoctor = checkIsDoctor(rawUser);
  // role detection handled elsewhere

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function submit(draft = false) {
    // client-side validation using Yup
    try {
      await createBlogSchema.validate({ title, category, summary, content, file }, { abortEarly: false });
      setErrors({});
    } catch (validationErr: any) {
      const nextErrors: Record<string, string> = {};
      if (validationErr && Array.isArray(validationErr.inner) && validationErr.inner.length) {
        validationErr.inner.forEach((e: any) => {
          if (e.path) nextErrors[e.path] = e.message;
        });
      } else if (validationErr && validationErr.path) {
        nextErrors[validationErr.path] = validationErr.message;
      } else if (validationErr && validationErr.message) {
        nextErrors._form = validationErr.message;
      }
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
  let res: Response;
      // Some backends expect JSON body parsing and do not handle multipart/form-data.
      // To ensure req.body is defined on the server, send JSON. If there's an image,
      // embed it as a base64 data URL (resized first).
  const payload: any = { title, summary, content, category, draft: draft ? true : false, isDraft: draft ? true : false };
      if (file) {
        try {
          const resizedBlob = await resizeImageFile(file, 1200, 1200, 0.8);
          const blobToDataUrl = (b: Blob) => new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = (e) => reject(e);
            r.readAsDataURL(b);
          });
          const dataUrl = await blobToDataUrl(resizedBlob);
          payload.image = dataUrl;
          payload.imageName = file.name.replace(/\s+/g, '-');
        } catch (err) {
          console.warn('Image resize/convert failed, attempting to include original as base64', err);
          try {
            const r = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              r.onload = () => resolve(r.result as string);
              r.onerror = (e) => reject(e);
              r.readAsDataURL(file as Blob);
            });
            payload.image = dataUrl;
            payload.imageName = file.name.replace(/\s+/g, '-');
          } catch (e) {
            console.error('Failed to convert image to data URL', e);
          }
        }
      }

      // debug: inspect payload for create/update
      // eslint-disable-next-line no-console
      console.debug('CreateBlog -> saving blog with payload:', payload, 'id:', id);
      const url = id ? `http://localhost:5000/blogs/${id}` : 'http://localhost:5000/blogs';
      const method = id ? 'PUT' : 'POST';
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
  setLoading(false);
  const resultJson = await res.json().catch(() => null);
  if (!res.ok) {
        if (res.status === 403) {
          pushToast({ title: 'Forbidden', description: 'Only doctors can create blogs', status: 'error' });
          // optional redirect
          setTimeout(() => { window.location.assign(window.location.origin + '/'); }, 1200);
          return;
        }
        // try to surface server message
        let msg = 'Failed to create blog';
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const j = await res.json();
            msg = j.message || j.error || JSON.stringify(j);
          } else {
            const t = await res.text();
            if (t) msg = t;
          }
        } catch (e) {
          // ignore parsing errors
        }
  pushToast({ title: `Error ${res.status}`, description: msg, status: 'error' });
        return;
      }
  pushToast({ title: draft ? 'Saved as draft' : 'Created', description: draft ? 'Draft saved' : 'Blog created', status: 'success' });
      const createdId = resultJson?.data?.id || resultJson?.id || id;

      // If a file was chosen, and we have an id, upload it via /upload (non-fatal)
      if (file && createdId) {
        const fd = new FormData();
        // append metadata first so multer's storage.destination sees `type` and uses the correct subfolder
        fd.append('type', 'blogs');
        fd.append('blogId', String(createdId));
        try {
          const resizedBlob = await resizeImageFile(file, 1200, 1200, 0.8);
          const resizedFile = new File([resizedBlob], file.name.replace(/\s+/g, '-'), { type: 'image/jpeg' });
          fd.append('profileImage', resizedFile);
        } catch (err) {
          fd.append('profileImage', file);
        }
        try {
          const uploadRes = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: fd,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          } as any);
          if (!uploadRes.ok) {
            const txt = await uploadRes.text().catch(() => '');
            pushToast({ title: 'Image upload failed', description: txt || 'Saved blog but image upload failed', status: 'warning' });
            if (draft) navigate('/blogs/doctor');
            else navigate(`/blogs/${createdId}`);
            return;
          }
          const uploadJson = await uploadRes.json().catch(() => null);
          const returnedBlog = uploadJson?.db || uploadJson?.data || uploadJson?.blog || null;
          if (returnedBlog && returnedBlog.imageUrl) {
            const img = returnedBlog.imageUrl;
            setPreview(img.startsWith('http') ? img : `http://localhost:5000${img}`);
          }
          const finalId = returnedBlog?.id || returnedBlog?._id || createdId;
          if (draft) navigate('/blogs/doctor');
          else navigate(`/blogs/${finalId}`);
          return;
        } catch (uploadErr) {
          console.error('upload error', uploadErr);
          pushToast({ title: 'Image upload failed', description: 'Saved blog but image upload failed', status: 'warning' });
          if (draft) navigate('/blogs/doctor');
          else navigate(`/blogs/${createdId}`);
          return;
        }
      }

      if (draft) navigate('/blogs/doctor');
      else navigate(`/blogs/${createdId || ''}`);
    } catch (err) {
      setLoading(false);
  const message = (err && (err as any).message) ? (err as any).message : 'Unable to reach server';
  pushToast({ title: 'Network Error', description: message, status: 'error' });
    }
  }

  const cardBg = useColorModeValue('white', 'gray.700');

  if (!isDoctor) {
    return (
      <Flex justify="center" p={6}>
        <Box w={{ base: '100%', md: '700px' }} bg={cardBg} boxShadow="md" borderRadius="md" p={6} textAlign="center">
          <Heading size="md" mb={2}>Access denied</Heading>
          <Text mb={4}>Only doctors can create blog posts. If you are a doctor, please sign in with the correct account.</Text>
          <Button onClick={() => window.location.assign(window.location.origin + '/')} colorScheme="teal">Go to home</Button>
        </Box>
      </Flex>
    );
  }

  // removed dev debug panel

  // if editing, load existing blog
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadingExisting(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/blogs/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) throw new Error('Failed to load blog');
        const json = await res.json().catch(() => null);
        const existing = json?.data || json?.blog || json || null;
        if (!mounted) return;
        setTitle(existing?.title || '');
        setSummary(existing?.summary || '');
        setContent(existing?.content || '');
        setCategory(existing?.category || CATEGORIES[0]);
        if (existing?.imageUrl || existing?.image) {
          const img = existing.imageUrl || existing.image;
          setPreview(img.startsWith('http') ? img : `http://localhost:5000${img}`);
        }
      } catch (e) {
        console.error('Load existing blog failed', e);
        pushToast({ title: 'Error', description: 'Could not load blog for editing', status: 'error' });
      } finally {
        if (mounted) setLoading(false);
        setLoadingExisting(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  return (
    <Flex justify="center" p={6}>
      <Box w={{ base: '100%', md: '900px' }} bg={cardBg} boxShadow="md" borderRadius="md" p={6}>
        <Flex align="center" mb={4}>
          <Heading size="lg">{id ? 'Edit Blog' : 'Create Blog'}</Heading>
          <Spacer />
          <Badge colorScheme={id ? 'yellow' : 'green'}>{id ? 'Edit' : 'New'}</Badge>
          {loadingExisting && <Spinner size="sm" ml={3} />}
        </Flex>

        <Divider mb={6} />

        <form onSubmit={(e) => e.preventDefault()}>
          {/* dev debug panel removed */}
          <VStack align="stretch" spacing={4}>
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a concise, descriptive title"
              />
              <FormHelperText>Short, clear titles perform better.</FormHelperText>
              {errors.title && <Text color="red.400" fontSize="sm">{errors.title}</Text>}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              {errors.category && <Text color="red.400" fontSize="sm">{errors.category}</Text>}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Summary</FormLabel>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Short summary (approx. 15 words)" />
              <FormHelperText>Keep the summary concise — we display the first 50 words in listings.</FormHelperText>
              {errors.summary && <Text color="red.400" fontSize="sm">{errors.summary}</Text>}
            </FormControl>

            <FormControl>
              <FormLabel>Feature image</FormLabel>
              <input
                id="blog-image-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e as any)}
              />

              <Box
                borderWidth={1}
                borderStyle="dashed"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                borderRadius="md"
                p={4}
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.500">{file ? file.name : 'No image selected'}</Text>
                  <Button size="sm" onClick={() => document.getElementById('blog-image-input')?.click()}>
                    {file ? 'Change' : 'Choose image'}
                  </Button>
                </HStack>
                {preview ? (
                  <Box mt={3} borderRadius="md" overflow="hidden">
                    <Image src={preview} alt="preview" w="100%" maxH="320px" objectFit="cover" />
                  </Box>
                ) : (
                  <Text mt={3} fontSize="sm" color="gray.400">Recommended: 1200×800, JPG/PNG</Text>
                )}
                {errors.file && <Text color="red.400" fontSize="sm" mt={2}>{errors.file}</Text>}
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Content</FormLabel>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} placeholder="Write the full article here..." />
              <FormHelperText>Use headings and short paragraphs for readability.</FormHelperText>
              {errors.content && <Text color="red.400" fontSize="sm">{errors.content}</Text>}
            </FormControl>

            <Divider />

            <HStack spacing={3} justify="flex-end">
              <Button variant="outline" colorScheme="gray" onClick={() => submit(true)} isLoading={loading}>
                Save as draft
              </Button>
              <Button colorScheme="teal" onClick={() => submit(false)} isLoading={loading}>
                Publish
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
