import { persistentAtom } from '@nanostores/persistent'
import { map } from 'nanostores'

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
  token,
  updateUser,
  updateUserToken,
  user,
}
