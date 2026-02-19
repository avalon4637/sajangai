export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">사장.ai</h1>
          <p className="text-muted-foreground text-sm mt-1">
            소상공인을 위한 AI 경영 도우미
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
