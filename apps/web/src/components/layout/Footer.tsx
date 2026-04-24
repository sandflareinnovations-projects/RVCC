export const Footer = () => {
  return (
    <footer className="bg-background border-t py-16">
      <div className="container flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-brand-blue text-2xl font-black tracking-tighter">RVCC</span>
          <p className="slogan text-muted text-[10px] tracking-[0.2em]">
            WHERE IDEAS ARE SHAPED TO REALITY
          </p>
        </div>
        <div className="text-muted text-center text-sm md:text-right">
          <p>&copy; {new Date().getFullYear()} RVCC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
