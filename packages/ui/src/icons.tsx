import { FaFacebook, FaHardHat } from "react-icons/fa";
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiMenu,
  FiMoon,
  FiPhone,
  FiSun,
  FiX,
} from "react-icons/fi";

export const Icons = {
  Menu: FiMenu,
  Close: FiX,
  Linkedin: FiLinkedin,
  Instagram: FiInstagram,
  Facebook: FaFacebook,
  Moon: FiMoon,
  Sun: FiSun,
  ArrowRight: FiArrowRight,
  ChevronRight: FiChevronRight,
  MapPin: FiMapPin,
  Phone: FiPhone,
  Mail: FiMail,
  Clock: FiClock,
  Check: FiCheckCircle,
  Construction: FaHardHat,
};

export type IconType = keyof typeof Icons;
