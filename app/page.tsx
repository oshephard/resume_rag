export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Resume RAG
        </h1>
        <p className="text-center text-lg text-gray-600">
          An AI resume assistant that helps you curate your resume using your experience, 
          the positions you&apos;re interested in, and the directives you provide it.
        </p>
      </div>
    </main>
  );
}

