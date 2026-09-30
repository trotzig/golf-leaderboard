import SignInPage from '../src/SignInPage.js';
import profileProps from '../src/profileProps.js';

export default SignInPage;

export function getServerSideProps({ req }) {
  return profileProps({ req });
}
