import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Button,
  HStack,
  VStack,
  Image,
  Stack,
  Spinner,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomToast } from '../components/ui/toast';
import { resizeImageFile } from '../utils/image';

const CATEGORIES = ['Mental Health', 'Heart Disease', 'Covid19', 'Immunization'];

type BlogPayload = {
  title: string;
  summary: string;
  content: string;
  category?: string;
  draft?: boolean;
  isDraft?: boolean;
  status?: string;
};

export default function DoctorBlogForm() {
  const { id } = useParams(); // optional id for edit
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string | undefined>(CATEGORIES[0]);
  // draft state removed (we use submit(draftFlag) directly)
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useCustomToast();
  const navigate = useNavigate();
  // responsive helpers available if needed

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/blogs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        if (mounted) {
          setTitle(json.title || '');
          setSummary(json.summary || '');
          setContent(json.content || '');
          setCategory(json.category || CATEGORIES[0]);
            // respect backend flags if present (no local draft state used)
            // json.isDraft/json.draft/json.status will be used by the list/detail components
          if (json.image) setPreview(json.image.startsWith('http') ? json.image : `http://localhost:5000${json.image}`);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Could not load blog', status: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      // clear
    };
  }, [id, toast]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    // client-side validation: max 2MB
    const MAX = 2 * 1024 * 1024;
    if (f.size > MAX) {
      setErrors((s) => ({ ...s, file: 'Image must be smaller than 2MB' }));
      return;
    } else {
      setErrors((s) => ({ ...s, file: '' }));
    }
    setFile(f);
    const r = new FileReader();
    r.onload = () => setPreview(r.result as string);
    r.readAsDataURL(f);
  }

  async function submit(draftFlag: boolean) {
  // client-side validation
  const nextErrors: Record<string, string> = {};
  if (!title.trim()) nextErrors.title = 'Title is required';
  if (!summary.trim()) nextErrors.summary = 'Summary is required';
  if (!content.trim()) nextErrors.content = 'Content is required';
  if (!category || !CATEGORIES.includes(category)) nextErrors.category = 'Please choose a category';
  if (file && file.size > 2 * 1024 * 1024) nextErrors.file = 'Image must be smaller than 2MB';
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length) return;

  setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let res: Response;
      if (file) {
        // 1) create the blog without the file to obtain blog id
  const payload: BlogPayload = { title, summary, content, category, draft: draftFlag, isDraft: draftFlag, status: draftFlag ? 'draft' : 'published' };
  const createUrl = id ? `http://localhost:5000/blogs/${id}` : 'http://localhost:5000/blogs';
  // debug: inspect payload sent to server when saving/creating
  // eslint-disable-next-line no-console
  console.debug('DoctorBlogForm -> creating blog with payload:', payload, 'to', createUrl);
  res = await fetch(createUrl, {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Save failed');
        const created = await res.json();
        const createdId = created?.data?.id || created?.id;
        if (!createdId) throw new Error('No blog id returned');

        // 2) upload image to /upload with type=blogs and blogId
        const fd = new FormData();
        try {
          const resized = await resizeImageFile(file, 1200, 1200, 0.8);
          const resizedFile = new File([resized], file.name.replace(/\s+/g, '-'), { type: 'image/jpeg' });
          fd.append('profileImage', resizedFile);
        } catch (err) {
          console.warn('resize failed, uploading original file', err);
          fd.append('profileImage', file);
        }
        fd.append('type', 'blogs');
        fd.append('blogId', String(createdId));

        try {
          const uploadRes = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: fd,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          } as any);

          if (!uploadRes.ok) {
            // non-fatal: the blog was created, but image failed to upload
            const txt = await uploadRes.text().catch(() => '');
            toast({ title: 'Image upload failed', description: txt || 'Image upload failed, blog created without image', status: 'warning' });
            if (draftFlag) navigate('/blogs/doctor');
            else navigate(`/blogs/${createdId}`);
            return;
          }

          const uploadJson = await uploadRes.json().catch(() => null);
          const returnedBlog = uploadJson?.db || null;
          if (draftFlag) {
            navigate('/blogs/doctor');
          } else {
            navigate(`/blogs/${returnedBlog?.id || createdId}`);
          }
          return;
        } catch (uploadErr) {
          console.error('upload error', uploadErr);
          toast({ title: 'Image upload failed', description: 'Saved blog but image upload failed', status: 'warning' });
          if (draftFlag) navigate('/blogs/doctor');
          else navigate(`/blogs/${createdId}`);
          return;
        }
      } else {
  const payload: BlogPayload = { title, summary, content, category, draft: draftFlag, isDraft: draftFlag, status: draftFlag ? 'draft' : 'published' };
        const url = id ? `http://localhost:5000/blogs/${id}` : 'http://localhost:5000/blogs';
        res = await fetch(url, {
          method: id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        });
      }
  if (!res.ok) throw new Error('Save failed');
  const json = await res.json().catch(() => null);
  const createdId = json?.data?.id || json?.id;
  toast({ title: draftFlag ? 'Saved as draft' : 'Published', description: draftFlag ? 'Draft saved' : 'Blog published', status: 'success' });
  // If no file was uploaded, navigate to the doctor's list for drafts, otherwise to the blog detail
  if (draftFlag) navigate('/blogs/doctor');
  else navigate(`/blogs/${createdId || ''}`);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Unable to save blog', status: 'error' });
    } finally {
      setLoading(false);
    }
  }

  if (loading && id) return <Spinner />;

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">{id ? 'Edit Blog' : 'New Blog'}</Heading>
      </HStack>
      <form onSubmit={(e) => e.preventDefault()}>
        <VStack align="stretch" spacing={4} maxW="900px">
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <Box color="red.400" fontSize="sm">{errors.title}</Box>}
          </FormControl>

          <FormControl>
            <FormLabel>Image</FormLabel>
            <input id="doctor-blog-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <HStack>
              <Button size="sm" onClick={() => document.getElementById('doctor-blog-image')?.click()}>Choose file</Button>
              <Box fontSize="sm" color="gray.500">{file ? file.name : (preview ? 'Current image' : 'No file chosen')}</Box>
            </HStack>
            {errors.file && <Box color="red.400" fontSize="sm">{errors.file}</Box>}
            {preview && <Image src={preview} alt="preview" maxH="220px" mt={2} objectFit="cover" borderRadius="md" />}
          </FormControl>

          <FormControl>
            <FormLabel>Category</FormLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {errors.category && <Box color="red.400" fontSize="sm">{errors.category}</Box>}
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Summary</FormLabel>
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
            {errors.summary && <Box color="red.400" fontSize="sm">{errors.summary}</Box>}
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Content</FormLabel>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} />
            {errors.content && <Box color="red.400" fontSize="sm">{errors.content}</Box>}
          </FormControl>

          <HStack spacing={3}>
            <Button variant="outline" onClick={() => submit(true)} isLoading={loading}>
              Save as draft
            </Button>
            <Button colorScheme="teal" onClick={() => submit(false)} isLoading={loading}>
              Publish
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}
