// Sign-in lives on the profile page. This route is kept for old links.
export default function SignIn() {
  return null;
}

export function getServerSideProps() {
  return { redirect: { destination: '/profile', permanent: false } };
}
