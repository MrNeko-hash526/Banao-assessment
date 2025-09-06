import { HStack, Button, useColorModeValue, Box } from '@chakra-ui/react';

const categories = ['All', 'Mental Health', 'Heart Disease', 'Covid-19', 'Immunization'];

export default function CategoryTabs({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const pillBg = useColorModeValue('gray.50', 'gray.700');
  return (
    <Box bg={pillBg} px={3} py={2} borderRadius="full">
      <HStack spacing={2} wrap="wrap" role="tablist" aria-label="Article categories">
        {categories.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={value === c ? 'solid' : 'ghost'}
            colorScheme={value === c ? 'teal' : 'gray'}
            onClick={() => onChange(c)}
            role="tab"
            aria-selected={value === c}
          >
            {c}
          </Button>
        ))}
      </HStack>
    </Box>
  );
}
