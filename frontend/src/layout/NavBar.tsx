import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Spinner,
  Button,
  HStack,
  VStack,
  Link as CLink,
  IconButton,
  Avatar,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { checkIsDoctor, checkIsPatient, getUserFromToken } from '../utils/auth';
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

type User = {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  role?: string;
  userType?: string;
  type?: string;
  roles?: string[];
  isDoctor?: boolean;
  isPatient?: boolean;
};

const getImageUrl = (p?: string) => {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `http://localhost:5000${p}`;
};

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { isOpen, onToggle } = useDisclosure();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          if (json?.ok && json.user && mounted) {
            setUser(json.user);
            localStorage.setItem("user", JSON.stringify(json.user));
          }
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (mounted) setUser(null);
          window.location.assign("/login");
          return;
        }
      } catch (e) {
        console.error("navbar: fetch failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.assign("/login");
  };

  // smart Home handler
  const handleHomeClick = (e?: React.MouseEvent) => {
    e?.preventDefault();

    const raw =
      user ||
      (localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") as string)
        : null);
    const u: any = raw || null;

    if (!u) {
      navigate("/");
      return;
    }

  const isDoctor = checkIsDoctor(u);
  const isPatient = checkIsPatient(u);

    if (isDoctor) {
      navigate("/doctor-dashboard");
      return;
    }

    if (isPatient) {
      navigate("/patient-dashboard");
      return;
    }

    navigate("/");
  };

  const NavLink = ({
    to,
    children,
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <CLink
      as={RouterLink}
      to={to}
      position="relative"
      fontSize="sm"
      fontWeight="medium"
      color="gray.200"
      _hover={{
        color: "teal.300",
        "&::after": { width: "100%" },
      }}
      _after={{
        content: '""',
        position: "absolute",
        bottom: "-4px",
        left: 0,
        width: "0%",
        height: "2px",
        bg: "teal.300",
        transition: "width 0.3s ease",
      }}
    >
      {children}
    </CLink>
  );

  return (
    <Box
      as="header"
      w="full"
      bg="gray.900"
      px={{ base: 4, md: 8 }}
      py={3}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
  {/* Logo */}
  <CLink /*onClick={handleHomeClick}*/ _hover={{ textDecoration: "none", cursor: 'pointer' }}>
          <Text
            fontWeight="extrabold"
            fontSize="2xl"
            letterSpacing="wide"
            color="teal.300"
          >
            Medi
            <Box as="span" color="white">
              Mind
            </Box>
          </Text>
  </CLink>

        {/* Desktop nav */}
        <HStack spacing={8} display={{ base: "none", md: "flex" }}>
          <CLink
            onClick={handleHomeClick}
            position="relative"
            fontSize="sm"
            fontWeight="medium"
            color="gray.200"
            _hover={{ color: "teal.300" }}
          >
            Home
          </CLink>
          {(() => {
            const raw = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null) || getUserFromToken();
            const isDoc = checkIsDoctor(raw);
            const articlesPath = isDoc ? '/blogs/doctor' : '/blogs';
            return <NavLink to={articlesPath}>Articles</NavLink>;
          })()}
          <NavLink to="/about">About</NavLink>
        </HStack>

        {/* Right side */}
        <Flex align="center" gap={4}>
          {loading ? (
            <Spinner size="sm" color="teal.300" />
          ) : (
            <>
              {user && (
                <Flex
                  align="center"
                  gap={3}
                  display={{ base: "none", md: "flex" }}
                >
                  <Avatar
                    size="sm"
                    name={`${user.firstName} ${user.lastName}`}
                    src={
                      user?.profileImage
                        ? getImageUrl(user.profileImage)
                        : undefined
                    }
                    border="2px solid"
                    borderColor="teal.300"
                  />
                  <Box>
                    <Text fontSize="sm" fontWeight={600} color="white">
                      {`${user.firstName || ""} ${user.lastName || ""}`}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {user?.email}
                    </Text>
                  </Box>
                </Flex>
              )}

              {user ? (
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="solid"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Button as={RouterLink} to="/login" size="sm" colorScheme="teal">
                  Sign in
                </Button>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <IconButton
            aria-label="menu"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            display={{ md: "none" }}
            onClick={onToggle}
            variant="ghost"
            color="white"
          />
        </Flex>
      </Flex>

      {/* Mobile menu */}
      <Collapse in={isOpen} animateOpacity>
        <Box bg="gray.800" px={4} py={4} display={{ md: "none" }}>
          <VStack align="stretch" spacing={4}>
            <CLink onClick={handleHomeClick}>Home</CLink>
            {(() => {
              const raw = user || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null) || getUserFromToken();
              const isDoc = checkIsDoctor(raw);
              const articlesPath = isDoc ? '/blogs/doctor' : '/blogs';
              return <NavLink to={articlesPath}>Articles</NavLink>;
            })()}
            <NavLink to="/about">About</NavLink>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}
