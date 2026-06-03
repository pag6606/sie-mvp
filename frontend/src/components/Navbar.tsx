import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  role: 'admin' | 'docente' | 'estudiante'
  extra?: React.ReactNode
}

export default function Navbar({ role, extra }: NavbarProps) {
  const navigate = useNavigate()
  const homePath = `/${role}`

  return (
    <nav className="flex h-16 items-center justify-between border-b bg-white px-8">
      <h1
        className="cursor-pointer text-xl font-bold text-gray-900"
        onClick={() => navigate(homePath)}
      >
        SIE
      </h1>
      <div className="flex items-center gap-4">
        {extra}
        <button
          onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
          className="text-sm text-red-500 hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
