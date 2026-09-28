import { passwordRules } from '../utils/passwordRules'

// Shows each password rule with a check/cross that updates as the user types.
function PasswordRequirements({ password }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
      {passwordRules.map((rule) => {
        const met = rule.test(password)
        return (
          <li
            key={rule.label}
            className={met ? 'text-green-600' : 'text-gray-500'}
          >
            {met ? '✓' : '○'} {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

export default PasswordRequirements
