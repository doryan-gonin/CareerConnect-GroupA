// Placeholder screen shown after a successful login, until real
// dashboard/profile pages exist.
function LoggedInScreen({ onLogout }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">You're logged in 🎉</h1>
      <p className="text-gray-600">This is a placeholder home screen.</p>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
      >
        Log out
      </button>
    </div>
  )
}

export default LoggedInScreen
