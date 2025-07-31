import 'tailwindcss/types/config'

declare module 'tailwindcss/types/config' {
  interface Config {
    daisyui?: {
      themes?: string[]
    }
  }
}
