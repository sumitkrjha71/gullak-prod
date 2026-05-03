// Root index — middleware handles locale redirect; this is just a fallback.
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/en');
}
