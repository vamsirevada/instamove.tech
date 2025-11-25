export function Footer() {
  return (
    <footer className="w-full py-4 mt-auto border-t border-border/40 bg-transparent relative z-10">
      <div className="container flex flex-col items-center justify-center gap-2 md:flex-row mx-auto">
        <p className="text-sm text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} InstaMovie. Designed by{' '}
          <span className="font-medium text-foreground hover:text-primary transition-colors cursor-default">
            vdhoniii.dev
          </span>
        </p>
      </div>
    </footer>
  )
}
