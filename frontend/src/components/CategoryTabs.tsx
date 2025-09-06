import { HStack, Button } from '@chakra-ui/react';

const CATEGORIES = ['All', 'Mental Health', 'Heart Disease', 'Covid19', 'Immunization'];

type Props = {
  value: string;
  onChange: (c: string) => void;
};

export default function CategoryTabs({ value, onChange }: Props) {
  return (
    <HStack spacing={3} wrap="wrap">
      {CATEGORIES.map((c) => (
        <Button key={c} size="sm" variant={value === c ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => onChange(c)}>{c}</Button>
      ))}
    </HStack>
  );
}
