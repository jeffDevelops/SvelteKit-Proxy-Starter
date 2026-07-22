// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, User } from 'better-auth/types'

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | null
      // role comes from the better-auth admin plugin (user | admin)
      user: (User & { role?: string | null }) | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
