export async function getServerSideProps(context) {
  const r = context.query.redirect;
  const params = new URLSearchParams();
  params.set('mode', 'signup');
  if (r) params.set('redirect', Array.isArray(r) ? r[0] : r);
  return { redirect: { destination: `/auth?${params.toString()}`, permanent: false } };
}

export default function SignupRedirect() {
  return null;
}
