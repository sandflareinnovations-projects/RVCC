import Link from "next/link";

import { Button } from "@ui/Button";

export const Navbar = () => {
  return (
    <header className="border-b bg-white">
      <nav className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Logo
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="#services" className="text-sm">
            Services
          </Link>
          <Link href="#projects" className="text-sm">
            Projects
          </Link>
          <Button href="#contact">Contact</Button>
        </div>
      </nav>
    </header>
  );
};
