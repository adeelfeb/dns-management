export async function getServerSideProps(context) {
  const r = context.query.redirect;
  const params = new URLSearchParams();
  if (r) params.set('redirect', Array.isArray(r) ? r[0] : r);
  const dest = params.toString() ? `/auth?${params.toString()}` : '/auth';
  return { redirect: { destination: dest, permanent: false } };
}

export default function LoginRedirect() {
  return null;
}
