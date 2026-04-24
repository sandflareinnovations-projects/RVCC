import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="mb-6 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-amber-600" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">RVCC</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Leading the industry with sustainable practices and precision engineering. Building
              structures that stand the test of time.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
              Company
            </h4>
            <ul className="space-y-2">
              {["About Us", "Our Team", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-500"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
              Services
            </h4>
            <ul className="space-y-2">
              {["Commercial", "Residential", "Renovation", "Design-Build"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-500"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 md:flex-row dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} RVCC Construction Company. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
