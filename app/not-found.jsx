export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-400 mb-4">Page not found</p>
      <a href="/" className="text-blue-400 hover:underline">
        Go home
      </a>
    </div>
  )
}
