import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-amber-600" />
              <span className="text-xl font-bold text-zinc-900 dark:text-white">RVCC</span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xs text-sm leading-relaxed">
              Leading the industry with sustainable practices and precision engineering. Building structures that stand the test of time.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {["About Us", "Our Team", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-500 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 uppercase tracking-wider">Services</h4>
            <ul className="space-y-2">
              {["Commercial", "Residential", "Renovation", "Design-Build"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-500 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} RVCC Construction Company. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <Link key={item} href="#" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
