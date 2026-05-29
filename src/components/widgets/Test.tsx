import { useEffect, useState } from 'react'

export default function Test() {
  const [counter, setCounter] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-red">
      Counter: -
      {' '}
      {counter}
    </div>
  )
}
