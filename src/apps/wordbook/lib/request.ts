/**
 * 统一的客户端请求封装，自动解包 { data } 并抛出业务错误
 */
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `请求失败 (${res.status})`)
  }
  return (json as { data: T }).data
}
