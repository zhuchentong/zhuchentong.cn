import { map } from 'nanostores'
import { persistentAtom } from '@nanostores/persistent'

interface User {
  name?: string
}

const token = persistentAtom<string>('token', '')
const user = map<User>({})

function updateUserToken(value: string) {
  token.set(value)
}

function updateUser(value: User) {
  user.set(value)
}

export {
  user,
  token,
  updateUser,
  updateUserToken,
}
